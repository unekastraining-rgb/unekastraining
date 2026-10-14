/**
 * 2P-40 — Thin educational network model (NOT Packet Tracer / real networking).
 */

export type NetworkNodeType = "PC" | "SWITCH" | "ROUTER" | "SERVER";

export type NetworkNode = {
  id: string;
  type: NetworkNodeType;
  label: string;
};

export type NetworkInterface = {
  id: string;
  nodeId: string;
  name: string;
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;
  dns?: string;
  enabled: boolean;
};

export type NetworkLink = {
  id: string;
  fromInterfaceId: string;
  toInterfaceId: string;
  enabled: boolean;
};

export type NetworkState = {
  nodes: NetworkNode[];
  interfaces: NetworkInterface[];
  links: NetworkLink[];
};

export type NetworkFaultKind =
  | "DISABLED_INTERFACE"
  | "WRONG_IP"
  | "WRONG_MASK"
  | "WRONG_GATEWAY"
  | "DNS_FAILURE"
  | "DHCP_FAILURE";

export type NetworkErrorCategory =
  | "DNS_VS_DHCP"
  | "SUBNET_MISUNDERSTANDING"
  | "GATEWAY_MISUNDERSTANDING"
  | "INTERFACE_STATE"
  | "LOCAL_VS_REMOTE_CONNECTIVITY"
  | "WRONG_DIAGNOSIS"
  | "NONE";

export type NetworkChallengeScaffold = {
  kind: "HINT" | "STEP" | "EXAMPLE" | "CHECKLIST" | "CONSTRAINT";
  label: string;
  content: string;
  level?: 1 | 2 | 3;
  revealPolicy?: "ON_REQUEST" | "ALWAYS";
  doesNotRevealAnswer?: boolean;
};

export type NetworkChallenge = {
  id: string;
  title: string;
  objective: string;
  prompt: string;
  symptom: string;
  /** Starting fixture (learner may mutate a copy). */
  initialState: NetworkState;
  faultKind: NetworkFaultKind;
  /** Interface or node id that is the root cause. */
  faultTargetId: string;
  /** Destination for connectivity check (node id). */
  checkFromNodeId: string;
  checkToNodeId: string;
  /** When true, hostname check is also required. */
  requireHostnameResolve?: boolean;
  hostname?: string;
  /** Expected values after correct fix (partial interface patch). */
  expectedInterfacePatch?: Partial<
    Pick<
      NetworkInterface,
      "enabled" | "ipAddress" | "subnetMask" | "gateway" | "dns"
    >
  > & { interfaceId: string };
  /** Keywords acceptable for diagnosis field. */
  diagnosisMustIncludeAny: readonly string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  domainTag?: string;
  conceptHints?: readonly string[];
  misconceptionTargets?: readonly string[];
  scaffolds?: readonly NetworkChallengeScaffold[];
  successLooksLike?: string;
  progressionStage?: "PRACTICE" | "APPLY" | "CHALLENGE" | "RETAIN";
  contextVariant?: string;
  contentKey?: string;
  skillFacet?: "APPLY" | "SOLVE" | "PERFORM" | "RETAIN";
};

/** Client working payload — never authoritative evidence by itself. */
export type NetworkWorkspaceSubmission = {
  state: NetworkState;
  diagnosis?: string;
  lastPingOk?: boolean;
  lastHostnameOk?: boolean;
};
