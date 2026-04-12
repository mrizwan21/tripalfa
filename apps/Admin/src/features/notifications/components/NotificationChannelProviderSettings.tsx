import React from "react";
import type { NotificationChannel } from "./NotificationChannelTypes";

interface ProviderSettingsSectionProps {
  type: NotificationChannel;
  provider: string;
  settings: any;
  onSettingsChange: (settings: any) => void;
  disabled?: boolean;
}

interface FieldProps {
  settings: any;
  onChange: (settings: any) => void;
  disabled?: boolean;
}

const inputClasses =
  "w-full px-2 py-1 border border-border rounded text-xs bg-background text-foreground";

const EmailSettingsFields: React.FC<FieldProps> = ({
  settings,
  onChange,
  disabled,
}) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        API Key / Password
      </label>
      <input
        type="password"
        placeholder="Enter API key or SMTP password"
        value={settings.apiKey || ""}
        onChange={(e) => onChange({ ...settings, apiKey: e.target.value })}
        disabled={disabled}
        className={inputClasses}
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        From Email
      </label>
      <input
        type="email"
        placeholder="noreply@example.com"
        value={settings.fromEmail || ""}
        onChange={(e) => onChange({ ...settings, fromEmail: e.target.value })}
        disabled={disabled}
        className={inputClasses}
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        From Name
      </label>
      <input
        type="text"
        placeholder="Your Company"
        value={settings.fromName || ""}
        onChange={(e) => onChange({ ...settings, fromName: e.target.value })}
        disabled={disabled}
        className={inputClasses}
      />
    </div>
  </div>
);

const SMSSettingsFields: React.FC<FieldProps> = ({
  settings,
  onChange,
  disabled,
}) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        Account SID / API Key
      </label>
      <input
        type="password"
        placeholder="Enter account SID or API key"
        value={settings.accountSid || ""}
        onChange={(e) => onChange({ ...settings, accountSid: e.target.value })}
        disabled={disabled}
        className={inputClasses}
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        Auth Token / API Secret
      </label>
      <input
        type="password"
        placeholder="Enter auth token or API secret"
        value={settings.authToken || ""}
        onChange={(e) => onChange({ ...settings, authToken: e.target.value })}
        disabled={disabled}
        className={inputClasses}
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        From Number
      </label>
      <input
        type="text"
        placeholder="+1234567890"
        value={settings.fromNumber || ""}
        onChange={(e) => onChange({ ...settings, fromNumber: e.target.value })}
        disabled={disabled}
        className={inputClasses}
      />
    </div>
  </div>
);

const PushSettingsFields: React.FC<FieldProps> = ({
  settings,
  onChange,
  disabled,
}) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        Server Key / API Key
      </label>
      <input
        type="password"
        placeholder="Enter server key"
        value={settings.serverKey || ""}
        onChange={(e) => onChange({ ...settings, serverKey: e.target.value })}
        disabled={disabled}
        className={inputClasses}
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        Project ID
      </label>
      <input
        type="text"
        placeholder="Enter project ID"
        value={settings.projectId || ""}
        onChange={(e) => onChange({ ...settings, projectId: e.target.value })}
        disabled={disabled}
        className={inputClasses}
      />
    </div>
  </div>
);

const WebhookSettingsFields: React.FC<FieldProps> = ({
  settings,
  onChange,
  disabled,
}) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        Webhook URL
      </label>
      <input
        type="text"
        placeholder="https://api.example.com/webhooks/notify"
        value={settings.webhookUrl || ""}
        onChange={(e) => onChange({ ...settings, webhookUrl: e.target.value })}
        disabled={disabled}
        className={inputClasses}
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        Secret Key (Optional)
      </label>
      <input
        type="password"
        placeholder="For request signing"
        value={settings.secretKey || ""}
        onChange={(e) => onChange({ ...settings, secretKey: e.target.value })}
        disabled={disabled}
        className={inputClasses}
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        Timeout (seconds)
      </label>
      <input
        type="number"
        placeholder="30"
        value={settings.timeoutSeconds || 30}
        onChange={(e) =>
          onChange({ ...settings, timeoutSeconds: parseInt(e.target.value) })
        }
        disabled={disabled}
        className={inputClasses}
      />
    </div>
  </div>
);

const SETTINGS_COMPONENTS: Record<NotificationChannel, React.FC<FieldProps>> = {
  email: EmailSettingsFields,
  sms: SMSSettingsFields,
  push: PushSettingsFields,
  webhook: WebhookSettingsFields,
  in_app: () => null,
};

export const ProviderSettingsSection: React.FC<
  ProviderSettingsSectionProps
> = ({ type, provider, settings, onSettingsChange, disabled = false }) => {
  if (!provider) {
    return (
      <div className="p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground">
        Select a provider to configure settings
      </div>
    );
  }

  const SettingsComponent = SETTINGS_COMPONENTS[type];

  return (
    <div className="space-y-3 p-4 bg-muted/40 rounded-lg border border-border">
      <p className="text-sm font-medium text-foreground">
        Provider Settings ({provider})
      </p>
      <SettingsComponent
        settings={settings}
        onChange={onSettingsChange}
        disabled={disabled}
      />
    </div>
  );
};
