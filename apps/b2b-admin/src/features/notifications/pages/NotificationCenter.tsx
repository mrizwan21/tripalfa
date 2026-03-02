import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tripalfa/ui-components/ui/card";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Label } from "@tripalfa/ui-components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tripalfa/ui-components/ui/select";
import { Textarea } from "@tripalfa/ui-components/ui/textarea";
import { Switch } from "@tripalfa/ui-components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tripalfa/ui-components/ui/tabs";
import { Checkbox } from "@tripalfa/ui-components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@tripalfa/shared-utils/utils";
import NotificationRepository from "@/repositories/NotificationRepository";
import { useAccessControl } from "@/contexts/AccessControlContext";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  channels: string[];
  deliveryStatus: Record<string, string>;
};

type TemplateItem = {
  id: string;
  name: string;
  category: string;
  channels: string[];
  updatedAt: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const channelOptions = [
  { value: "email", label: "Email", icon: Mail },
  { value: "push", label: "Push", icon: Bell },
  { value: "sms", label: "SMS", icon: Sparkles },
  { value: "in_app", label: "In-app", icon: Clock },
];

type ComposeForm = {
  title: string;
  message: string;
  type: string;
  priority: string;
  channels: string[];
  schedule?: string;
  templateId?: string;
  audience: string;
  sendTest: boolean;
  testTarget?: string;
};

export default function NotificationCenter() {
  const { canManageRoute } = useAccessControl();
  const canManageNotifications = canManageRoute("/notifications");
  const notificationRepository = useMemo(
    () => new NotificationRepository("/api"),
    [],
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    search: "",
  });
  const [form, setForm] = useState<ComposeForm>({
    title: "",
    message: "",
    type: "system",
    priority: "medium",
    channels: ["email"],
    schedule: "",
    templateId: "",
    audience: "All users",
    sendTest: false,
    testTarget: "",
  });
  const [isSending, setIsSending] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const data = await notificationRepository.listNotifications(50, 0);
      const mappedNotifications: NotificationItem[] = data.map(
        (notification: any) => ({
          id: String(notification.id || notification.notificationId),
          title: String(notification.title || notification.subject || ""),
          message: String(notification.message || notification.body || ""),
          type: String(notification.type || "system"),
          priority: String(notification.priority || "medium"),
          status: String(notification.status || "sent"),
          createdAt: String(
            notification.createdAt || notification.created_at || "",
          ),
          channels: Array.isArray(notification.channels)
            ? notification.channels.map((value: unknown) => String(value))
            : [],
          deliveryStatus: isObject(notification.deliveryStatus)
            ? Object.entries(notification.deliveryStatus).reduce(
                (acc: Record<string, string>, [key, value]) => {
                  acc[key] = String(value);
                  return acc;
                },
                {},
              )
            : {},
        }),
      );
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, [notificationRepository]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const data = await notificationRepository.listTemplates(50, 0);
        const mappedTemplates: TemplateItem[] = data.map((template: any) => ({
          id: String(template.id || template.templateId),
          name: String(template.name || template.title || "Untitled template"),
          category: String(template.category || "system"),
          channels: Array.isArray(template.channels)
            ? template.channels.map((value: unknown) => String(value))
            : [],
          updatedAt: template.updatedAt
            ? String(template.updatedAt).slice(0, 10)
            : "-",
        }));
        setTemplates(mappedTemplates);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load notification templates");
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    void loadNotifications();
    void loadTemplates();
  }, [loadNotifications, notificationRepository]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const matchesStatus =
        filters.status === "all" || n.status === filters.status;
      const matchesType = filters.type === "all" || n.type === filters.type;
      const matchesSearch =
        filters.search.length === 0 ||
        n.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        n.message.toLowerCase().includes(filters.search.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [notifications, filters]);

  const stats = useMemo(() => {
    const sent = notifications.filter((n) => n.status === "sent").length;
    const scheduled = notifications.filter(
      (n) => n.status === "scheduled",
    ).length;
    const failed = notifications.filter((n) => n.status === "failed").length;
    return { sent, scheduled, failed };
  }, [notifications]);

  const updateForm = (key: keyof ComposeForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleChannel = (channel: string) => {
    setForm((prev) => {
      const exists = prev.channels.includes(channel);
      const nextChannels = exists
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels: nextChannels };
    });
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (form.channels.length === 0) {
      toast.error("Select at least one channel");
      return;
    }

    setIsSending(true);
    try {
      await notificationRepository.sendNotification({
        title: form.title,
        message: form.message,
        type: form.type,
        priority: form.priority,
        channels: form.channels,
        scheduledAt: form.schedule || undefined,
        templateId: form.templateId || undefined,
        audience: form.audience,
      } as any);

      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: form.title,
        message: form.message,
        type: form.type,
        priority: form.priority,
        status: form.schedule ? "scheduled" : "sent",
        createdAt: new Date().toISOString(),
        channels: form.channels,
        deliveryStatus: form.channels.reduce(
          (acc: Record<string, string>, ch) => {
            acc[ch] = form.schedule ? "pending" : "sent";
            return acc;
          },
          {},
        ),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      toast.success(
        form.schedule ? `Scheduled for ${form.schedule}` : "Notification sent",
      );
      setForm((prev) => ({
        ...prev,
        title: "",
        message: "",
        schedule: "",
        templateId: "",
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActiveActionId(id);
    try {
      await notificationRepository.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete notification");
    } finally {
      setActiveActionId((prev) => (prev === id ? null : prev));
    }
  };

  const handleRetry = async (id: string) => {
    setActiveActionId(id);
    try {
      await notificationRepository.retryFailedDeliveries(id);
      toast.success("Retry requested");
      await loadNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Failed to retry deliveries");
    } finally {
      setActiveActionId((prev) => (prev === id ? null : prev));
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, schedule, and track omni-channel notifications.
          </p>
        </div>
        <Button
          onClick={handleSend}
          disabled={isSending || !canManageNotifications}
        >
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send now
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sent today
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">
              {stats.sent}
            </div>
            <p className="text-xs text-muted-foreground">
              Delivered across all channels
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled
            </CardTitle>
            <Calendar className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">
              {stats.scheduled}
            </div>
            <p className="text-xs text-muted-foreground">
              Queued for later delivery
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
            <Bell className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">
              {stats.failed}
            </div>
            <p className="text-xs text-muted-foreground">
              Action needed on failed deliveries
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Activity</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-3">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-2 flex-1 min-w-[220px]">
                  <Label>Search</Label>
                  <Input
                    placeholder="Search title or message"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, search: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(val) =>
                      setFilters((p) => ({ ...p, status: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <Label>Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(val) =>
                      setFilters((p) => ({ ...p, type: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border p-6">
              {loadingNotifications && (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading notifications...
                </div>
              )}
              {!loadingNotifications && filtered.length === 0 && (
                <div className="py-6 text-sm text-muted-foreground">
                  No notifications found.
                </div>
              )}
              {!loadingNotifications &&
                filtered.map((n) => (
                  <div
                    key={n.id}
                    className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {n.type}
                        </Badge>
                        <p className="text-foreground font-semibold">
                          {n.title}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                        <span>• Priority: {n.priority}</span>
                        <span>• Channels: {n.channels.join(", ")}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(n.deliveryStatus).map(
                          ([channel, status]) => (
                            <Badge
                              key={channel}
                              variant="secondary"
                              className="capitalize"
                            >
                              {channel}: {status}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "capitalize",
                          n.status === "failed" &&
                            "bg-rose-50 text-rose-700 border-rose-200",
                          n.status === "scheduled" &&
                            "bg-amber-50 text-amber-700 border-amber-200",
                          n.status === "sent" &&
                            "bg-emerald-50 text-emerald-700 border-emerald-200",
                        )}
                      >
                        {n.status}
                      </Badge>
                      {n.status === "failed" && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={
                            !canManageNotifications || activeActionId === n.id
                          }
                          onClick={() => handleRetry(n.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={
                          !canManageNotifications || activeActionId === n.id
                        }
                        onClick={() => handleDelete(n.id)}
                      >
                        {activeActionId === n.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Compose notification</CardTitle>
              <CardDescription>
                Send immediately or schedule across email, SMS, push, and
                in-app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => updateForm("title", e.target.value)}
                    placeholder="Payment reminder for INV-2341"
                    disabled={!canManageNotifications}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select
                    value={form.templateId}
                    onValueChange={(val) => updateForm("templateId", val)}
                    disabled={!canManageNotifications}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No template</SelectItem>
                      {loadingTemplates && (
                        <SelectItem value="__loading" disabled>
                          Loading templates...
                        </SelectItem>
                      )}
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => updateForm("message", e.target.value)}
                  placeholder="Hi {{name}}, your invoice is due in 2 days..."
                  disabled={!canManageNotifications}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(val) => updateForm("type", val)}
                    disabled={!canManageNotifications}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(val) => updateForm("priority", val)}
                    disabled={!canManageNotifications}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Schedule (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={form.schedule}
                    onChange={(e) => updateForm("schedule", e.target.value)}
                    disabled={!canManageNotifications}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Channels</Label>
                <div className="grid gap-2 md:grid-cols-4">
                  {channelOptions.map((ch) => {
                    const Icon = ch.icon;
                    const active = form.channels.includes(ch.value);
                    return (
                      <Button
                        key={ch.value}
                        type="button"
                        onClick={() => toggleChannel(ch.value)}
                        disabled={!canManageNotifications}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-muted-foreground/50",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {ch.label}
                        <Checkbox checked={active} className="ml-auto" />
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Input
                    value={form.audience}
                    onChange={(e) => updateForm("audience", e.target.value)}
                    placeholder="Segments, groups, or user IDs"
                    disabled={!canManageNotifications}
                  />
                  <p className="text-xs text-muted-foreground">
                    Support segments like "B2B organizations", "High value",
                    "Unpaid invoices".
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    Send test first
                    <Switch
                      checked={form.sendTest}
                      onCheckedChange={(val) => updateForm("sendTest", val)}
                      disabled={!canManageNotifications}
                    />
                  </Label>
                  <Input
                    value={form.testTarget}
                    onChange={(e) => updateForm("testTarget", e.target.value)}
                    placeholder="test@example.com"
                    disabled={!form.sendTest || !canManageNotifications}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deliver to a single target before broadcasting.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={!canManageNotifications}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      title: "",
                      message: "",
                      schedule: "",
                    }))
                  }
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={isSending || !canManageNotifications}
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Reusable content blocks for notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 p-6">
              {templates.map((t) => (
                <Card key={t.id} className="border-border">
                  <CardHeader className="space-y-0 gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {t.category}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Updated {t.updatedAt}
                      </span>
                    </div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {t.channels.map((ch) => (
                        <Badge
                          key={ch}
                          variant="secondary"
                          className="capitalize"
                        >
                          {ch}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2 p-6">
                    <Button size="sm" variant="outline">
                      Preview
                    </Button>
                    <Button size="sm">Use</Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
