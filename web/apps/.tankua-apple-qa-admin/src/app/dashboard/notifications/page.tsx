"use client";

import { useState } from "react";
import { Plus, Send } from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@tankua/ui";

const templates = [
  { id: 1, name: "System Update", description: "Notify users about system changes" },
  { id: 2, name: "Promotion", description: "Send promotional offers" },
  { id: 3, name: "Provider Notice", description: "Important updates for providers" },
  { id: 4, name: "Holiday Greeting", description: "Holiday wishes and offers" },
];

export default function NotificationsPage() {
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div className="min-h-screen">
      <Header
        title="Notifications"
        subtitle="Manage push notifications and announcements"
        actions={
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCompose(true)}>
            New Notification
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-sm text-muted-foreground">Notification history is unavailable.</p>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  onClick={() => setShowCompose(true)}
                >
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Compose Modal Placeholder */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg p-6">
              <h2 className="text-xl font-bold mb-4">Compose Notification</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="Notification title"
                    className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    rows={3}
                    placeholder="Your message..."
                    className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience</label>
                  <select className="w-full px-4 py-2 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background">
                    <option value="all">All Users</option>
                    <option value="users">App Users Only</option>
                    <option value="providers">Providers Only</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                  <Button leftIcon={<Send className="h-4 w-4" />}>Send Now</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

