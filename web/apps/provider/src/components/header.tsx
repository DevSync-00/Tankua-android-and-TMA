"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Settings,
  User,
  LogOut,
  Calendar,
} from "lucide-react";
import { Button, Badge, Avatar } from "@tankua/ui";
import {
  getInAppNotifications,
  markNotificationRead,
  formatNotificationTime,
  type InAppNotification,
} from "@tankua/database";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [currentUser, setCurrentUser] = useState({ name: "Provider", role: "Owner" });
  const notificationsRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getInAppNotifications("provider");
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load provider notifications:", error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    try {
      const stored = JSON.parse(localStorage.getItem("provider_user") || "{}");
      setCurrentUser({
        name: stored.name || stored.full_name || stored.email || "Provider",
        role: stored.role || "Owner",
      });
    } catch {
      // Keep the neutral fallback for legacy sessions.
    }
  }, [loadNotifications]);

  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications, loadNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notification: InAppNotification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
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
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-xl">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side - Title */}
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-stone-950 sm:text-xl">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {actions}

          {/* Today's date */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { 
                weekday: "short", 
                month: "short", 
                day: "numeric" 
              })}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-muted transition-colors touch-manipulation"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-slide-down z-50">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="default">{unreadCount} new</Badge>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                          !notification.is_read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 mt-2 rounded-full ${!notification.is_read ? "bg-primary" : "bg-transparent"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border">
            <Avatar name={currentUser.name} size="sm" />
            <div className="hidden lg:block text-left">
              <p className="max-w-36 truncate text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
