import { NextResponse } from "next/server";

import { ProposalStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import {
  applyScheduleProposal,
  generateScheduleProposals,
  type ScheduleChange,
} from "@/lib/schedule/proposals";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const proposals = await db.scheduleProposal.findMany({
      where: { userId: user.id, status: ProposalStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: proposals.map((proposal) => ({
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        changes: JSON.parse(proposal.changesJson) as ScheduleChange[],
        status: proposal.status,
        createdAt: proposal.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to load schedule proposals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load proposals." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const user = await getOrCreateDefaultUser();
    const changes = await generateScheduleProposals(user.id);

    const proposal = await db.scheduleProposal.create({
      data: {
        userId: user.id,
        title: "Adaptive schedule suggestions",
        description: `${changes.length} recommended change${changes.length === 1 ? "" : "s"} based on deadlines and mastery.`,
        changesJson: JSON.stringify(changes),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        changes,
        status: proposal.status,
      },
    });
  } catch (error) {
    console.error("Failed to generate schedule proposals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate proposals." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();
    const { id, action } = body as { id: string; action: "approve" | "reject" };

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: "id and action are required." },
        { status: 400 },
      );
    }

    const proposal = await db.scheduleProposal.findFirst({
      where: { id, userId: user.id, status: ProposalStatus.PENDING },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found." },
        { status: 404 },
      );
    }

    if (action === "reject") {
      await db.scheduleProposal.update({
        where: { id },
        data: { status: ProposalStatus.REJECTED },
      });
      return NextResponse.json({ success: true, data: { status: "REJECTED" } });
    }

    const changes = JSON.parse(proposal.changesJson) as ScheduleChange[];
    const applied = await applyScheduleProposal(user.id, changes);

    await db.scheduleProposal.update({
      where: { id },
      data: { status: ProposalStatus.APPROVED },
    });

    return NextResponse.json({
      success: true,
      data: { status: "APPROVED", applied },
    });
  } catch (error) {
    console.error("Failed to update schedule proposal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update proposal." },
      { status: 500 },
    );
  }
}
