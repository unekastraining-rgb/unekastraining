/**
 * 2P-40 — Deterministic networking troubleshooting fixtures (educational only).
 */

import type { NetworkChallenge, NetworkState } from "./types";
import { cloneNetworkState } from "./state";

/** PC — Switch — Router — Server baseline (all healthy). */
function baseCampusTopology(): NetworkState {
  return {
    nodes: [
      { id: "pc-a", type: "PC", label: "PC-A" },
      { id: "sw-1", type: "SWITCH", label: "Switch-1" },
      { id: "rtr-1", type: "ROUTER", label: "Router-1" },
      { id: "srv-1", type: "SERVER", label: "Server-1" },
    ],
    interfaces: [
      {
        id: "pc-a-eth0",
        nodeId: "pc-a",
        name: "eth0",
        ipAddress: "192.168.1.10",
        subnetMask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "192.168.1.1",
        enabled: true,
      },
      {
        id: "sw-1-1",
        nodeId: "sw-1",
        name: "Gi0/1",
        enabled: true,
      },
      {
        id: "sw-1-2",
        nodeId: "sw-1",
        name: "Gi0/2",
        enabled: true,
      },
      {
        id: "rtr-1-lan",
        nodeId: "rtr-1",
        name: "Gi0/0",
        ipAddress: "192.168.1.1",
        subnetMask: "255.255.255.0",
        enabled: true,
      },
      {
        id: "rtr-1-dmz",
        nodeId: "rtr-1",
        name: "Gi0/1",
        ipAddress: "10.0.0.1",
        subnetMask: "255.255.255.0",
        enabled: true,
      },
      {
        id: "srv-1-eth0",
        nodeId: "srv-1",
        name: "eth0",
        ipAddress: "10.0.0.10",
        subnetMask: "255.255.255.0",
        gateway: "10.0.0.1",
        dns: "10.0.0.1",
        enabled: true,
      },
    ],
    links: [
      {
        id: "l1",
        fromInterfaceId: "pc-a-eth0",
        toInterfaceId: "sw-1-1",
        enabled: true,
      },
      {
        id: "l2",
        fromInterfaceId: "sw-1-2",
        toInterfaceId: "rtr-1-lan",
        enabled: true,
      },
      {
        id: "l3",
        fromInterfaceId: "rtr-1-dmz",
        toInterfaceId: "srv-1-eth0",
        enabled: true,
      },
    ],
  };
}

function withFault(mutator: (s: NetworkState) => void): NetworkState {
  const s = cloneNetworkState(baseCampusTopology());
  mutator(s);
  return s;
}

const L1 = {
  level: 1 as const,
  revealPolicy: "ON_REQUEST" as const,
  doesNotRevealAnswer: true as const,
};
const L2 = {
  level: 2 as const,
  revealPolicy: "ON_REQUEST" as const,
  doesNotRevealAnswer: true as const,
};

export const NETWORK_CHALLENGES: NetworkChallenge[] = [
  {
    id: "net-disabled-iface",
    title: "Disabled PC interface",
    objective: "Find the disabled interface and re-enable it so PC-A reaches Server-1.",
    prompt:
      "Educational lab: PC-A cannot reach Server-1. Inspect devices, diagnose, fix, then verify with a simulated ping.",
    symptom: "PC-A reports no connectivity to 10.0.0.10.",
    initialState: withFault((s) => {
      const iface = s.interfaces.find((i) => i.id === "pc-a-eth0")!;
      iface.enabled = false;
    }),
    faultKind: "DISABLED_INTERFACE",
    faultTargetId: "pc-a-eth0",
    checkFromNodeId: "pc-a",
    checkToNodeId: "srv-1",
    expectedInterfacePatch: { interfaceId: "pc-a-eth0", enabled: true },
    diagnosisMustIncludeAny: ["interface", "disabled", "enable", "link", "eth0"],
    difficulty: 2,
    domainTag: "networking",
    conceptHints: ["interface", "connectivity", "enable", "link", "troubleshoot"],
    misconceptionTargets: ["blaming DNS before checking link state"],
    progressionStage: "PRACTICE",
    contextVariant: "pc eth0 disabled",
    contentKey: "net-ws-disabled-iface",
    skillFacet: "APPLY",
    scaffolds: [
      {
        kind: "HINT",
        label: "Where to look",
        content: "Start at the PC’s network interface status before changing DNS.",
        ...L1,
      },
      {
        kind: "HINT",
        label: "Category",
        content: "Is the problem link/interface state, or name resolution?",
        ...L2,
      },
    ],
    successLooksLike: "Interface enabled; simulated ping PC-A → Server-1 succeeds.",
  },
  {
    id: "net-wrong-ip",
    title: "Incorrect PC IP address",
    objective: "Correct PC-A’s IP so it matches the LAN plan (192.168.1.10/24).",
    prompt:
      "PC-A cannot reach Server-1. Addressing looks suspicious. Diagnose and correct the IP, then verify.",
    symptom: "PC-A shows 10.0.0.50/24 and cannot reach Server-1.",
    initialState: withFault((s) => {
      const iface = s.interfaces.find((i) => i.id === "pc-a-eth0")!;
      iface.ipAddress = "10.0.0.50";
    }),
    faultKind: "WRONG_IP",
    faultTargetId: "pc-a-eth0",
    checkFromNodeId: "pc-a",
    checkToNodeId: "srv-1",
    expectedInterfacePatch: {
      interfaceId: "pc-a-eth0",
      ipAddress: "192.168.1.10",
      subnetMask: "255.255.255.0",
      gateway: "192.168.1.1",
    },
    diagnosisMustIncludeAny: ["ip", "address", "wrong", "incorrect", "192.168"],
    difficulty: 2,
    domainTag: "networking",
    conceptHints: ["ip", "address", "lan", "configure", "troubleshoot"],
    misconceptionTargets: ["changing DNS when the IP plan is wrong"],
    progressionStage: "APPLY",
    contextVariant: "pc ip 192.168.1.99",
    contentKey: "net-ws-wrong-ip",
    skillFacet: "APPLY",
    scaffolds: [
      {
        kind: "HINT",
        label: "Compare plan",
        content: "Compare the PC address to the LAN addressing plan on the router LAN interface.",
        ...L1,
      },
    ],
    successLooksLike: "PC IP restored to 192.168.1.10; ping succeeds.",
  },
  {
    id: "net-wrong-mask",
    title: "Incorrect subnet mask",
    objective: "Fix PC-A’s mask to 255.255.255.0 so local/gateway membership is correct.",
    prompt:
      "PC-A has a plausible IP but cannot reach the gateway or Server-1. Check the mask.",
    symptom: "PC-A is 192.168.1.10 with mask 255.255.0.0.",
    initialState: withFault((s) => {
      const iface = s.interfaces.find((i) => i.id === "pc-a-eth0")!;
      iface.subnetMask = "255.255.0.0";
    }),
    faultKind: "WRONG_MASK",
    faultTargetId: "pc-a-eth0",
    checkFromNodeId: "pc-a",
    checkToNodeId: "srv-1",
    expectedInterfacePatch: {
      interfaceId: "pc-a-eth0",
      subnetMask: "255.255.255.0",
    },
    diagnosisMustIncludeAny: ["mask", "subnet", "255.255.255.0", "prefix"],
    difficulty: 3,
    domainTag: "networking",
    conceptHints: ["subnet", "mask", "gateway", "lan"],
    misconceptionTargets: ["subnet misunderstanding"],
    progressionStage: "APPLY",
    contextVariant: "mask 255.255.0.0",
    contentKey: "net-ws-wrong-mask",
    skillFacet: "SOLVE",
    scaffolds: [
      {
        kind: "HINT",
        label: "Membership",
        content: "Does the gateway still count as on-link with this mask?",
        ...L1,
      },
    ],
    successLooksLike: "Mask corrected; path via gateway works.",
  },
  {
    id: "net-wrong-gateway",
    title: "Incorrect default gateway",
    objective: "Set PC-A gateway to 192.168.1.1 so remote Server-1 is reachable.",
    prompt:
      "PC-A can talk on the LAN idea but not to Server-1 on 10.0.0.10. Inspect the gateway.",
    symptom: "PC-A gateway is set to 192.168.1.50.",
    initialState: withFault((s) => {
      const iface = s.interfaces.find((i) => i.id === "pc-a-eth0")!;
      iface.gateway = "192.168.1.50";
    }),
    faultKind: "WRONG_GATEWAY",
    faultTargetId: "pc-a-eth0",
    checkFromNodeId: "pc-a",
    checkToNodeId: "srv-1",
    expectedInterfacePatch: {
      interfaceId: "pc-a-eth0",
      gateway: "192.168.1.1",
    },
    diagnosisMustIncludeAny: ["gateway", "default", "router", "192.168.1.1"],
    difficulty: 3,
    domainTag: "networking",
    conceptHints: ["gateway", "remote", "router", "default"],
    misconceptionTargets: ["gateway misunderstanding", "local vs remote connectivity"],
    progressionStage: "CHALLENGE",
    contextVariant: "gateway 192.168.1.50",
    contentKey: "net-ws-wrong-gateway",
    skillFacet: "SOLVE",
    scaffolds: [
      {
        kind: "HINT",
        label: "Local vs remote",
        content: "Same-subnet tests pass conceptually; remote destinations need a correct gateway.",
        ...L1,
      },
    ],
    successLooksLike: "Gateway points at Router-1 LAN; remote ping succeeds.",
  },
  {
    id: "net-dns-failure",
    title: "DNS failure with IP path OK",
    objective: "Restore DNS on PC-A while keeping IP connectivity intact.",
    prompt:
      "Ping to 10.0.0.10 works in the sim, but browsing by hostname fails. Distinguish DNS from general connectivity.",
    symptom: "Hostname lab.server.local fails; IP path to Server-1 works.",
    initialState: withFault((s) => {
      const iface = s.interfaces.find((i) => i.id === "pc-a-eth0")!;
      iface.dns = undefined;
    }),
    faultKind: "DNS_FAILURE",
    faultTargetId: "pc-a-eth0",
    checkFromNodeId: "pc-a",
    checkToNodeId: "srv-1",
    requireHostnameResolve: true,
    hostname: "lab.server.local",
    expectedInterfacePatch: {
      interfaceId: "pc-a-eth0",
      dns: "192.168.1.1",
    },
    diagnosisMustIncludeAny: ["dns", "name", "resolver", "hostname"],
    difficulty: 3,
    domainTag: "networking",
    conceptHints: ["dns", "dhcp", "hostname", "resolver", "connectivity"],
    misconceptionTargets: ["DNS vs DHCP", "blaming DHCP when IP already works"],
    progressionStage: "CHALLENGE",
    contextVariant: "dns missing hostname fail",
    contentKey: "net-ws-dns-failure",
    skillFacet: "SOLVE",
    scaffolds: [
      {
        kind: "HINT",
        label: "Separate tests",
        content: "If an IP ping works, name resolution is a different layer than basic IP reachability.",
        ...L1,
      },
      {
        kind: "HINT",
        label: "Not DHCP first",
        content: "The PC already has an address — is this a lease problem or a resolver problem?",
        ...L2,
      },
    ],
    successLooksLike: "IP ping OK and DNS configured; hostname check passes.",
  },
  {
    id: "net-dhcp-apipa",
    title: "DHCP failure (APIPA-style address)",
    objective: "Replace APIPA addressing with a valid LAN config (or recognize DHCP failure).",
    prompt:
      "PC-A shows 169.254.10.20 and cannot reach the gateway. Educational diagnosis — no real DHCP servers.",
    symptom: "APIPA address; no DHCP lease; no path to Server-1.",
    initialState: withFault((s) => {
      const iface = s.interfaces.find((i) => i.id === "pc-a-eth0")!;
      iface.ipAddress = "169.254.10.20";
      iface.subnetMask = "255.255.0.0";
      iface.gateway = undefined;
      iface.dns = undefined;
    }),
    faultKind: "DHCP_FAILURE",
    faultTargetId: "pc-a-eth0",
    checkFromNodeId: "pc-a",
    checkToNodeId: "srv-1",
    expectedInterfacePatch: {
      interfaceId: "pc-a-eth0",
      ipAddress: "192.168.1.10",
      subnetMask: "255.255.255.0",
      gateway: "192.168.1.1",
      dns: "192.168.1.1",
    },
    diagnosisMustIncludeAny: ["dhcp", "apipa", "169.254", "lease"],
    difficulty: 3,
    domainTag: "networking",
    conceptHints: ["dhcp", "apipa", "lease", "gateway", "dns"],
    misconceptionTargets: ["treating APIPA as a DNS-only failure"],
    progressionStage: "APPLY",
    contextVariant: "apipa 169.254",
    contentKey: "net-ws-dhcp-apipa",
    skillFacet: "PERFORM",
    scaffolds: [
      {
        kind: "HINT",
        label: "Address class",
        content: "169.254.x.x usually means the client never received a DHCP lease.",
        ...L1,
      },
    ],
    successLooksLike: "Valid LAN addressing restored; ping succeeds.",
  },
  {
    id: "net-retain-gateway",
    title: "Retain: fix a wrong gateway",
    objective: "Without notes, restore the correct gateway and verify remote reachability.",
    prompt:
      "RETAIN: PC-A cannot reach Server-1. Gateway looks wrong. Fix and verify. Educational recall.",
    symptom: "Gateway set to 192.168.1.254.",
    initialState: withFault((s) => {
      const iface = s.interfaces.find((i) => i.id === "pc-a-eth0")!;
      iface.gateway = "192.168.1.254";
    }),
    faultKind: "WRONG_GATEWAY",
    faultTargetId: "pc-a-eth0",
    checkFromNodeId: "pc-a",
    checkToNodeId: "srv-1",
    expectedInterfacePatch: {
      interfaceId: "pc-a-eth0",
      gateway: "192.168.1.1",
    },
    diagnosisMustIncludeAny: ["gateway", "default", "router"],
    difficulty: 2,
    domainTag: "networking",
    conceptHints: ["retain", "gateway", "troubleshoot", "router"],
    misconceptionTargets: ["gateway misunderstanding"],
    progressionStage: "RETAIN",
    contextVariant: "retain gateway 192.168.1.254",
    contentKey: "net-ws-retain-gateway",
    skillFacet: "RETAIN",
    scaffolds: [
      {
        kind: "HINT",
        label: "Recall",
        content: "Remote subnets need the LAN address of the first-hop router.",
        ...L1,
      },
    ],
    successLooksLike: "Gateway corrected; simulated remote ping succeeds.",
  },
];

export function getNetworkChallenge(id: string): NetworkChallenge | undefined {
  return NETWORK_CHALLENGES.find((c) => c.id === id);
}

export function listNetworkChallenges(): NetworkChallenge[] {
  return NETWORK_CHALLENGES.slice();
}
