import { NextResponse } from "next/server";

import { buildNotifications } from "@/lib/notifications";
import {
  countUnreadNotifications,
  dismissAllNotifications,
  dismissNotification,
  getNotificationPrefs,
  markAllNotificationsRead,
  readNotification,
} from "@/lib/notifications-prefs";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getOrCreateDefaultUser();
    const prefs = await getNotificationPrefs(user.id);
    const notifications = await buildNotifications(user.id, prefs);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount: countUnreadNotifications(notifications, prefs),
    });
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load notifications." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = await request.json();

    if (body.dismissAll === true) {
      const prefs = await getNotificationPrefs(user.id);
      const notifications = await buildNotifications(user.id, prefs);
      const updated = await dismissAllNotifications(
        user.id,
        notifications.map((item) => item.id),
      );
      const next = await buildNotifications(user.id, updated);
      return NextResponse.json({
        success: true,
        data: next,
        unreadCount: countUnreadNotifications(next, updated),
      });
    }

    if (body.markAllRead === true) {
      const prefs = await getNotificationPrefs(user.id);
      const notifications = await buildNotifications(user.id, prefs);
      const updated = await markAllNotificationsRead(
        user.id,
        notifications.map((item) => item.id),
      );
      const next = await buildNotifications(user.id, updated);
      return NextResponse.json({
        success: true,
        data: next,
        unreadCount: countUnreadNotifications(next, updated),
      });
    }

    if (typeof body.dismiss === "string") {
      const updated = await dismissNotification(user.id, body.dismiss);
      const next = await buildNotifications(user.id, updated);
      return NextResponse.json({
        success: true,
        data: next,
        unreadCount: countUnreadNotifications(next, updated),
      });
    }

    if (typeof body.read === "string") {
      const updated = await readNotification(user.id, body.read);
      const next = await buildNotifications(user.id, updated);
      return NextResponse.json({
        success: true,
        data: next,
        unreadCount: countUnreadNotifications(next, updated),
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid notification action." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notifications." },
      { status: 500 },
    );
  }
}
