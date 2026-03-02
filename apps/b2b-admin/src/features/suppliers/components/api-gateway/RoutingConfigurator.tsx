import React, { useState, useCallback } from "react";
import { useGatewayForm } from "@/features/suppliers/context/GatewayFormContext";

import { Button } from "@tripalfa/ui-components/ui/button";

type ChannelType = "b2b" | "b2c" | "api" | "agent" | string;

type GeographyRouting = {
  id?: string;
  geography: string;
  geographyType: string;
  preferredEndpoint: string;
  fallbackEndpointIds: string[];
  isActive: boolean;
  [key: string]: any;
};

type ChannelRouting = {
  id?: string;
  channel: ChannelType;
  preferredEndpoint: string;
  fallbackEndpointIds: string[];
  isActive: boolean;
  [key: string]: any;
};

// ============================================================================
// TYPES
// ============================================================================

export interface RoutingConfiguratorProps {
  /**
   * Current geography routing configurations
   */
  geographyRoutings?: GeographyRouting[];
  /**
   * Current channel routing configurations
   */
  channelRoutings?: ChannelRouting[];
  /**
   * Available endpoints to route to
   */
  availableEndpoints?: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
  }>;
  /**
   * Callback when geography routing changes
   */
  onGeographyChange?: (routings: GeographyRouting[]) => void;
  /**
   * Callback when channel routing changes
   */
  onChannelChange?: (routings: ChannelRouting[]) => void;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Custom CSS class
   */
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RoutingConfigurator: React.FC<RoutingConfiguratorProps> = ({
  geographyRoutings = [],
  channelRoutings = [],
  availableEndpoints = [],
  onGeographyChange,
  onChannelChange,
  disabled = false,
  className = "",
}) => {
  const form = useGatewayForm();
  const [activeTab, setActiveTab] = useState<"geography" | "channel">(
    "geography",
  );
  const [editingGeographyId, setEditingGeographyId] = useState<string | null>(
    null,
  );
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);

  const currentGeographies = (
    form.formData.geographyRoutings || geographyRoutings
  ).map((g) => ({
    ...g,
    id: (g as any).id || `geo-${Date.now()}-${Math.random()}`,
  })) as GeographyRouting[];
  const currentChannels = (
    form.formData.channelRoutings || channelRoutings
  ).map((c) => ({
    ...c,
    id: (c as any).id || `channel-${Date.now()}-${Math.random()}`,
  })) as ChannelRouting[];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-foreground mb-1 text-xl font-semibold tracking-tight">
          Smart Routing Configuration
        </h3>
        <p className="text-sm text-muted-foreground">
          Direct API requests to different endpoints based on geography or user
          channel. Set primary and fallback endpoints for redundancy.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <Button
            onClick={() => setActiveTab("geography")}
            className={`
              px-4 py-3 font-medium text-sm border-b-2 transition-all
              ${
                activeTab === "geography"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }
            `}
          >
            Geography Routing ({currentGeographies.length})
          </Button>
          <Button
            onClick={() => setActiveTab("channel")}
            className={`
              px-4 py-3 font-medium text-sm border-b-2 transition-all
              ${
                activeTab === "channel"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }
            `}
          >
            Channel Routing ({currentChannels.length})
          </Button>
        </div>
      </div>

      {/* Geography Routing Tab */}
      {activeTab === "geography" && (
        <GeographyRoutingSection
          geographies={currentGeographies}
          availableEndpoints={availableEndpoints}
          editingId={editingGeographyId}
          onEdit={setEditingGeographyId}
          onChange={(routings) => {
            form.updateField("geographyRoutings", routings);
            onGeographyChange?.(routings);
          }}
          disabled={disabled}
        />
      )}

      {/* Channel Routing Tab */}
      {activeTab === "channel" && (
        <ChannelRoutingSection
          channels={currentChannels}
          availableEndpoints={availableEndpoints}
          editingId={editingChannelId}
          onEdit={setEditingChannelId}
          onChange={(routings) => {
            form.updateField("channelRoutings", routings);
            onChannelChange?.(routings);
          }}
          disabled={disabled}
        />
      )}
    </div>
  );
};

// ============================================================================
// GEOGRAPHY ROUTING SECTION
// ============================================================================

interface GeographyRoutingSectionProps {
  geographies: GeographyRouting[];
  availableEndpoints: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
  }>;
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onChange: (routings: GeographyRouting[]) => void;
  disabled: boolean;
}

const GeographyRoutingSection: React.FC<GeographyRoutingSectionProps> = ({
  geographies,
  availableEndpoints,
  editingId,
  onEdit,
  onChange,
  disabled,
}) => {
  const [newGeography, setNewGeography] =
    useState<Partial<GeographyRouting> | null>(null);

  const handleAdd = useCallback(() => {
    setNewGeography({
      geography: "",
      geographyType: "global",
      preferredEndpoint: availableEndpoints[0]?.id || "",
      fallbackEndpointIds: [],
      isActive: true,
    });
  }, [availableEndpoints]);

  const handleSave = useCallback(
    (geography: Partial<GeographyRouting>) => {
      if (!geography.geography) return;

      const geographyWithId = {
        ...geography,
        id: editingId || `geo-${Date.now()}`,
      } as GeographyRouting;

      const updated = editingId
        ? geographies.map((g) =>
            g.geography === editingId ? geographyWithId : g,
          )
        : [...geographies, geographyWithId];

      onChange(updated);
      onEdit(null);
      setNewGeography(null);
    },
    [geographies, editingId, onChange, onEdit],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(geographies.filter((g) => g.geography !== id));
      onEdit(null);
    },
    [geographies, onChange, onEdit],
  );

  return (
    <div className="space-y-4">
      {/* Add Button */}
      {!newGeography && editingId === null && (
        <Button
          onClick={handleAdd}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          + Add Geography Routing
        </Button>
      )}

      {/* Edit/Add Form */}
      {(newGeography || editingId) && (
        <GeographyRoutingForm
          geography={
            editingId
              ? geographies.find((g) => g.geography === editingId) || undefined
              : newGeography || undefined
          }
          availableEndpoints={availableEndpoints}
          onSave={handleSave}
          onCancel={() => {
            onEdit(null);
            setNewGeography(null);
          }}
          disabled={disabled}
        />
      )}

      {/* List */}
      <div className="space-y-2">
        {geographies.map((geography) => (
          <GeographyRoutingCard
            key={geography.geography}
            geography={geography}
            availableEndpoints={availableEndpoints}
            isEditing={editingId === geography.geography}
            onEdit={() => onEdit(geography.geography)}
            onDelete={() => handleDelete(geography.geography)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Empty State */}
      {geographies.length === 0 && !newGeography && editingId === null && (
        <div className="p-6 text-center border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-3">
            No geography routing configured
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Add routing rules to direct traffic by geographic location
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// GEOGRAPHY ROUTING FORM
// ============================================================================

interface GeographyRoutingFormProps {
  geography?: Partial<GeographyRouting>;
  availableEndpoints: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
  }>;
  onSave: (geography: Partial<GeographyRouting>) => void;
  onCancel: () => void;
  disabled: boolean;
}

const GeographyRoutingForm: React.FC<GeographyRoutingFormProps> = ({
  geography,
  availableEndpoints,
  onSave,
  onCancel,
  disabled,
}) => {
  const [formData, setFormData] = useState(
    geography || {
      geography: "",
      geographyType: "global" as const,
      countryCode: "",
      regionCode: "",
      preferredEndpoint: availableEndpoints[0]?.id || "",
      fallbackEndpointIds: [],
      isActive: true,
    },
  );

  return (
    <div className="p-4 bg-muted border border-border rounded-lg space-y-4">
      <h4 className="font-medium text-foreground">
        {geography ? "Edit" : "Add"} Geography Routing
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Geography Name
          </label>
          <input
            type="text"
            value={formData.geography || ""}
            onChange={(e) =>
              setFormData({ ...formData, geography: e.target.value })
            }
            placeholder="e.g., Europe, North America"
            disabled={disabled}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Geography Type
          </label>
          <select
            value={formData.geographyType || "global"}
            onChange={(e) =>
              setFormData({
                ...formData,
                geographyType: e.target.value as
                  | "global"
                  | "regional"
                  | "country",
              })
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="global">Global</option>
            <option value="regional">Regional</option>
            <option value="country">Country</option>
          </select>
        </div>

        {/* Country Code */}
        {formData.geographyType === "country" && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Country Code
            </label>
            <input
              type="text"
              value={formData.countryCode || ""}
              onChange={(e) =>
                setFormData({ ...formData, countryCode: e.target.value })
              }
              placeholder="US, GB, DE..."
              maxLength={2}
              disabled={disabled}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Region Code */}
        {formData.geographyType === "regional" && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Region Code
            </label>
            <input
              type="text"
              value={formData.regionCode || ""}
              onChange={(e) =>
                setFormData({ ...formData, regionCode: e.target.value })
              }
              placeholder="EMEA, APAC, AMER..."
              disabled={disabled}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Preferred Endpoint */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            Preferred Endpoint
          </label>
          <select
            value={formData.preferredEndpoint || ""}
            onChange={(e) =>
              setFormData({ ...formData, preferredEndpoint: e.target.value })
            }
            disabled={disabled || availableEndpoints.length === 0}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select endpoint...</option>
            {availableEndpoints.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.name} ({ep.method} {ep.url})
              </option>
            ))}
          </select>
        </div>

        {/* Active */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            <input
              type="checkbox"
              checked={
                formData.isActive === undefined ? true : formData.isActive
              }
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              disabled={disabled}
              className="rounded"
            />
            <span className="text-sm font-medium text-foreground">Active</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          onClick={onCancel}
          disabled={disabled}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm font-medium"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSave(formData)}
          disabled={
            disabled || !formData.geography || !formData.preferredEndpoint
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {geography ? "Update" : "Add"} Routing
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// GEOGRAPHY ROUTING CARD
// ============================================================================

interface GeographyRoutingCardProps {
  geography: GeographyRouting;
  availableEndpoints: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
  }>;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}

const GeographyRoutingCard: React.FC<GeographyRoutingCardProps> = ({
  geography,
  availableEndpoints,
  isEditing,
  onEdit,
  onDelete,
  disabled,
}) => {
  const preferredEndpoint = availableEndpoints.find(
    (e) => e.id === geography.preferredEndpoint,
  );

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-foreground">{geography.geography}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Type: {geography.geographyType}
            {geography.countryCode && ` • Country: ${geography.countryCode}`}
            {geography.regionCode && ` • Region: ${geography.regionCode}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Edit
          </Button>
          <Button
            onClick={onDelete}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Delete
          </Button>
        </div>
      </div>

      {preferredEndpoint && (
        <div className="text-sm text-muted-foreground">
          Primary: <span className="font-mono">{preferredEndpoint.name}</span>
        </div>
      )}

      {!geography.isActive && (
        <div className="mt-2 text-sm text-amber-600">
          ⚠️ This routing is disabled
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CHANNEL ROUTING SECTION
// ============================================================================

interface ChannelRoutingSectionProps {
  channels: ChannelRouting[];
  availableEndpoints: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
  }>;
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onChange: (routings: ChannelRouting[]) => void;
  disabled: boolean;
}

const CHANNEL_OPTIONS = [
  { value: "web", label: "Web", icon: "🌐" },
  { value: "mobile", label: "Mobile", icon: "📱" },
  { value: "b2b", label: "B2B", icon: "🏢" },
  { value: "b2c", label: "B2C", icon: "👤" },
  { value: "api", label: "API", icon: "⚙️" },
];

const ChannelRoutingSection: React.FC<ChannelRoutingSectionProps> = ({
  channels,
  availableEndpoints,
  editingId,
  onEdit,
  onChange,
  disabled,
}) => {
  const [newChannel, setNewChannel] = useState<Partial<ChannelRouting> | null>(
    null,
  );

  const handleAdd = useCallback(() => {
    setNewChannel({
      channel: "web",
      priority: 1,
      preferredEndpoint: availableEndpoints[0]?.id || "",
      fallbackEndpointIds: [],
      isActive: true,
    });
  }, [availableEndpoints]);

  const handleSave = useCallback(
    (channel: Partial<ChannelRouting>) => {
      if (!channel.channel) return;

      const channelWithId = {
        ...channel,
        id: editingId || `channel-${Date.now()}`,
      } as ChannelRouting;

      const updated = editingId
        ? channels.map((c) => (c.channel === editingId ? channelWithId : c))
        : [...channels, channelWithId];

      onChange(updated);
      onEdit(null);
      setNewChannel(null);
    },
    [channels, editingId, onChange, onEdit],
  );

  const handleDelete = useCallback(
    (channel: string) => {
      onChange(channels.filter((c) => c.channel !== channel));
      onEdit(null);
    },
    [channels, onChange, onEdit],
  );

  return (
    <div className="space-y-4">
      {/* Channel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
        {CHANNEL_OPTIONS.map((option) => {
          const channelConfig = channels.find(
            (c) => c.channel === option.value,
          );

          return (
            <div
              key={option.value}
              className={`
                p-3 rounded-lg border-2 text-center cursor-pointer transition-all
                ${
                  editingId === option.value
                    ? "border-blue-500 bg-blue-50"
                    : channelConfig
                      ? "border-green-300 bg-green-50"
                      : "border-border hover:border-border"
                }
              `}
              onClick={() => onEdit(option.value)}
            >
              <p className="text-2xl mb-1">{option.icon}</p>
              <p className="text-sm font-medium text-foreground">
                {option.label}
              </p>
              {channelConfig && (
                <p className="text-xs text-green-700 mt-1">✓ Configured</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Form */}
      {editingId && (
        <ChannelRoutingForm
          channel={channels.find((c) => c.channel === editingId)}
          allChannels={CHANNEL_OPTIONS}
          availableEndpoints={availableEndpoints}
          onSave={handleSave}
          onCancel={() => onEdit(null)}
          disabled={disabled}
        />
      )}

      {/* List */}
      <div className="space-y-2">
        {channels.map((channel) => (
          <ChannelRoutingCard
            key={channel.channel}
            channel={channel}
            channelLabel={
              CHANNEL_OPTIONS.find((o) => o.value === channel.channel)?.label
            }
            availableEndpoints={availableEndpoints}
            onEdit={() => onEdit(channel.channel)}
            onDelete={() => handleDelete(channel.channel)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Empty State */}
      {channels.length === 0 && editingId === null && (
        <div className="p-6 text-center border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-3">
            No channel routing configured
          </p>
          <p className="text-sm text-muted-foreground">
            Click on a channel above to add routing rules
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CHANNEL ROUTING FORM
// ============================================================================

interface ChannelRoutingFormProps {
  channel?: ChannelRouting;
  allChannels: Array<{ value: string; label: string; icon: string }>;
  availableEndpoints: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
  }>;
  onSave: (channel: Partial<ChannelRouting>) => void;
  onCancel: () => void;
  disabled: boolean;
}

const ChannelRoutingForm: React.FC<ChannelRoutingFormProps> = ({
  channel,
  allChannels,
  availableEndpoints,
  onSave,
  onCancel,
  disabled,
}) => {
  const [formData, setFormData] = useState(
    channel || {
      channel: "web" as ChannelType,
      priority: 1,
      preferredEndpoint: availableEndpoints[0]?.id || "",
      fallbackEndpointIds: [],
      isActive: true,
    },
  );

  const channelLabel =
    allChannels.find((c) => c.value === formData.channel)?.label ||
    formData.channel;

  return (
    <div className="p-4 bg-muted border border-border rounded-lg space-y-4">
      <h4 className="font-medium text-foreground">
        Configure {channelLabel} Routing
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Priority (1-10)
          </label>
          <input
            type="number"
            value={formData.priority || 1}
            onChange={(e) =>
              setFormData({
                ...formData,
                priority: Math.min(10, Math.max(1, parseInt(e.target.value))),
              })
            }
            min={1}
            max={10}
            disabled={disabled}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Higher numbers = higher priority
          </p>
        </div>

        {/* Preferred Endpoint */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Preferred Endpoint
          </label>
          <select
            value={formData.preferredEndpoint || ""}
            onChange={(e) =>
              setFormData({ ...formData, preferredEndpoint: e.target.value })
            }
            disabled={disabled || availableEndpoints.length === 0}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select endpoint...</option>
            {availableEndpoints.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.name}
              </option>
            ))}
          </select>
        </div>

        {/* Active */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            <input
              type="checkbox"
              checked={
                formData.isActive === undefined ? true : formData.isActive
              }
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              disabled={disabled}
              className="rounded"
            />
            <span className="text-sm font-medium text-foreground">
              Active (this routing rule is enabled)
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          onClick={onCancel}
          disabled={disabled}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm font-medium"
        >
          Close
        </Button>
        <Button
          onClick={() => onSave(formData)}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Save Routing
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// CHANNEL ROUTING CARD
// ============================================================================

interface ChannelRoutingCardProps {
  channel: ChannelRouting;
  channelLabel?: string;
  availableEndpoints: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
  }>;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}

const ChannelRoutingCard: React.FC<ChannelRoutingCardProps> = ({
  channel,
  channelLabel,
  availableEndpoints,
  onEdit,
  onDelete,
  disabled,
}) => {
  const preferredEndpoint = availableEndpoints.find(
    (e) => e.id === channel.preferredEndpoint,
  );

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-foreground">
            {channelLabel} Routing
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Priority: {channel.priority}/10 • Fallbacks:{" "}
            {channel.fallbackEndpointIds?.length || 0}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Edit
          </Button>
          <Button
            onClick={onDelete}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Delete
          </Button>
        </div>
      </div>

      {preferredEndpoint && (
        <div className="text-sm text-muted-foreground">
          Primary: <span className="font-mono">{preferredEndpoint.name}</span>
        </div>
      )}

      {!channel.isActive && (
        <div className="mt-2 text-sm text-amber-600">
          ⚠️ This routing is disabled
        </div>
      )}
    </div>
  );
};
