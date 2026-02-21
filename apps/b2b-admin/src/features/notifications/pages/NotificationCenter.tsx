import { useMemo, useState } from "react"
import { Bell, Calendar, CheckCircle2, Clock, Loader2, Mail, Send, Sparkles, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tripalfa/ui-components/ui/card"
import { Button } from "@tripalfa/ui-components/ui/button"
import { Badge } from "@tripalfa/ui-components/ui/badge"
import { Input } from "@tripalfa/ui-components/ui/input"
import { Label } from "@tripalfa/ui-components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@tripalfa/ui-components/ui/select"
import { Textarea } from "@tripalfa/ui-components/ui/textarea"
import { Switch } from "@tripalfa/ui-components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@tripalfa/ui-components/ui/tabs"
import { Checkbox } from "@tripalfa/ui-components/ui/checkbox"
import { toast } from "sonner"
import { cn } from "@tripalfa/shared-utils/utils"

const mockNotifications = [
  {
    id: "notif-001",
    title: "Booking confirmed",
    message: "Order TRP-9842 confirmed and ticket issued",
    type: "booking",
    priority: "high",
    status: "sent",
    createdAt: "2024-03-14T10:30:00Z",
    channels: ["email", "push"],
    deliveryStatus: { email: "sent", push: "sent" },
  },
  {
    id: "notif-002",
    title: "Payment reminder",
    message: "Invoice INV-2231 is due in 2 days",
    type: "finance",
    priority: "medium",
    status: "scheduled",
    createdAt: "2024-03-15T09:00:00Z",
    channels: ["email"],
    deliveryStatus: { email: "pending" },
  },
  {
    id: "notif-003",
    title: "Supplier latency",
    message: "Amadeus responses elevated (850ms)",
    type: "system",
    priority: "low",
    status: "failed",
    createdAt: "2024-03-15T08:10:00Z",
    channels: ["push", "in_app"],
    deliveryStatus: { push: "failed", in_app: "pending" },
  },
]

const mockTemplates = [
  { id: "tmpl-boarding", name: "Boarding Pass Ready", category: "booking", channels: ["email", "sms"], updatedAt: "2024-03-10" },
  { id: "tmpl-payment", name: "Payment Reminder", category: "finance", channels: ["email"], updatedAt: "2024-03-08" },
  { id: "tmpl-offline", name: "Offline Request Received", category: "operations", channels: ["email", "push"], updatedAt: "2024-03-05" },
]

const channelOptions = [
  { value: "email", label: "Email", icon: Mail },
  { value: "push", label: "Push", icon: Bell },
  { value: "sms", label: "SMS", icon: Sparkles },
  { value: "in_app", label: "In-app", icon: Clock },
]

type ComposeForm = {
  title: string
  message: string
  type: string
  priority: string
  channels: string[]
  schedule?: string
  templateId?: string
  audience: string
  sendTest: boolean
  testTarget?: string
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [templates] = useState(mockTemplates)
  const [filters, setFilters] = useState({ status: "all", type: "all", search: "" })
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
  })
  const [isSending, setIsSending] = useState(false)

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const matchesStatus = filters.status === "all" || n.status === filters.status
      const matchesType = filters.type === "all" || n.type === filters.type
      const matchesSearch =
        filters.search.length === 0 ||
        n.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        n.message.toLowerCase().includes(filters.search.toLowerCase())
      return matchesStatus && matchesType && matchesSearch
    })
  }, [notifications, filters])

  const stats = useMemo(() => {
    const sent = notifications.filter((n) => n.status === "sent").length
    const scheduled = notifications.filter((n) => n.status === "scheduled").length
    const failed = notifications.filter((n) => n.status === "failed").length
    return { sent, scheduled, failed }
  }, [notifications])

  const updateForm = (key: keyof ComposeForm, value: any) => setForm((prev) => ({ ...prev, [key]: value }))

  const toggleChannel = (channel: string) => {
    setForm((prev) => {
      const exists = prev.channels.includes(channel)
      const nextChannels = exists ? prev.channels.filter((c) => c !== channel) : [...prev.channels, channel]
      return { ...prev, channels: nextChannels }
    })
  }

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required")
      return
    }
    if (form.channels.length === 0) {
      toast.error("Select at least one channel")
      return
    }

    setIsSending(true)
    try {
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: form.title,
        message: form.message,
        type: form.type,
        priority: form.priority,
        status: form.schedule ? "scheduled" : "sent",
        createdAt: new Date().toISOString(),
        channels: form.channels,
        deliveryStatus: form.channels.reduce((acc: Record<string, string>, ch) => {
          acc[ch] = form.schedule ? "pending" : "sent"
          return acc
        }, {}),
      } as any as typeof mockNotifications[0]
      setNotifications((prev) => [newNotif, ...prev])
      toast.success(form.schedule ? `Scheduled for ${form.schedule}` : "Notification sent")
      setForm((prev) => ({ ...prev, title: "", message: "", schedule: "", templateId: "" }))
    } catch (err) {
      console.error(err)
      toast.error("Failed to send notification")
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    toast.success("Notification deleted")
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notification Center</h1>
          <p className="text-sm text-slate-500">Create, schedule, and track omni-channel notifications.</p>
        </div>
        <Button onClick={handleSend} disabled={isSending}>
          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Send now
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-white/70 backdrop-blur">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Sent today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">{stats.sent}</div>
            <p className="text-xs text-slate-500">Delivered across all channels</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/70 backdrop-blur">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">{stats.scheduled}</div>
            <p className="text-xs text-slate-500">Queued for later delivery</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/70 backdrop-blur">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Failed</CardTitle>
            <Bell className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">{stats.failed}</div>
            <p className="text-xs text-slate-500">Action needed on failed deliveries</p>
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
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[220px]">
                  <Label>Search</Label>
                  <Input
                    placeholder="Search title or message"
                    value={filters.search}
                    onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  />
                </div>
                <div className="min-w-[160px]">
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(val) => setFilters((p) => ({ ...p, status: val }))}>
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
                <div className="min-w-[160px]">
                  <Label>Type</Label>
                  <Select value={filters.type} onValueChange={(val) => setFilters((p) => ({ ...p, type: val }))}>
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
            <CardContent className="divide-y divide-slate-200">
              {filtered.map((n) => (
                <div key={n.id} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {n.type}
                      </Badge>
                      <p className="text-slate-900 font-semibold">{n.title}</p>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{n.message}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      <span>• Priority: {n.priority}</span>
                      <span>• Channels: {n.channels.join(", ")}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(n.deliveryStatus).map(([channel, status]) => (
                        <Badge key={channel} variant="secondary" className="capitalize">
                          {channel}: {status}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "capitalize",
                        n.status === "failed" && "bg-rose-50 text-rose-700 border-rose-200",
                        n.status === "scheduled" && "bg-amber-50 text-amber-700 border-amber-200",
                        n.status === "sent" && "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}
                    >
                      {n.status}
                    </Badge>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleDelete(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Compose notification</CardTitle>
              <CardDescription>Send immediately or schedule across email, SMS, push, and in-app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Payment reminder for INV-2341" />
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={form.templateId} onValueChange={(val) => updateForm("templateId", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No template</SelectItem>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
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
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(val) => updateForm("type", val)}>
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
                  <Select value={form.priority} onValueChange={(val) => updateForm("priority", val)}>
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
                  <Input type="datetime-local" value={form.schedule} onChange={(e) => updateForm("schedule", e.target.value)} />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Channels</Label>
                <div className="grid gap-2 md:grid-cols-4">
                  {channelOptions.map((ch) => {
                    const Icon = ch.icon
                    const active = form.channels.includes(ch.value)
                    return (
                      <button
                        key={ch.value}
                        type="button"
                        onClick={() => toggleChannel(ch.value)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                          active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {ch.label}
                        <Checkbox checked={active} className="ml-auto" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Input value={form.audience} onChange={(e) => updateForm("audience", e.target.value)} placeholder="Segments, groups, or user IDs" />
                  <p className="text-xs text-slate-500">Support segments like "B2B organizations", "High value", "Unpaid invoices".</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">Send test first <Switch checked={form.sendTest} onCheckedChange={(val) => updateForm("sendTest", val)} /></Label>
                  <Input
                    value={form.testTarget}
                    onChange={(e) => updateForm("testTarget", e.target.value)}
                    placeholder="test@example.com"
                    disabled={!form.sendTest}
                  />
                  <p className="text-xs text-slate-500">Deliver to a single target before broadcasting.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setForm((p) => ({ ...p, title: "", message: "", schedule: "" }))}>
                  Clear
                </Button>
                <Button onClick={handleSend} disabled={isSending}>
                  {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Reusable content blocks for notifications.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <Card key={t.id} className="border-slate-200">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{t.category}</Badge>
                      <span className="text-[11px] text-slate-500">Updated {t.updatedAt}</span>
                    </div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {t.channels.map((ch) => (
                        <Badge key={ch} variant="secondary" className="capitalize">{ch}</Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2">
                    <Button size="sm" variant="outline">Preview</Button>
                    <Button size="sm">Use</Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
