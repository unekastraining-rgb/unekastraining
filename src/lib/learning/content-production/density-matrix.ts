/**
 * 2P-15/2P-16 — Content density readiness matrix (inspection aid).
 *
 * Derived from live catalogs + progression fixtures — not invented numbers.
 */

import {
  listActivityContentDescriptors,
  type UniversalContentActivityKind,
} from "@/lib/learning/activities/content-contract";
import { CONTENT_PROGRESSION_CATALOG } from "@/lib/learning/content-progression/catalog";
import { isAdaptiveReadyActivityAdapterKey } from "@/lib/learning/sequence/activity-adaptive-completion";
import { ADAPTIVE_CATALOG_SEED_ITEMS } from "./seed-catalog";
import type { ContentDensityDepth, ContentDensityRow } from "./types";

function countCatalog(kind: UniversalContentActivityKind, domainMatch: RegExp): number {
  return listActivityContentDescriptors(kind).filter((d) =>
    domainMatch.test(d.domainContext ?? ""),
  ).length;
}

function countProgression(conceptKey: string): number {
  return CONTENT_PROGRESSION_CATALOG.filter(
    (e) => e.conceptKey === conceptKey && (e.readiness ?? "READY") !== "DRAFT",
  ).length;
}

function countProgressionByDomain(domainMatch: RegExp): number {
  return CONTENT_PROGRESSION_CATALOG.filter(
    (e) =>
      (e.readiness ?? "READY") !== "DRAFT" &&
      domainMatch.test(e.domainContext ?? ""),
  ).length;
}

function uniqueConceptKeys(domainMatch: RegExp): number {
  const keys = new Set(
    CONTENT_PROGRESSION_CATALOG.filter(
      (e) =>
        (e.readiness ?? "READY") !== "DRAFT" &&
        domainMatch.test(e.domainContext ?? ""),
    ).map((e) => e.conceptKey),
  );
  return keys.size;
}

function depthFromCounts(catalogCount: number, progressionCount: number): ContentDensityDepth {
  if (catalogCount === 0 && progressionCount === 0) return "NONE";
  if (catalogCount <= 1 && progressionCount <= 2) return "FIXTURE";
  if (catalogCount <= 2 || progressionCount <= 3) return "THIN";
  if (catalogCount <= 5 || progressionCount <= 6) return "MODERATE";
  return "DEEP";
}

export type CatalogDepthMatrixRow = {
  domain: string;
  concepts: number;
  content: number;
  activityTypes: string;
  adaptiveReady: number;
  depth: ContentDensityDepth;
  gaps: string;
};

/**
 * 2P-16 richer matrix: concepts / content / activity types / adaptive-ready counts.
 * Derived from live catalogs + seed registry + progression.
 */
export function buildAdaptiveCatalogDepthMatrix(): CatalogDepthMatrixRow[] {
  const families: Array<{
    domain: string;
    domainMatch: RegExp;
    family: (typeof ADAPTIVE_CATALOG_SEED_ITEMS)[number]["domainFamily"] | null;
    activityLabel: string;
    gaps: string;
    /** When true, count progression/catalog instead of seed registry. */
    useLiveProgression?: boolean;
  }> = [
    {
      domain: "Computer Science",
      domainMatch: /computer science/i,
      family: "computer_science",
      activityLabel: "Coding/SQL",
      gaps: "OOP ladder deepened (2P-32); still limited languages",
    },
    {
      domain: "Networking",
      domainMatch: /networking/i,
      family: "networking",
      activityLabel: "Simulation/Lab",
      gaps: "Text rubric only; no topology UI",
    },
    {
      domain: "Cybersecurity",
      domainMatch: /cybersecurity/i,
      family: null,
      activityLabel: "Simulation/Lab/Game",
      gaps: "Present phishing/password/authz; no interactive range",
      useLiveProgression: true,
    },
    {
      domain: "Nursing",
      domainMatch: /nursing/i,
      family: "nursing",
      activityLabel: "Simulation",
      gaps: "No pharmacology/med-admin packs",
    },
    {
      domain: "Finance",
      domainMatch: /finance/i,
      family: "finance",
      activityLabel: "Simulation",
      gaps: "Fake-money only; no chart workspace",
    },
    {
      domain: "Business",
      domainMatch: /business/i,
      family: null,
      activityLabel: "Simulation/Project",
      gaps: "Supply/demand + plans; not a full MBA pack",
      useLiveProgression: true,
    },
    {
      domain: "Electrical",
      domainMatch: /electrical/i,
      family: "electrical",
      activityLabel: "Simulation/Lab",
      gaps: "No virtual multimeter UI",
    },
    {
      domain: "Automotive",
      domainMatch: /automotive/i,
      family: "automotive",
      activityLabel: "Simulation",
      gaps: "Thin diagnostic scenarios",
    },
    {
      domain: "History",
      domainMatch: /history/i,
      family: "history",
      activityLabel: "Writing/Presentation",
      gaps: "No timeline UI; writing Adaptive-ready via universal bind (2P-18)",
    },
    {
      domain: "General academic writing",
      domainMatch: /english/i,
      family: "general_academic",
      activityLabel: "Writing",
      gaps: "Small thesis/revision/citation seed — not a writing CMS",
    },
    {
      domain: "Math/Science",
      domainMatch: /mathematics|physics|chemistry/i,
      family: "math_science",
      activityLabel: "Lab/Writing",
      gaps: "No symbolic math engine; chemistry still thin",
    },
  ];

  return families.map((f) => {
    const progression = countProgressionByDomain(f.domainMatch);
    const concepts = uniqueConceptKeys(f.domainMatch);

    if (f.useLiveProgression || f.family == null) {
      const contentIds = new Set(
        CONTENT_PROGRESSION_CATALOG.filter(
          (e) =>
            (e.readiness ?? "READY") !== "DRAFT" &&
            (e.readiness ?? "READY") !== "ARCHIVED" &&
            f.domainMatch.test(e.domainContext ?? "") &&
            e.contentId,
        ).map((e) => `${e.activityKind}:${e.contentId}`),
      );
      const adaptiveReady = [...contentIds].filter((key) => {
        const kind = key.split(":")[0];
        return isAdaptiveReadyActivityAdapterKey(kind);
      }).length;
      return {
        domain: f.domain,
        concepts,
        content: contentIds.size,
        activityTypes: f.activityLabel,
        adaptiveReady,
        depth: depthFromCounts(contentIds.size, progression),
        gaps: f.gaps,
      };
    }

    const seed = ADAPTIVE_CATALOG_SEED_ITEMS.filter((s) => s.domainFamily === f.family);
    const content = seed.length;
    const adaptiveReady = seed.filter((s) =>
      isAdaptiveReadyActivityAdapterKey(s.activityKind),
    ).length;
    return {
      domain: f.domain,
      concepts: concepts || new Set(seed.map((s) => s.conceptKey)).size,
      content,
      activityTypes: f.activityLabel,
      adaptiveReady,
      depth: depthFromCounts(content, progression),
      gaps: f.gaps,
    };
  });
}

/**
 * Representative density matrix for expansion planning (2P-15 compat + 2P-16 updates).
 */
export function buildContentDensityMatrix(): ContentDensityRow[] {
  const javaCoding = countCatalog("coding", /computer science/i);
  const javaProg =
    countProgression("java-inheritance") +
    countProgression("java-exception-handling") +
    countProgression("programming-debugging");
  const sqlCount = listActivityContentDescriptors("sql").length;
  const sqlProg =
    countProgression("sql-filtering") + countProgression("sql-joins");
  const nursingSim = countCatalog("simulation", /nursing/i);
  const nursingProg =
    countProgression("clinical-decision-making") +
    countProgression("clinical-prioritization");
  const financeSim =
    countCatalog("simulation", /business/i) +
    countCatalog("simulation", /finance/i);
  const bizProg =
    countProgression("supply-and-demand") + countProgression("market-orders");
  const electricalLab = countCatalog("lab", /electrical/i);
  const elecProg = countProgression("circuit-fault-diagnosis");
  const historyPres = countCatalog("presentation", /history/i);
  const historyWrite = countCatalog("writing", /english|history/i);
  const histProg = countProgression("historical-cause-effect");
  const netLab = countCatalog("lab", /networking/i);
  const netSim = countCatalog("simulation", /networking/i);
  const netProg =
    countProgression("dhcp-troubleshooting") +
    countProgression("dns-troubleshooting");
  const tradingSim = countCatalog("simulation", /finance/i);
  const tradingProg = countProgression("market-orders");
  const autoSim = countCatalog("simulation", /automotive/i);
  const autoProg = countProgression("vehicle-diagnostics");
  const mathWrite = countCatalog("writing", /mathematics/i);
  const physLab = countCatalog("lab", /physics/i);
  const chemLab = countCatalog("lab", /chemistry/i);
  const msProg =
    countProgression("proportional-reasoning") +
    countProgression("net-force-reasoning") +
    countProgression("density");
  const cyberSim = countCatalog("simulation", /cybersecurity/i);
  const cyberLab = countCatalog("lab", /cybersecurity/i);
  const cyberProg = countProgressionByDomain(/cybersecurity/i);

  return [
    {
      domain: "Java / CS",
      activity: "Coding",
      existingContent: `${javaCoding} coding catalog; progression ${javaProg} entries`,
      depth: depthFromCounts(javaCoding, javaProg),
      majorGap: "Still thin OOP depth beyond inheritance/exceptions",
    },
    {
      domain: "SQL",
      activity: "SQL",
      existingContent: `${sqlCount} challenges; progression ${sqlProg} variants`,
      depth: depthFromCounts(sqlCount, sqlProg),
      majorGap: "No aggregates/window functions; educational datasets limited",
    },
    {
      domain: "Networking",
      activity: "Lab + Simulation",
      existingContent: `${netLab} lab + ${netSim} sim; progression ${netProg} entries`,
      depth: depthFromCounts(netLab + netSim, netProg),
      majorGap: "Text rubric only; no topology/sandbox UI",
    },
    {
      domain: "Nursing / Clinical",
      activity: "Simulation",
      existingContent: `${nursingSim} sims; progression ${nursingProg} entries`,
      depth: depthFromCounts(nursingSim, nursingProg),
      majorGap: "No pharmacology/dosage/med-admin packs",
    },
    {
      domain: "Finance / Business",
      activity: "Simulation",
      existingContent: `${financeSim} sims; progression ${bizProg} entries`,
      depth: depthFromCounts(financeSim, bizProg),
      majorGap: "Chart analysis workspace absent; fake-money only",
    },
    {
      domain: "Electrical / Trades",
      activity: "Lab",
      existingContent: `${electricalLab} circuit lab; progression ${elecProg} entries`,
      depth: depthFromCounts(electricalLab, elecProg),
      majorGap: "Rubric text only; no virtual multimeter/equipment UI",
    },
    {
      domain: "Automotive",
      activity: "Simulation",
      existingContent: `${autoSim} sim; progression ${autoProg} entries`,
      depth: depthFromCounts(autoSim, autoProg),
      majorGap: "Single diagnostic scenario",
    },
    {
      domain: "History / Humanities",
      activity: "Presentation + Writing",
      existingContent: `${historyPres} presentation + ${historyWrite} writing; progression ${histProg}`,
      depth: depthFromCounts(historyPres + historyWrite, histProg),
      majorGap: "Timeline/map UI absent; writing Adaptive-ready via universal bind",
    },
    {
      domain: "Math / Science",
      activity: "Writing + Lab",
      existingContent: `${mathWrite} math writing + ${physLab} physics + ${chemLab} chemistry; progression ${msProg}`,
      depth: depthFromCounts(mathWrite + physLab + chemLab, msProg),
      majorGap: "No symbolic math workspace; chemistry progression missing",
    },
    {
      domain: "Stock Market / Trading (edu)",
      activity: "Simulation",
      existingContent: `${tradingSim} trading-edu sim; progression ${tradingProg} entries`,
      depth: depthFromCounts(tradingSim, tradingProg),
      majorGap: "Fake-money scenarios only — never brokerage/real money",
    },
    {
      domain: "Language learning",
      activity: "Flashcard + Quiz (product)",
      existingContent: "Product-deep engines; UA catalog thin",
      depth: "THIN",
      majorGap: "No speaking/conversation engine; vocab-only path today",
    },
    {
      domain: "Cybersecurity",
      activity: "Simulation + Lab + Game",
      existingContent: `${cyberSim} sim + ${cyberLab} lab; progression ${cyberProg} entries`,
      depth: depthFromCounts(cyberSim + cyberLab, cyberProg),
      majorGap: "Scenario content present; interactive range deferred",
    },
  ];
}
