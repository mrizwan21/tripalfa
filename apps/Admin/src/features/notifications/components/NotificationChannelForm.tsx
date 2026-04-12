import React, { useState } from "react";
import { ProviderSettingsSection } from "./NotificationChannelProviderSettings";
import { Button } from "@tripalfa/ui-components/ui/button";

import type {
  NotificationChannel,
  NotificationChannelConfig,
} from "./NotificationChannelTypes";

interface ChannelFormProps {
  channel?: NotificationChannelConfig;
  onSave: (channel: NotificationChannelConfig) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

const CHANNEL_TYPES: NotificationChannel[] = [
  "email",
  "sms",
  "push",
  "webhook",
];

const CHANNEL_PROVIDERS: Record<NotificationChannel, string[]> = {
  email: ["SendGrid", "Mailgun", "AWS SES", "SMTP", "Postmark"],
  sms: ["Twilio", "AWS SNS", "Vonage"],
  push: ["Firebase Cloud Messaging", "Apple Push Notification"],
  webhook: [],
  in_app: [],
};

const DEFAULT_SETTINGS_BY_CHANNEL: Record<NotificationChannel, any> = {
  email: { enabled: true, provider: "smtp", senderEmail: "", senderName: "" },
  sms: { enabled: true, provider: "twilio", accountId: "", authKey: "" },
  push: { enabled: true, provider: "firebase", apiKey: "" },
  webhook: { enabled: true, webhooks: [] },
  in_app: {},
};

export const ChannelForm: React.FC<ChannelFormProps> = ({
  channel,
  onSave,
  onCancel,
  disabled = false,
}) => {
  const [formData, setFormData] = useState<NotificationChannelConfig>(
    channel || {
      type: "email",
      provider: "",
      displayName: "",
      isActive: true,
      settings: DEFAULT_SETTINGS_BY_CHANNEL.email,
      isDefault: false,
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName || !formData.provider) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-lg p-6 space-y-4"
    >
      <h3 className="font-semibold text-foreground text-xl font-semibold tracking-tight">
        {channel ? "Edit Channel" : "Add New Channel"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Channel Type
          </label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as NotificationChannel,
                provider: "",
                settings:
                  DEFAULT_SETTINGS_BY_CHANNEL[
                    e.target.value as NotificationChannel
                  ],
              })
            }
            disabled={disabled || isSubmitting}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/60 disabled:cursor-not-allowed"
          >
            {CHANNEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Provider
          </label>
          {CHANNEL_PROVIDERS[formData.type].length > 0 ? (
            <select
              value={formData.provider}
              onChange={(e) =>
                setFormData({ ...formData, provider: e.target.value })
              }
              disabled={disabled || isSubmitting}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/60 disabled:cursor-not-allowed"
            >
              <option value="">Select provider...</option>
              {CHANNEL_PROVIDERS[formData.type].map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData.provider}
              onChange={(e) =>
                setFormData({ ...formData, provider: e.target.value })
              }
              placeholder="Enter webhook URL"
              disabled={disabled || isSubmitting}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/60 disabled:cursor-not-allowed"
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Display Name
        </label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) =>
            setFormData({ ...formData, displayName: e.target.value })
          }
          placeholder="e.g., Production Email Service"
          disabled={disabled || isSubmitting}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/60 disabled:cursor-not-allowed"
        />
      </div>

      <ProviderSettingsSection
        type={formData.type}
        provider={formData.provider}
        settings={formData.settings}
        onSettingsChange={(settings) => setFormData({ ...formData, settings })}
        disabled={disabled || isSubmitting || !formData.provider}
      />

      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.target.checked })
          }
          disabled={disabled || isSubmitting}
          className="rounded"
        />
        <span className="text-sm text-foreground">Active</span>
      </label>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          type="button"
          onClick={onCancel}
          disabled={disabled || isSubmitting}
          className="px-4 py-2 bg-muted/60 text-foreground rounded-lg font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            disabled ||
            isSubmitting ||
            !formData.displayName ||
            !formData.provider
          }
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Saving..." : "Save Channel"}
        </Button>
      </div>
    </form>
  );
};
