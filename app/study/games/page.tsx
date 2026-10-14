import { HubBackBar } from "@/components/hub/HubBackBar";
import { CapabilityCatalogView } from "@/components/study/CapabilityCatalogView";
import { listStructuredChallenges } from "@/lib/learning/activities/structured/service";

export const dynamic = "force-dynamic";

/**
 * Bundle K — Games destination.
 * Lists real structured game challenges; launches canonical /study/activities/game.
 */
export default function GamesDestinationPage() {
  const games = listStructuredChallenges("game");
  const items = games.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.objective ?? g.prompt ?? "Short learning game.",
    href: `/study/activities/game?challengeId=${encodeURIComponent(g.id)}`,
    meta: g.domainTag ?? "Learning game",
  }));

  return (
    <>
      <HubBackBar title="Games" planningActive="study" />
      <CapabilityCatalogView
        eyebrow="Activities"
        title="Games"
        description="Choose a learning game. Results still count as practice evidence when you submit."
        items={items}
        emptyLabel="No games in the catalog yet."
      />
    </>
  );
}
