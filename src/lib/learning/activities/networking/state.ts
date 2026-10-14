/**
 * 2P-40 — Deterministic educational reachability (no real packets / no real nets).
 */

import type {
  NetworkInterface,
  NetworkState,
} from "./types";

function ipv4ToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((nums[0]! << 24) | (nums[1]! << 16) | (nums[2]! << 8) | nums[3]!) >>> 0;
}

function maskToPrefix(mask: string): number | null {
  const m = ipv4ToInt(mask);
  if (m === null) return null;
  // Count leading ones
  let bits = 0;
  let v = m;
  for (let i = 0; i < 32; i++) {
    if ((v & 0x80000000) === 0) break;
    bits += 1;
    v <<= 1;
  }
  // Require contiguous mask
  if (m !== (bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0)) return null;
  return bits;
}

export function sameSubnet(
  a: Pick<NetworkInterface, "ipAddress" | "subnetMask">,
  b: Pick<NetworkInterface, "ipAddress" | "subnetMask">,
): boolean {
  if (!a.ipAddress || !b.ipAddress || !a.subnetMask || !b.subnetMask) return false;
  if (a.subnetMask !== b.subnetMask) return false;
  const ia = ipv4ToInt(a.ipAddress);
  const ib = ipv4ToInt(b.ipAddress);
  const mask = ipv4ToInt(a.subnetMask);
  if (ia === null || ib === null || mask === null) return false;
  return (ia & mask) === (ib & mask);
}

export function cloneNetworkState(state: NetworkState): NetworkState {
  return {
    nodes: state.nodes.map((n) => ({ ...n })),
    interfaces: state.interfaces.map((i) => ({ ...i })),
    links: state.links.map((l) => ({ ...l })),
  };
}

export function getNodeInterfaces(
  state: NetworkState,
  nodeId: string,
): NetworkInterface[] {
  return state.interfaces.filter((i) => i.nodeId === nodeId);
}

function ifaceById(
  state: NetworkState,
  id: string,
): NetworkInterface | undefined {
  return state.interfaces.find((i) => i.id === id);
}

/** Undirected adjacency of enabled links between enabled interfaces. */
function adjacency(state: NetworkState): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (a: string, b: string) => {
    const list = map.get(a) ?? [];
    list.push(b);
    map.set(a, list);
  };
  for (const link of state.links) {
    if (!link.enabled) continue;
    const from = ifaceById(state, link.fromInterfaceId);
    const to = ifaceById(state, link.toInterfaceId);
    if (!from?.enabled || !to?.enabled) continue;
    add(from.nodeId, to.nodeId);
    add(to.nodeId, from.nodeId);
  }
  return map;
}

function pathExists(
  state: NetworkState,
  fromNodeId: string,
  toNodeId: string,
): boolean {
  if (fromNodeId === toNodeId) return true;
  const adj = adjacency(state);
  const seen = new Set<string>([fromNodeId]);
  const q = [fromNodeId];
  while (q.length) {
    const cur = q.shift()!;
    for (const next of adj.get(cur) ?? []) {
      if (seen.has(next)) continue;
      if (next === toNodeId) return true;
      seen.add(next);
      q.push(next);
    }
  }
  return false;
}

export type ConnectivityResult = {
  ok: boolean;
  reason:
    | "ok"
    | "no_path"
    | "source_iface_disabled"
    | "dest_iface_disabled"
    | "addressing"
    | "gateway"
    | "dns";
  detail: string;
};

/**
 * Educational L3-ish check:
 * - Path of enabled links/interfaces must exist
 * - Source PC needs IP + mask
 * - Same subnet to destination OR reachable via gateway toward remote subnet
 * - Hostname resolve only when dns present (separate helper)
 */
export function checkIpConnectivity(
  state: NetworkState,
  fromNodeId: string,
  toNodeId: string,
): ConnectivityResult {
  const fromIfaces = getNodeInterfaces(state, fromNodeId).filter(
    (i) => i.enabled && i.ipAddress,
  );
  const toIfaces = getNodeInterfaces(state, toNodeId).filter(
    (i) => i.enabled && i.ipAddress,
  );

  if (getNodeInterfaces(state, fromNodeId).every((i) => !i.enabled)) {
    return {
      ok: false,
      reason: "source_iface_disabled",
      detail: "Source interface is disabled.",
    };
  }
  if (getNodeInterfaces(state, toNodeId).every((i) => !i.enabled)) {
    return {
      ok: false,
      reason: "dest_iface_disabled",
      detail: "Destination interface is disabled.",
    };
  }

  if (!pathExists(state, fromNodeId, toNodeId)) {
    return {
      ok: false,
      reason: "no_path",
      detail: "No enabled path between devices.",
    };
  }

  if (!fromIfaces.length || !toIfaces.length) {
    return {
      ok: false,
      reason: "addressing",
      detail: "Missing IP addressing on source or destination.",
    };
  }

  const src = fromIfaces[0]!;
  const dst = toIfaces[0]!;

  if (sameSubnet(src, dst)) {
    return { ok: true, reason: "ok", detail: "Same subnet path is up." };
  }

  // Remote: require gateway configured and on same subnet as source
  if (!src.gateway) {
    return {
      ok: false,
      reason: "gateway",
      detail: "Destination is remote and no gateway is configured.",
    };
  }
  const gwIface = state.interfaces.find(
    (i) =>
      i.enabled &&
      i.ipAddress === src.gateway &&
      sameSubnet(src, { ipAddress: i.ipAddress, subnetMask: src.subnetMask }),
  );
  if (!gwIface) {
    return {
      ok: false,
      reason: "gateway",
      detail: "Gateway is missing or not on the local subnet.",
    };
  }

  // Simplified: if path exists and gateway is local, treat remote as reachable
  // when destination has any address (educational fixture, not full routing).
  if (maskToPrefix(src.subnetMask ?? "") === null) {
    return {
      ok: false,
      reason: "addressing",
      detail: "Subnet mask is invalid.",
    };
  }

  return { ok: true, reason: "ok", detail: "Path via gateway is up." };
}

export function checkHostnameResolve(
  state: NetworkState,
  fromNodeId: string,
): ConnectivityResult {
  const src = getNodeInterfaces(state, fromNodeId).find(
    (i) => i.enabled && i.ipAddress,
  );
  if (!src) {
    return {
      ok: false,
      reason: "addressing",
      detail: "No enabled addressed interface on source.",
    };
  }
  if (!src.dns || !/^\d+\.\d+\.\d+\.\d+$/.test(src.dns)) {
    return {
      ok: false,
      reason: "dns",
      detail: "DNS server is missing or invalid.",
    };
  }
  return { ok: true, reason: "ok", detail: "DNS endpoint is configured." };
}

export function applyInterfacePatch(
  state: NetworkState,
  patch: Partial<NetworkInterface> & { interfaceId: string },
): NetworkState {
  const next = cloneNetworkState(state);
  const iface = next.interfaces.find((i) => i.id === patch.interfaceId);
  if (!iface) return next;
  if (patch.enabled !== undefined) iface.enabled = patch.enabled;
  if (patch.ipAddress !== undefined) iface.ipAddress = patch.ipAddress;
  if (patch.subnetMask !== undefined) iface.subnetMask = patch.subnetMask;
  if (patch.gateway !== undefined) iface.gateway = patch.gateway;
  if (patch.dns !== undefined) iface.dns = patch.dns;
  return next;
}
