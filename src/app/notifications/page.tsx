import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NotificationList } from "@/components/notifications/NotificationList";

export const metadata: Metadata = { title: "Уведомления" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Уведомления</h1>
      <NotificationList />
    </div>
  );
}
