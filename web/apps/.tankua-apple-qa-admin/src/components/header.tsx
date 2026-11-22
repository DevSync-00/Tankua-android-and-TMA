"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import { Avatar } from "@tankua/ui";
import {
  formatNotificationTime, getInAppNotifications, markNotificationRead, type InAppNotification,
} from "@tankua/database";
import { AdminMenuButton } from "./sidebar";

type Panel = "notifications" | "account";

export function Header({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [notificationError, setNotificationError] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState({ name: "Administrator", email: "", role: "admin" });
  const toolsRef = useRef<HTMLDivElement>(null);
  const notificationButton = useRef<HTMLButtonElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setNotifications(await getInAppNotifications("admin"));
      setNotificationError(false);
    } catch (error) {
      console.error("Failed to load admin notifications:", error);
      setNotificationError(true);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    try {
      const stored = JSON.parse(localStorage.getItem("admin_user") || "{}");
      setCurrentAdmin({ name: stored.name || stored.email || "Administrator", email: stored.email || "", role: stored.role || "admin" });
    } catch {
      // Default to the generic account name for legacy sessions.
    }
  }, [loadNotifications]);

  useEffect(() => {
    if (!panel) return;

    const closeOutside = (event: PointerEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setPanel(null);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPanel(null);
      (panel === "account" ? accountButton : notificationButton).current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [panel]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const role = currentAdmin.role === "super_admin" ? "Super admin" : "Administrator";

  async function openNotification(notification: InAppNotification) {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((previous) => previous.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    if (notification.action_url) {
      setPanel(null);
      router.push(notification.action_url);
    }
  }

  async function signOut() {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    localStorage.removeItem("admin_user");
    router.replace("/login");
  }

  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        <AdminMenuButton />
        <div className="admin-header-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="admin-header-actions">{actions}</div>}
        <div className="admin-header-tools" ref={toolsRef}>
          <button
            ref={notificationButton}
            type="button"
            className="admin-icon-button"
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-controls="admin-notifications"
            aria-expanded={panel === "notifications"}
            onClick={() => {
              if (panel !== "notifications") void loadNotifications();
              setPanel(panel === "notifications" ? null : "notifications");
            }}
          >
            <Bell size={19} aria-hidden="true" />
            {unreadCount > 0 && <span className="admin-unread-indicator" />}
          </button>
          {panel === "notifications" && (
            <section className="admin-popover" id="admin-notifications" aria-label="Notifications">
              <div className="admin-popover-heading">
                <h2>Notifications</h2>{unreadCount > 0 && <span>{unreadCount} unread</span>}
              </div>
              <div className="admin-notification-list">
                {notificationError && <p role="status">Notifications couldn’t load. Open the notifications page to try again.</p>}
                {!notificationError && notifications.length === 0 && <p>No notifications yet.</p>}
                {notifications.map((notification) => (
                  <button type="button" key={notification.id} onClick={() => void openNotification(notification)} className="admin-notification-item" data-unread={!notification.is_read}>
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <small>{formatNotificationTime(notification.created_at)}</small>
                  </button>
                ))}
              </div>
              <Link href="/dashboard/notifications" className="admin-popover-link" onClick={() => setPanel(null)}>View all notifications</Link>
            </section>
          )}
          <button
            ref={accountButton}
            type="button"
            className="admin-account-button"
            onClick={() => setPanel(panel === "account" ? null : "account")}
            aria-label="Account options"
            aria-controls="admin-account"
            aria-expanded={panel === "account"}
          >
            <Avatar name={currentAdmin.name} size="sm" />
            <ChevronDown size={15} className="hidden xl:block" aria-hidden="true" />
          </button>
          {panel === "account" && (
            <section className="admin-popover admin-popover--account" id="admin-account" aria-label="Account options">
              <div className="admin-popover-heading admin-account-copy">
                <strong>{currentAdmin.name}</strong><span>{role}</span>
                {currentAdmin.email && currentAdmin.email !== currentAdmin.name && <span>{currentAdmin.email}</span>}
              </div>
              <Link href="/dashboard/settings" className="admin-popover-link" onClick={() => setPanel(null)}><Settings size={17} aria-hidden="true" />Account settings</Link>
              <button type="button" className="admin-popover-link" onClick={signOut}><LogOut size={17} aria-hidden="true" />Sign out</button>
            </section>
          )}
        </div>
      </div>
    </header>
  );
}
