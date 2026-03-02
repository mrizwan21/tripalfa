import React, { useState, useCallback } from "react";
import * as Icons from "lucide-react";

import { Button } from "@tripalfa/ui-components/ui/button";

const { Plus, Trash2, Edit, Play, Pause, Calendar, Users, BarChart3 } =
  Icons as any;

type NotificationCampaign = {
  id: string;
  name: string;
  description?: string;
  templateIds: string[];
  startDate: Date | string;
  endDate?: Date | string;
  recipients?: any[];
  status:
    | "draft"
    | "scheduled"
    | "active"
    | "paused"
    | "completed"
    | "cancelled";
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: string;
  tags?: string[];
  totalRecipients?: number;
};

// ============================================================================
// CAMPAIGN MANAGER COMPONENT
// ============================================================================

export interface NotificationCampaignManagerProps {
  campaigns?: NotificationCampaign[];
  onCreateCampaign?: (campaign: NotificationCampaign) => Promise<void>;
  onUpdateCampaign?: (campaign: NotificationCampaign) => Promise<void>;
  onDeleteCampaign?: (campaignId: string) => Promise<void>;
  disabled?: boolean;
}

export const NotificationCampaignManager: React.FC<
  NotificationCampaignManagerProps
> = ({
  campaigns = [],
  onCreateCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  disabled = false,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Notification Campaigns
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage multi-template campaigns
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-background rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          New Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 gap-4">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <CampaignForm
          campaign={
            editingId ? campaigns.find((c) => c.id === editingId) : undefined
          }
          onSave={async (campaign) => {
            if (editingId) {
              await onUpdateCampaign?.(campaign);
              setEditingId(null);
            } else {
              await onCreateCampaign?.(campaign);
              setIsCreating(false);
            }
          }}
          onCancel={() => {
            setIsCreating(false);
            setEditingId(null);
          }}
          disabled={disabled}
        />
      )}

      {/* Campaign List */}
      <div className="space-y-3">
        {filteredCampaigns.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No campaigns found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a new campaign to get started
            </p>
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={() => setEditingId(campaign.id)}
              onDelete={() => onDeleteCampaign?.(campaign.id)}
              disabled={disabled}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CAMPAIGN FORM SUB-COMPONENT
// ============================================================================

interface CampaignFormProps {
  campaign?: NotificationCampaign;
  onSave: (campaign: NotificationCampaign) => Promise<void>;
  onCancel: () => void;
  disabled: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  campaign,
  onSave,
  onCancel,
  disabled,
}) => {
  const [formData, setFormData] = useState({
    name: campaign?.name || "",
    description: campaign?.description || "",
    templateIds: campaign?.templateIds || [],
    startDate: campaign?.startDate
      ? new Date(campaign.startDate).toISOString().split("T")[0]
      : "",
    endDate: campaign?.endDate
      ? new Date(campaign.endDate).toISOString().split("T")[0]
      : "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = useCallback(async () => {
    if (!formData.name || !formData.startDate) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: campaign?.id || `camp-${Date.now()}`,
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        recipients: campaign?.recipients || [],
        status: campaign?.status || "draft",
        createdAt: campaign?.createdAt || new Date(),
        updatedAt: new Date(),
        createdBy: "current-user",
        tags: campaign?.tags || [],
      } as NotificationCampaign);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, campaign, onSave]);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <h3 className="font-semibold text-foreground text-xl font-semibold tracking-tight">
        {campaign ? "Edit Campaign" : "Create Campaign"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Campaign name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <input
          type="date"
          value={formData.startDate}
          onChange={(e) =>
            setFormData({ ...formData, startDate: e.target.value })
          }
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={2}
          className="md:col-span-2 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <input
          type="date"
          placeholder="End date (optional)"
          value={formData.endDate}
          onChange={(e) =>
            setFormData({ ...formData, endDate: e.target.value })
          }
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          onClick={onCancel}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted/40 text-foreground"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSubmitting || !formData.name}
          className="px-4 py-2 bg-blue-600 text-background rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Campaign"}
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// CAMPAIGN CARD SUB-COMPONENT
// ============================================================================

interface CampaignCardProps {
  campaign: NotificationCampaign;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onEdit,
  onDelete,
  disabled,
}) => {
  const statusColor =
    {
      draft: "bg-muted/60 text-foreground",
      scheduled: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      completed: "bg-muted/60 text-foreground",
      cancelled: "bg-red-100 text-red-800",
    }[campaign.status] || "bg-muted/60 text-foreground";

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-start justify-between">
      <div className="flex-1 gap-4">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-foreground text-xl font-semibold tracking-tight">
            {campaign.name}
          </h3>
          <span
            className={`text-xs px-2 py-1 rounded font-medium ${statusColor}`}
          >
            {campaign.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {campaign.description}
        </p>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            {new Date(campaign.startDate).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Users size={16} />
            {campaign.totalRecipients || 0} recipients
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 size={16} />
            {campaign.templateIds.length} templates
          </div>
        </div>
      </div>

      <div className="flex gap-2 ml-4">
        <Button
          onClick={onEdit}
          disabled={disabled}
          className="p-2 hover:bg-muted/40 rounded-lg text-muted-foreground"
        >
          <Edit size={18} />
        </Button>
        <Button
          onClick={onDelete}
          disabled={disabled}
          className="p-2 hover:bg-red-100 rounded-lg text-red-600"
        >
          <Trash2 size={18} />
        </Button>
      </div>
    </div>
  );
};

export default NotificationCampaignManager;
