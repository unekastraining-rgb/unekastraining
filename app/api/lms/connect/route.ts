import { NextResponse } from "next/server";

import { LMSProvider } from "@/generated/prisma";
import type { LMSConnectRequest } from "@/lib/lms/types";
import { normalizeMoodleBaseUrl } from "@/lib/lms/moodle-url";
import { isValidMoodleToken, resolveMoodleCredentials } from "@/lib/lms/moodle-env";
import { syncUserLmsProvider } from "@/lib/lms/sync";
import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";
import { sealLmsToken } from "@/lib/security/lms-token-crypto";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const connections = await db.lMSConnection.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        provider: true,
        displayName: true,
        baseUrl: true,
        status: true,
        lastSyncedAt: true,
        updatedAt: true,
      },
    });

    const hasMoodle = connections.some((item) => item.provider === LMSProvider.MOODLE);
    if (!hasMoodle) {
      const fromEnv = await resolveMoodleCredentials(user.id);
      if (fromEnv) {
        connections.unshift({
          id: "env-moodle",
          provider: LMSProvider.MOODLE,
          displayName: fromEnv.baseUrl,
          baseUrl: fromEnv.baseUrl,
          status: "connected",
          lastSyncedAt: null,
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json({ success: true, connections });
  } catch (error) {
    console.error("Failed to list LMS connections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load LMS connections." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as LMSConnectRequest;

    if (!body.provider) {
      return NextResponse.json(
        { success: false, error: "Provider is required." },
        { status: 400 },
      );
    }

    const provider = body.provider as LMSProvider;
    const baseUrl =
      provider === LMSProvider.MOODLE && body.baseUrl
        ? normalizeMoodleBaseUrl(body.baseUrl)
        : body.baseUrl;

    if (provider === LMSProvider.MOODLE && body.accessToken?.trim()) {
      const token = body.accessToken.trim();
      if (!isValidMoodleToken(token)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid Moodle token. Copy the full 32-character token from Manage tokens — not the service name or page URL.",
          },
          { status: 400 },
        );
      }
    }

    const existing = await db.lMSConnection.findFirst({
      where: { userId: user.id, provider },
    });

    const nextToken =
      body.accessToken?.trim() != null && body.accessToken.trim() !== ""
        ? sealLmsToken(body.accessToken.trim())
        : existing?.accessToken ?? null;

    const connection = existing
      ? await db.lMSConnection.update({
          where: { id: existing.id },
          data: {
            displayName: baseUrl ?? existing.displayName,
            baseUrl: baseUrl ?? existing.baseUrl,
            accessToken: nextToken,
            status: body.accessToken || baseUrl ? "connected" : "pending",
          },
        })
      : await db.lMSConnection.create({
          data: {
            userId: user.id,
            provider,
            displayName: baseUrl ?? provider,
            baseUrl: baseUrl ?? null,
            accessToken: nextToken,
            status: body.accessToken || baseUrl ? "connected" : "pending",
          },
        });

    let message = "Connection saved.";
    const hasCredentials = Boolean(body.accessToken || baseUrl);

    if (hasCredentials && connection.status === "connected" && provider !== LMSProvider.MOODLE) {
      try {
        const syncResult = await syncUserLmsProvider(user.id, provider);
        message = syncResult.message;
      } catch (error) {
        message =
          error instanceof Error
            ? `Connected, but sync failed: ${error.message}`
            : "Connected, but sync failed. Try Sync now.";
      }
    } else if (hasCredentials && provider === LMSProvider.MOODLE) {
      try {
        const syncResult = await syncUserLmsProvider(user.id, provider);
        message = syncResult.message;
      } catch {
        message =
          "Moodle saved to your account. On campus Wi‑Fi, open Study on any device — it syncs automatically. Or tap Sync in Settings.";
      }
    } else if (!hasCredentials) {
      message = "Connection saved. Add a URL or token, or use OAuth to connect.";
    }

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        provider: connection.provider,
        displayName: connection.displayName,
        baseUrl: connection.baseUrl,
        status: connection.status,
      },
      message,
    });
  } catch (error) {
    console.error("Failed to connect LMS:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save LMS connection." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json()) as { provider?: string };

    if (!body.provider) {
      return NextResponse.json(
        { success: false, error: "Provider is required." },
        { status: 400 },
      );
    }

    const provider = body.provider as LMSProvider;

    await db.lMSConnection.deleteMany({
      where: { userId: user.id, provider },
    });

    return NextResponse.json({
      success: true,
      message: `${provider.replace(/_/g, " ")} disconnected. Imported courses were kept in Study Haul.`,
    });
  } catch (error) {
    console.error("Failed to disconnect LMS:", error);
    return NextResponse.json(
      { success: false, error: "Failed to disconnect LMS." },
      { status: 500 },
    );
  }
}
