/**
 * 2P-40 — Network workspace model + evaluation tests.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  getNetworkChallenge,
  listNetworkChallenges,
  NETWORK_CHALLENGES,
} from "@/lib/learning/activities/networking/challenges";
import {
  evaluateNetworkWorkspace,
  runNetworkDiagnostic,
} from "@/lib/learning/activities/networking/evaluate";
import { NETWORK_WORKSPACE_PROGRESSION_ENTRIES } from "@/lib/learning/activities/networking/progression";
import {
  applyInterfacePatch,
  checkIpConnectivity,
  cloneNetworkState,
} from "@/lib/learning/activities/networking/state";

describe("2P-40 network model", () => {
  it("detects disabled interface and recovers after enable", () => {
    const challenge = getNetworkChallenge("net-disabled-iface")!;
    const broken = checkIpConnectivity(
      challenge.initialState,
      "pc-a",
      "srv-1",
    );
    expect(broken.ok).toBe(false);

    const fixed = applyInterfacePatch(challenge.initialState, {
      interfaceId: "pc-a-eth0",
      enabled: true,
    });
    expect(checkIpConnectivity(fixed, "pc-a", "srv-1").ok).toBe(true);
  });

  it("rejects wrong gateway for remote reachability", () => {
    const challenge = getNetworkChallenge("net-wrong-gateway")!;
    expect(
      checkIpConnectivity(challenge.initialState, "pc-a", "srv-1").ok,
    ).toBe(false);
    const fixed = applyInterfacePatch(challenge.initialState, {
      interfaceId: "pc-a-eth0",
      gateway: "192.168.1.1",
    });
    expect(checkIpConnectivity(fixed, "pc-a", "srv-1").ok).toBe(true);
  });
});

describe("2P-40 evaluateNetworkWorkspace", () => {
  it("accepts a correct disabled-interface fix with diagnosis", () => {
    const challenge = getNetworkChallenge("net-disabled-iface")!;
    const state = applyInterfacePatch(challenge.initialState, {
      interfaceId: "pc-a-eth0",
      enabled: true,
    });
    const result = evaluateNetworkWorkspace(challenge, {
      state,
      diagnosis: "The PC eth0 interface was disabled so the link was down.",
    });
    expect(result.outcome).toBe("SUCCESS");
    expect(result.details.configOk).toBe(true);
    expect(result.details.pingOk).toBe(true);
  });

  it("does not forge SUCCESS for incorrect IP", () => {
    const challenge = getNetworkChallenge("net-wrong-ip")!;
    const result = evaluateNetworkWorkspace(challenge, {
      state: cloneNetworkState(challenge.initialState),
      diagnosis: "Something about DNS maybe",
    });
    expect(result.outcome).not.toBe("SUCCESS");
    expect(result.details.configOk).toBe(false);
  });

  it("flags DNS vs connectivity for dns-failure scenario", () => {
    const challenge = getNetworkChallenge("net-dns-failure")!;
    const ping = runNetworkDiagnostic({
      challenge,
      state: challenge.initialState,
      kind: "ping",
    });
    expect(ping.ok).toBe(true);
    const host = runNetworkDiagnostic({
      challenge,
      state: challenge.initialState,
      kind: "hostname",
    });
    expect(host.ok).toBe(false);

    const fixed = applyInterfacePatch(challenge.initialState, {
      interfaceId: "pc-a-eth0",
      dns: "192.168.1.1",
    });
    const result = evaluateNetworkWorkspace(challenge, {
      state: fixed,
      diagnosis: "DNS resolver missing while IP path worked.",
    });
    expect(result.outcome).toBe("SUCCESS");
  });

  it("handles DHCP/APIPA style addressing", () => {
    const challenge = getNetworkChallenge("net-dhcp-apipa")!;
    expect(
      checkIpConnectivity(challenge.initialState, "pc-a", "srv-1").ok,
    ).toBe(false);
    const fixed = applyInterfacePatch(challenge.initialState, {
      interfaceId: "pc-a-eth0",
      ipAddress: "192.168.1.10",
      subnetMask: "255.255.255.0",
      gateway: "192.168.1.1",
      dns: "192.168.1.1",
    });
    const result = evaluateNetworkWorkspace(challenge, {
      state: fixed,
      diagnosis: "APIPA 169.254 means DHCP lease failed.",
    });
    expect(result.details.configOk).toBe(true);
    expect(result.details.pingOk).toBe(true);
  });
});

describe("2P-40 networking content pack", () => {
  it("ships a focused deterministic pack", () => {
    expect(NETWORK_CHALLENGES.length).toBeGreaterThanOrEqual(5);
    expect(NETWORK_CHALLENGES.length).toBeLessThanOrEqual(10);
    for (const c of listNetworkChallenges()) {
      expect(c.scaffolds?.every((s) => s.doesNotRevealAnswer !== false)).toBe(
        true,
      );
      expect(c.initialState.nodes.length).toBeGreaterThan(0);
    }
    expect(NETWORK_WORKSPACE_PROGRESSION_ENTRIES.length).toBe(
      NETWORK_CHALLENGES.length,
    );
  });
});

describe("2P-40 submitNetworkChallenge evidence boundary", () => {
  const mockRecord = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    mockRecord.mockReset();
  });

  it("records evidence only on submit and strips forgery", async () => {
    vi.doMock("@/lib/learning/activities/server-evaluation", async () => {
      const actual = await vi.importActual<
        typeof import("@/lib/learning/activities/server-evaluation")
      >("@/lib/learning/activities/server-evaluation");
      return {
        ...actual,
        recordAuthoritativeActivityEvidence: mockRecord,
      };
    });

    mockRecord.mockResolvedValue({
      ok: true,
      completion: {
        learningAttemptId: "la-net",
        conceptId: "c-1",
        outcome: "SUCCESS",
        score: 1,
      },
      rejectedClientClaims: true,
    });

    const { submitNetworkChallenge } = await import(
      "@/lib/learning/activities/networking/service"
    );
    const challenge = getNetworkChallenge("net-disabled-iface")!;
    const state = applyInterfacePatch(challenge.initialState, {
      interfaceId: "pc-a-eth0",
      enabled: true,
    });

    const result = await submitNetworkChallenge({
      learnerId: "user-1",
      conceptId: "c-1",
      challengeId: "net-disabled-iface",
      clientBody: {
        state,
        diagnosis: "Interface was disabled on the PC.",
        outcome: "SUCCESS",
        score: 1,
        learnerId: "attacker",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rejectedForgeryKeys.length).toBeGreaterThan(0);
    }
    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceKind: "network_workspace_submit",
        learnerId: "user-1",
      }),
    );
  });
});
