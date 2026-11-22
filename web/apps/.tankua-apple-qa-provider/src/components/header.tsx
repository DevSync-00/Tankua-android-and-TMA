"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronLeft } from "lucide-react";
import { Avatar } from "@tankua/ui";
import {
  getInAppNotifications,
  markNotificationRead,
  formatNotificationTime,
  type InAppNotification,
} from "@tankua/database";
import { getParentSection, ProviderNavigationButton } from "./sidebar";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const panelId = useId();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationError, setNotificationError] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: "Provider", role: "" });
  const notificationsRef = useRef<HTMLDivElement>(null);
  const notificationsButton = useRef<HTMLButtonElement>(null);
  const parentSection = actions ? undefined : getParentSection(pathname);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationError(false);
    try {
      setNotifications(await getInAppNotifications("provider"));
    } catch (error) {
      setNotificationError(true);
      console.error("Failed to load provider notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    try {
      const stored = JSON.parse(localStorage.getItem("provider_user") || "{}");
      setCurrentUser({
        name: stored.name || stored.full_name || stored.email || "Provider",
        role: stored.role || "",
      });
    } catch {
      // Keep the default identity for legacy sessions.
    }
  }, [loadNotifications]);

  useEffect(() => {
    if (!showNotifications) return;
    const dismissNotifications = (event: PointerEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("pointerdown", dismissNotifications);
    return () => document.removeEventListener("pointerdown", dismissNotifications);
  }, [showNotifications]);

  const unreadCount = notifications.filter(({ is_read }) => !is_read).length;

  const handleNotificationClick = async (notification: InAppNotification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((previous) => previous.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        ));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    if (notification.action_url) {
      setShowNotifications(false);
      router.push(notification.action_url);
    }
  };

  return (
    <header className="portal-header sticky top-0 z-40 border-b border-border">
      <div className="mx-auto grid min-h-[4.75rem] max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto_auto] lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <ProviderNavigationButton />
          <div className="min-w-0">
            {parentSection ? (
              <Link
                href={parentSection.href}
                className="mb-0.5 inline-flex items-center gap-0.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              >
                <ChevronLeft aria-hidden="true" className="size-3.5" />
                {parentSection.label}
              </Link>
            ) : null}
            <h1 className="portal-page-title">{title}</h1>
            {subtitle ? <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-sm">{subtitle}</p> : null}
          </div>
        </div>

        {actions ? (
          <div className="col-span-2 row-start-2 flex min-w-0 items-center gap-2 overflow-x-auto py-1 md:col-span-1 md:col-start-2 md:row-start-1 md:overflow-visible">
            {actions}
          </div>
        ) : null}

        <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-3 md:col-start-3">
          <div
            className="relative"
            ref={notificationsRef}
            onKeyDown={(event) => {
              if (!showNotifications || event.key !== "Escape") return;
              setShowNotifications(false);
              notificationsButton.current?.focus();
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setShowNotifications(false);
            }}
          >
            <button
              type="button"
              ref={notificationsButton}
              onClick={() => {
                if (!showNotifications && !notificationsLoading) void loadNotifications();
                setShowNotifications(!showNotifications);
              }}
              className="relative grid size-10 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
              aria-expanded={showNotifications}
              aria-controls={panelId}
            >
              <Bell aria-hidden="true" className="size-4" />
              {unreadCount > 0 ? <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-card" /> : null}
            </button>

            <section
              id={panelId}
              aria-label="Notifications"
              hidden={!showNotifications}
              className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
                {unreadCount > 0 ? <span className="text-xs font-medium text-muted-foreground">{unreadCount} unread</span> : null}
              </div>
              <div className="max-h-80 overflow-y-auto overscroll-contain">
                {notifications.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <li key={notification.id}>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${notification.is_read ? "" : "bg-accent"}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.is_read ? "bg-transparent" : "bg-primary"}`}
                          />
                          <span className="min-w-0">
                            <span className="block break-words text-sm font-medium text-foreground">
                              {!notification.is_read ? <span className="sr-only">Unread </span> : null}
                              {notification.title}
                            </span>
                            <span className="mt-0.5 block break-words text-sm text-muted-foreground">{notification.message}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {formatNotificationTime(notification.created_at)}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {notificationError ? (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-muted-foreground">
                    <p>Couldn’t load notifications.</p>
                    <button
                      type="button"
                      onClick={loadNotifications}
                      className="rounded font-semibold text-foreground underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      Retry
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    {notificationsLoading ? "Loading notifications…" : "No notifications yet"}
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          <div className="hidden min-w-0 items-center gap-2 border-l border-border pl-3 xl:flex">
            <Avatar name={currentUser.name} size="sm" />
            <div className="min-w-0">
              <p className="max-w-28 truncate text-sm font-medium text-foreground" title={currentUser.name}>{currentUser.name}</p>
              {currentUser.role ? <p className="text-xs capitalize text-muted-foreground">{currentUser.role}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
