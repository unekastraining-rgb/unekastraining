/**
 * 2P-40 — Deterministic network workspace evaluation (no LLM / no real nets).
 */

import type { NetworkChallenge, NetworkErrorCategory, NetworkState } from "./types";
import {
  applyInterfacePatch,
  checkHostnameResolve,
  checkIpConnectivity,
  cloneNetworkState,
} from "./state";
import {
  makeServerEvaluation,
  outcomeFromPassRatio,
} from "@/lib/learning/activities/server-evaluation";
import type { UniversalEvaluationResult } from "@/lib/learning/activities/execution-contract";
import type { MasteryFacetName } from "@/lib/learning/types";

export type NetworkWorkspaceSubmission = {
  state: NetworkState;
  diagnosis?: string;
};

function diagnosisHits(
  diagnosis: string,
  needles: readonly string[],
): number {
  const text = diagnosis.toLowerCase();
  return needles.filter((n) => text.includes(n.toLowerCase())).length;
}

function interfaceMatchesExpected(
  state: NetworkState,
  challenge: NetworkChallenge,
): boolean {
  const patch = challenge.expectedInterfacePatch;
  if (!patch) return false;
  const iface = state.interfaces.find((i) => i.id === patch.interfaceId);
  if (!iface) return false;
  if (patch.enabled !== undefined && iface.enabled !== patch.enabled) return false;
  if (patch.ipAddress !== undefined && iface.ipAddress !== patch.ipAddress) {
    return false;
  }
  if (patch.subnetMask !== undefined && iface.subnetMask !== patch.subnetMask) {
    return false;
  }
  if (patch.gateway !== undefined && iface.gateway !== patch.gateway) return false;
  if (patch.dns !== undefined && iface.dns !== patch.dns) return false;
  return true;
}

function classifyMisconception(
  challenge: NetworkChallenge,
  diagnosisOk: boolean,
  configOk: boolean,
  pingOk: boolean,
): NetworkErrorCategory {
  if (configOk && pingOk && diagnosisOk) return "NONE";
  if (!diagnosisOk && challenge.faultKind === "DNS_FAILURE") return "DNS_VS_DHCP";
  if (!diagnosisOk && challenge.faultKind === "DHCP_FAILURE") return "DNS_VS_DHCP";
  if (!configOk && challenge.faultKind === "WRONG_MASK") {
    return "SUBNET_MISUNDERSTANDING";
  }
  if (!configOk && challenge.faultKind === "WRONG_GATEWAY") {
    return "GATEWAY_MISUNDERSTANDING";
  }
  if (!configOk && challenge.faultKind === "DISABLED_INTERFACE") {
    return "INTERFACE_STATE";
  }
  if (configOk && !pingOk) return "LOCAL_VS_REMOTE_CONNECTIVITY";
  if (!diagnosisOk) return "WRONG_DIAGNOSIS";
  return "WRONG_DIAGNOSIS";
}

export function evaluateNetworkWorkspace(
  challenge: NetworkChallenge,
  submission: NetworkWorkspaceSubmission,
): UniversalEvaluationResult {
  const state = cloneNetworkState(submission.state);
  const diagnosis = (submission.diagnosis ?? "").trim();

  const configOk = interfaceMatchesExpected(state, challenge);
  const ping = checkIpConnectivity(
    state,
    challenge.checkFromNodeId,
    challenge.checkToNodeId,
  );
  const host = challenge.requireHostnameResolve
    ? checkHostnameResolve(state, challenge.checkFromNodeId)
    : { ok: true, reason: "ok" as const, detail: "n/a" };

  const diagnosisOk =
    diagnosis.length >= 8 &&
    diagnosisHits(diagnosis, challenge.diagnosisMustIncludeAny) >= 1;

  let score = 0;
  if (configOk) score += 0.45;
  if (ping.ok) score += 0.35;
  if (host.ok) score += challenge.requireHostnameResolve ? 0.1 : 0.05;
  if (diagnosisOk) score += 0.15;
  score = Math.min(1, score);

  const category = classifyMisconception(
    challenge,
    diagnosisOk,
    configOk,
    ping.ok,
  );

  const misconceptionSignals =
    category === "NONE"
      ? []
      : [
          category,
          ...(challenge.misconceptionTargets ?? []).slice(0, 2),
        ];

  const facet: MasteryFacetName = challenge.skillFacet ?? "SOLVE";

  return makeServerEvaluation({
    outcome: outcomeFromPassRatio(score),
    score,
    skillFacet: facet,
    details: {
      mode: "network_topology_constrained",
      configOk,
      pingOk: ping.ok,
      hostnameOk: host.ok,
      diagnosisOk,
      errorCategory: category,
      misconceptionSignals,
      faultKind: challenge.faultKind,
      pingDetail: ping.detail,
      hostnameDetail: host.detail,
      feedback:
        configOk && ping.ok && host.ok
          ? diagnosisOk
            ? "Configuration and verification look good."
            : "Connectivity works — strengthen your diagnosis wording."
          : "Fix the faulty configuration, then re-check simulated connectivity.",
    },
  });
}

/** Diagnostic check — no evidence. */
export function runNetworkDiagnostic(input: {
  challenge: NetworkChallenge;
  state: NetworkState;
  kind: "ping" | "hostname";
}): { ok: boolean; learnerMessage: string } {
  if (input.kind === "hostname") {
    const result = checkHostnameResolve(
      input.state,
      input.challenge.checkFromNodeId,
    );
    return {
      ok: result.ok,
      learnerMessage: result.detail,
    };
  }
  const result = checkIpConnectivity(
    input.state,
    input.challenge.checkFromNodeId,
    input.challenge.checkToNodeId,
  );
  return { ok: result.ok, learnerMessage: result.detail };
}

/** Apply a permitted patch for UI helpers (still client working state). */
export function previewNetworkFix(
  challenge: NetworkChallenge,
  state: NetworkState,
): NetworkState {
  if (!challenge.expectedInterfacePatch) return cloneNetworkState(state);
  return applyInterfacePatch(state, challenge.expectedInterfacePatch);
}
