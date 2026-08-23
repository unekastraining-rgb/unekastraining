import { db } from "@/lib/db";

export interface NotificationPrefs {
  dismissedIds: string[];
  readIds: string[];
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  dismissedIds: [],
  readIds: [],
};

const MAX_STORED_IDS = 200;

function trimIds(ids: string[]): string[] {
  return ids.slice(-MAX_STORED_IDS);
}

export function parseNotificationPrefs(
  blob: Record<string, unknown>,
): NotificationPrefs {
  const dismissed = blob.dismissedNotificationIds;
  const read = blob.readNotificationIds;

  return {
    dismissedIds: Array.isArray(dismissed)
      ? dismissed.filter((id): id is string => typeof id === "string")
      : [],
    readIds: Array.isArray(read)
      ? read.filter((id): id is string => typeof id === "string")
      : [],
  };
}

async function readSettingsBlob(userId: string): Promise<Record<string, unknown>> {
  const row = await db.userPreferences.findUnique({
    where: { userId },
    select: { settingsJson: true },
  });

  if (!row?.settingsJson) return {};

  try {
    return JSON.parse(row.settingsJson) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function writeSettingsBlob(
  userId: string,
  blob: Record<string, unknown>,
): Promise<void> {
  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, settingsJson: JSON.stringify(blob) },
    update: { settingsJson: JSON.stringify(blob) },
  });
}

export async function getNotificationPrefs(
  userId: string,
): Promise<NotificationPrefs> {
  const blob = await readSettingsBlob(userId);
  return parseNotificationPrefs(blob);
}

export async function updateNotificationPrefs(
  userId: string,
  patch: Partial<NotificationPrefs>,
): Promise<NotificationPrefs> {
  const blob = await readSettingsBlob(userId);
  const current = parseNotificationPrefs(blob);

  const next: NotificationPrefs = {
    dismissedIds: trimIds(patch.dismissedIds ?? current.dismissedIds),
    readIds: trimIds(patch.readIds ?? current.readIds),
  };

  await writeSettingsBlob(userId, {
    ...blob,
    dismissedNotificationIds: next.dismissedIds,
    readNotificationIds: next.readIds,
  });

  return next;
}

export async function dismissNotification(
  userId: string,
  notificationId: string,
): Promise<NotificationPrefs> {
  const current = await getNotificationPrefs(userId);
  if (current.dismissedIds.includes(notificationId)) {
    return current;
  }

  return updateNotificationPrefs(userId, {
    dismissedIds: [...current.dismissedIds, notificationId],
    readIds: current.readIds.includes(notificationId)
      ? current.readIds
      : [...current.readIds, notificationId],
  });
}

export async function readNotification(
  userId: string,
  notificationId: string,
): Promise<NotificationPrefs> {
  const current = await getNotificationPrefs(userId);
  if (current.readIds.includes(notificationId)) {
    return current;
  }

  return updateNotificationPrefs(userId, {
    readIds: [...current.readIds, notificationId],
  });
}

export async function dismissAllNotifications(
  userId: string,
  notificationIds: string[],
): Promise<NotificationPrefs> {
  const current = await getNotificationPrefs(userId);
  const dismissed = new Set([...current.dismissedIds, ...notificationIds]);
  const read = new Set([...current.readIds, ...notificationIds]);

  return updateNotificationPrefs(userId, {
    dismissedIds: [...dismissed],
    readIds: [...read],
  });
}

export async function markAllNotificationsRead(
  userId: string,
  notificationIds: string[],
): Promise<NotificationPrefs> {
  const current = await getNotificationPrefs(userId);
  const read = new Set([...current.readIds, ...notificationIds]);

  return updateNotificationPrefs(userId, {
    readIds: [...read],
  });
}

export function filterNotifications<T extends { id: string }>(
  notifications: T[],
  prefs: NotificationPrefs,
): T[] {
  const dismissed = new Set(prefs.dismissedIds);
  return notifications.filter((item) => !dismissed.has(item.id));
}

export function countUnreadNotifications(
  notifications: Array<{ id: string; severity: string }>,
  prefs: NotificationPrefs,
): number {
  const read = new Set(prefs.readIds);
  return notifications.filter(
    (item) => item.severity !== "low" && !read.has(item.id),
  ).length;
}
