import React from "react";
import { Bell, Link, Mail, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@tripalfa/ui-components/ui/button";

import type {
  NotificationChannel,
  NotificationChannelConfig,
} from "./NotificationChannelTypes";

interface ChannelCardProps {
  channel: NotificationChannelConfig;
  onDelete: () => void;
  onSetDefault: () => void;
  onEdit: () => void;
  disabled?: boolean;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onDelete,
  onSetDefault,
  onEdit,
  disabled = false,
}) => {
  const iconMap: Record<NotificationChannel, React.ReactNode> = {
    email: <Mail size={20} />,
    sms: <MessageSquare size={20} />,
    push: <Bell size={20} />,
    webhook: <Link size={20} />,
    in_app: null,
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground">{iconMap[channel.type]}</div>
        <div>
          <p className="font-medium text-foreground">{channel.displayName}</p>
          <p className="text-sm text-muted-foreground">
            {channel.provider} •{" "}
            {channel.type.charAt(0).toUpperCase() + channel.type.slice(1)}
          </p>
        </div>
        {channel.isDefault ? (
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            Default
          </span>
        ) : null}
        {!channel.isActive ? (
          <span className="px-2 py-1 bg-muted/60 text-foreground text-xs font-medium rounded">
            Inactive
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {!channel.isDefault ? (
          <Button
            onClick={onSetDefault}
            disabled={disabled}
            className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Default
          </Button>
        ) : null}
        <Button
          onClick={onEdit}
          disabled={disabled}
          className="px-3 py-1 text-xs font-medium text-muted-foreground border border-border rounded hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Edit
        </Button>
        <Button
          onClick={onDelete}
          disabled={disabled || channel.isDefault}
          className="p-1 text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title={channel.isDefault ? "Cannot delete default channel" : ""}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
};
