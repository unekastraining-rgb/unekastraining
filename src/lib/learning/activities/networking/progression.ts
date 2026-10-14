/**
 * 2P-40 — Networking workspace progression entries.
 */

import type { ContentProgressionEntry } from "@/lib/learning/content-progression/types";

function entry(
  partial: Omit<ContentProgressionEntry, "contentVersion" | "authorship"> & {
    authorship?: ContentProgressionEntry["authorship"];
    contentVersion?: string;
    ownerLearnerId?: string | null;
    readiness?: ContentProgressionEntry["readiness"];
  },
): ContentProgressionEntry {
  return {
    ...partial,
    authorship: partial.authorship ?? "system",
    contentVersion: partial.contentVersion ?? `v1:${partial.contentKey}`,
    ownerLearnerId: partial.ownerLearnerId ?? null,
    readiness: partial.readiness ?? "READY",
  };
}

export const NETWORK_WORKSPACE_PROGRESSION_ENTRIES: ContentProgressionEntry[] = [
  entry({
    contentKey: "net-ws-disabled-iface",
    conceptKey: "network-interface-troubleshooting",
    conceptTitle: "Network interface troubleshooting",
    stage: "PRACTICE",
    difficulty: 2,
    contextVariant: "pc eth0 disabled",
    activityKind: "networking",
    contentId: "net-disabled-iface",
    objective: "Re-enable a disabled PC interface and verify connectivity.",
    domainContext: "networking",
  }),
  entry({
    contentKey: "net-ws-wrong-ip",
    conceptKey: "ip-addressing-basics",
    conceptTitle: "IP addressing basics",
    stage: "APPLY",
    difficulty: 2,
    contextVariant: "wrong host IP",
    activityKind: "networking",
    contentId: "net-wrong-ip",
    objective: "Correct a host IP to match the LAN plan.",
    domainContext: "networking",
  }),
  entry({
    contentKey: "net-ws-wrong-mask",
    conceptKey: "subnet-mask-basics",
    conceptTitle: "Subnet mask basics",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "wrong mask",
    activityKind: "networking",
    contentId: "net-wrong-mask",
    objective: "Correct a subnet mask so the gateway is on-link.",
    domainContext: "networking",
  }),
  entry({
    contentKey: "net-ws-wrong-gateway",
    conceptKey: "default-gateway-troubleshooting",
    conceptTitle: "Default gateway troubleshooting",
    stage: "CHALLENGE",
    difficulty: 3,
    contextVariant: "wrong gateway",
    activityKind: "networking",
    contentId: "net-wrong-gateway",
    objective: "Fix the default gateway for remote reachability.",
    domainContext: "networking",
  }),
  entry({
    contentKey: "net-ws-dns-failure",
    conceptKey: "dns-vs-dhcp-diagnosis",
    conceptTitle: "DNS vs DHCP diagnosis",
    stage: "CHALLENGE",
    difficulty: 3,
    contextVariant: "dns missing",
    activityKind: "networking",
    contentId: "net-dns-failure",
    objective: "Distinguish DNS failure from IP connectivity failure.",
    domainContext: "networking",
  }),
  entry({
    contentKey: "net-ws-dhcp-apipa",
    conceptKey: "dhcp-troubleshooting",
    conceptTitle: "DHCP troubleshooting",
    stage: "APPLY",
    difficulty: 3,
    contextVariant: "apipa address",
    activityKind: "networking",
    contentId: "net-dhcp-apipa",
    objective: "Recognize DHCP failure from APIPA and restore LAN config.",
    domainContext: "networking",
  }),
  entry({
    contentKey: "net-ws-retain-gateway",
    conceptKey: "default-gateway-troubleshooting",
    conceptTitle: "Default gateway troubleshooting",
    stage: "RETAIN",
    difficulty: 2,
    contextVariant: "retain gateway",
    activityKind: "networking",
    contentId: "net-retain-gateway",
    objective: "Recall and fix a wrong gateway.",
    domainContext: "networking",
  }),
];
