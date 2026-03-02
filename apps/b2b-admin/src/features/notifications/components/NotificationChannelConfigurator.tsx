import React, { useCallback, useState } from "react";
import { Plus, Save } from "lucide-react";
import { ChannelCard } from "./NotificationChannelCard";
import { ChannelForm } from "./NotificationChannelForm";
import type { NotificationChannelConfig } from "./NotificationChannelTypes";
import { Button } from "@tripalfa/ui-components";

export interface NotificationChannelConfiguratorProps {
  channels?: NotificationChannelConfig[];
  onSave?: (channels: NotificationChannelConfig[]) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
}

const ConfigHeader: React.FC<{
  onAddChannel: () => void;
  disabled: boolean;
}> = ({ onAddChannel, disabled }) => (
  <div className="flex items-center justify-between gap-2">
    <div>
      <h2 className="text-2xl font-bold text-foreground">
        Channel Configuration
      </h2>
      <p className="text-muted-foreground mt-1">
        Configure provider settings for each notification channel
      </p>
    </div>
    <Button
      variant="default"
      size="default"
      onClick={onAddChannel}
      disabled={disabled}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      <Plus size={18} />
      Add Channel
    </Button>
  </div>
);

const ConfigActions: React.FC<{
  onCancel?: () => void;
  onSubmit: () => void;
  disabled: boolean;
  isSubmitting: boolean;
  hasChannels: boolean;
}> = ({ onCancel, onSubmit, disabled, isSubmitting, hasChannels }) => (
  <div className="flex gap-3 justify-end pt-6 border-t">
    <Button
      variant="outline"
      size="default"
      onClick={onCancel}
      disabled={disabled || isSubmitting}
      className="px-4 py-2 bg-muted/60 text-foreground rounded-lg font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      Cancel
    </Button>
    <Button
      variant="outline"
      size="default"
      onClick={onSubmit}
      disabled={disabled || isSubmitting || !hasChannels}
      className="px-4 py-2 text-white rounded-lg font-medium hover: disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      <Save size={18} />
      {isSubmitting ? "Saving..." : "Save Configuration"}
    </Button>
  </div>
);

export const NotificationChannelConfigurator: React.FC<
  NotificationChannelConfiguratorProps
> = ({ channels = [], onSave, onCancel, disabled = false }) => {
  const [channelList, setChannelList] =
    useState<NotificationChannelConfig[]>(channels);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddChannel = useCallback(() => {
    setIsAddingChannel(true);
    setEditingId(null);
  }, []);

  const handleSaveChannel = useCallback(
    async (config: NotificationChannelConfig) => {
      setIsSubmitting(true);
      try {
        if (editingId) {
          setChannelList((prev) =>
            prev.map((ch) => (ch.provider === editingId ? config : ch)),
          );
        } else {
          setChannelList((prev) => [...prev, config]);
        }
        setEditingId(null);
        setIsAddingChannel(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingId],
  );

  const handleDeleteChannel = useCallback((provider: string) => {
    setChannelList((prev) => prev.filter((ch) => ch.provider !== provider));
  }, []);

  const handleSetDefault = useCallback((provider: string) => {
    setChannelList((prev) =>
      prev.map((ch) => ({
        ...ch,
        isDefault: ch.provider === provider,
      })),
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSave?.(channelList);
    } finally {
      setIsSubmitting(false);
    }
  }, [channelList, onSave]);

  return (
    <div className="space-y-6">
      <ConfigHeader
        onAddChannel={handleAddChannel}
        disabled={disabled || isAddingChannel}
      />

      {isAddingChannel ? (
        <ChannelForm
          onSave={handleSaveChannel}
          onCancel={() => {
            setIsAddingChannel(false);
            setEditingId(null);
          }}
          disabled={isSubmitting}
        />
      ) : null}

      <div className="space-y-3">
        {channelList.length === 0 ? (
          <div className="bg-muted/40 border border-dashed border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No channels configured yet</p>
            <Button
              variant="outline"
              size="default"
              onClick={handleAddChannel}
              className="text-primary font-medium hover:text-primary/80 mt-2"
            >
              Configure your first channel
            </Button>
          </div>
        ) : (
          channelList.map((channel) => (
            <ChannelCard
              key={channel.provider}
              channel={channel}
              onDelete={() => handleDeleteChannel(channel.provider)}
              onSetDefault={() => handleSetDefault(channel.provider)}
              onEdit={() => {
                setEditingId(channel.provider);
                setIsAddingChannel(true);
              }}
              disabled={disabled}
            />
          ))
        )}
      </div>

      <ConfigActions
        onCancel={onCancel}
        onSubmit={handleSubmit}
        disabled={disabled}
        isSubmitting={isSubmitting}
        hasChannels={channelList.length > 0}
      />
    </div>
  );
};

export default NotificationChannelConfigurator;
