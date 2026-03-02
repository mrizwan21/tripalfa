/**
 * Branding Settings Page - Marketing Tab
 *
 * This page allows B2B admin users to configure their organization's
 * branding including colors, logo, and visual identity.
 *
 * The branding configuration is stored and can be fetched by other
 * services to apply whitelabel styling.
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tripalfa/ui-components/ui/card";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Label } from "@tripalfa/ui-components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tripalfa/ui-components/ui/tabs";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { toast } from "sonner";
import {
  Save,
  Upload,
  RefreshCw,
  Eye,
  Check,
  Copy,
  Palette,
  Type,
  Image,
} from "lucide-react";
import api from "@/shared/lib/api";

// Color picker presets for quick selection
const COLOR_PRESETS = [
  // Blues
  {
    name: "Ocean Blue",
    primary: "212 89% 53%",
    secondary: "210 40% 96%",
    accent: "25 95% 53%",
  },
  {
    name: "Royal Purple",
    primary: "262 83% 58%",
    secondary: "270 50% 96%",
    accent: "320 85% 55%",
  },
  {
    name: "Forest Green",
    primary: "142 76% 36%",
    secondary: "145 35% 92%",
    accent: "25 95% 53%",
  },
  {
    name: "Sunset Orange",
    primary: "25 95% 53%",
    secondary: "30 100% 96%",
    accent: "350 85% 55%",
  },
  {
    name: "Rose Pink",
    primary: "340 85% 55%",
    secondary: "350 100% 96%",
    accent: "262 83% 58%",
  },
  {
    name: "Teal",
    primary: "173 80% 40%",
    secondary: "180 50% 94%",
    accent: "25 95% 53%",
  },
  {
    name: "Slate",
    primary: "215 25% 27%",
    secondary: "210 20% 96%",
    accent: "25 95% 53%",
  },
  {
    name: "Indigo",
    primary: "243 75% 59%",
    secondary: "245 60% 96%",
    accent: "320 75% 55%",
  },
];

// Schema for branding form
const brandingSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  primaryColor: z
    .string()
    .regex(/^\d+\s+\d+%\s+\d+%$/, "Use HSL format: hue saturation% lightness%"),
  primaryForeground: z.string().regex(/^\d+\s+\d+%\s+\d+%$/, "Use HSL format"),
  secondaryColor: z.string().regex(/^\d+\s+\d+%\s+\d+%$/, "Use HSL format"),
  secondaryForeground: z
    .string()
    .regex(/^\d+\s+\d+%\s+\d+%$/, "Use HSL format"),
  accentColor: z.string().regex(/^\d+\s+\d+%\s+\d+%$/, "Use HSL format"),
  accentForeground: z.string().regex(/^\d+\s+\d+%\s+\d+%$/, "Use HSL format"),
  logoUrl: z.string().url("Valid URL is required").optional().or(z.literal("")),
  faviconUrl: z
    .string()
    .url("Valid URL is required")
    .optional()
    .or(z.literal("")),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

export default function BrandingSettings() {
  const [activeTab, setActiveTab] = useState("colors");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      companyName: "",
      primaryColor: "221.2 83.2% 53.3%",
      primaryForeground: "210 40% 98%",
      secondaryColor: "210 40% 96%",
      secondaryForeground: "222.2 84% 4.9%",
      accentColor: "25 95% 53%",
      accentForeground: "0 0% 100%",
      logoUrl: "",
      faviconUrl: "",
    },
  });

  // Load existing branding configuration
  useEffect(() => {
    const loadBranding = async () => {
      try {
        setLoading(true);
        const res = await api.get("/branding/colors");
        if (res.data?.data) {
          const data = res.data.data;
          form.reset({
            companyName: data.companyName || "",
            primaryColor: data.primaryColor || "221.2 83.2% 53.3%",
            primaryForeground: data.primaryForeground || "210 40% 98%",
            secondaryColor: data.secondaryColor || "210 40% 96%",
            secondaryForeground: data.secondaryForeground || "222.2 84% 4.9%",
            accentColor: data.accentColor || "25 95% 53%",
            accentForeground: data.accentForeground || "0 0% 100%",
            logoUrl: data.logoUrl || "",
            faviconUrl: data.faviconUrl || "",
          });
        }
      } catch (error) {
        console.error("Failed to load branding:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
  }, []);

  // Apply branding to CSS variables for preview
  useEffect(() => {
    if (!previewMode) return;

    const root = document.documentElement;
    root.style.setProperty("--brand-primary", form.watch("primaryColor"));
    root.style.setProperty(
      "--brand-primary-foreground",
      form.watch("primaryForeground"),
    );
    root.style.setProperty("--brand-secondary", form.watch("secondaryColor"));
    root.style.setProperty(
      "--brand-secondary-foreground",
      form.watch("secondaryForeground"),
    );
    root.style.setProperty("--brand-accent", form.watch("accentColor"));
    root.style.setProperty(
      "--brand-accent-foreground",
      form.watch("accentForeground"),
    );

    return () => {
      // Reset when preview mode is disabled
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-primary-foreground");
      root.style.removeProperty("--brand-secondary");
      root.style.removeProperty("--brand-secondary-foreground");
      root.style.removeProperty("--brand-accent");
      root.style.removeProperty("--brand-accent-foreground");
    };
  }, [previewMode, form.watch()]);

  const handleSave = async (data: BrandingFormData) => {
    try {
      setSaving(true);
      await api.post("/branding/colors", data);
      toast.success("Branding settings saved successfully");

      // Also save to localStorage for immediate preview
      localStorage.setItem("branding_config", JSON.stringify({ colors: data }));
    } catch (error) {
      console.error("Failed to save branding:", error);
      toast.error("Failed to save branding settings");
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    form.setValue("primaryColor", preset.primary);
    form.setValue("secondaryColor", preset.secondary);
    form.setValue("accentColor", preset.accent);
    toast.success(`Applied "${preset.name}" color preset`);
  };

  const copyToClipboard = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedColor(label);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  // Helper to generate preview styles
  const getPreviewStyles = () =>
    ({
      "--preview-primary": `hsl(${form.watch("primaryColor")})`,
      "--preview-primary-fg": `hsl(${form.watch("primaryForeground")})`,
      "--preview-secondary": `hsl(${form.watch("secondaryColor")})`,
      "--preview-secondary-fg": `hsl(${form.watch("secondaryForeground")})`,
      "--preview-accent": `hsl(${form.watch("accentColor")})`,
      "--preview-accent-fg": `hsl(${form.watch("accentColor")})`,
    }) as React.CSSProperties;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Marketing & Branding
          </h1>
          <p className="mt-2 text-muted-foreground">
            Customize your organization's branding and visual identity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode ? "default" : "outline"}
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? "Hide Preview" : "Preview"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto gap-4">
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="logo" className="gap-2">
            <Image className="h-4 w-4" />
            Logo & Media
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Type className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Color Presets */}
            <Card>
              <CardHeader className="space-y-0 gap-2">
                <CardTitle>Color Presets</CardTitle>
                <CardDescription>
                  Quick-start color combinations for your brand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        borderColor: `hsl(${preset.primary})`,
                      }}
                    >
                      <div className="flex -space-x-2">
                        <div
                          className="h-6 w-6 rounded-full border-2 border-background"
                          style={{ backgroundColor: `hsl(${preset.primary})` }}
                        />
                        <div
                          className="h-6 w-6 rounded-full border-2 border-background"
                          style={{
                            backgroundColor: `hsl(${preset.secondary})`,
                          }}
                        />
                        <div
                          className="h-6 w-6 rounded-full border-2 border-background"
                          style={{ backgroundColor: `hsl(${preset.accent})` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Colors Form */}
            <Card>
              <CardHeader className="space-y-0 gap-2">
                <CardTitle>Custom Colors</CardTitle>
                <CardDescription>
                  Fine-tune your brand colors using HSL format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit(handleSave)}
                  className="space-y-6"
                >
                  {/* Primary Color */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-border"
                        style={{
                          backgroundColor: `hsl(${form.watch("primaryColor")})`,
                        }}
                      />
                      <Input
                        id="primaryColor"
                        {...form.register("primaryColor")}
                        placeholder="221.2 83.2% 53.3%"
                        className="flex-1 font-mono gap-4"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(form.watch("primaryColor"), "primary")
                        }
                      >
                        {copiedColor === "primary" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: hue saturation% lightness%
                    </p>
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-border"
                        style={{
                          backgroundColor: `hsl(${form.watch("secondaryColor")})`,
                        }}
                      />
                      <Input
                        id="secondaryColor"
                        {...form.register("secondaryColor")}
                        placeholder="210 40% 96%"
                        className="flex-1 font-mono gap-4"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(
                            form.watch("secondaryColor"),
                            "secondary",
                          )
                        }
                      >
                        {copiedColor === "secondary" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent / CTA Color</Label>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-border"
                        style={{
                          backgroundColor: `hsl(${form.watch("accentColor")})`,
                        }}
                      />
                      <Input
                        id="accentColor"
                        {...form.register("accentColor")}
                        placeholder="25 95% 53%"
                        className="flex-1 font-mono gap-4"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(form.watch("accentColor"), "accent")
                        }
                      >
                        {copiedColor === "accent" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save Colors"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logo & Media Tab */}
        <TabsContent value="logo">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Logo & Media Assets</CardTitle>
              <CardDescription>
                Upload your organization's logo and favicon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(handleSave)}
                className="space-y-6"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Logo URL */}
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      {...form.register("logoUrl")}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended size: 200x60px, PNG or SVG format
                    </p>
                  </div>

                  {/* Favicon URL */}
                  <div className="space-y-2">
                    <Label htmlFor="faviconUrl">Favicon URL</Label>
                    <Input
                      id="faviconUrl"
                      {...form.register("faviconUrl")}
                      placeholder="https://example.com/favicon.ico"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended size: 32x32px, ICO or PNG format
                    </p>
                  </div>
                </div>

                {/* Preview */}
                {form.watch("logoUrl") && (
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 text-sm font-medium">Logo Preview</h4>
                    <img
                      src={form.watch("logoUrl")}
                      alt="Logo preview"
                      className="h-12 w-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save Media"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Brand Preview</CardTitle>
              <CardDescription>
                See how your branding will appear across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl border bg-card p-8"
                style={getPreviewStyles()}
              >
                {/* Header Preview */}
                <div className="mb-8 flex items-center justify-between rounded-lg bg-muted p-4 gap-2">
                  <div className="flex items-center gap-4">
                    {form.watch("logoUrl") ? (
                      <img
                        src={form.watch("logoUrl")}
                        alt="Logo"
                        className="h-8 w-auto"
                      />
                    ) : (
                      <div className="flex h-8 items-center justify-center rounded bg-[hsl(var(--preview-primary))] px-4 font-bold text-[hsl(var(--preview-primary-fg))] gap-4">
                        {form.watch("companyName") || "Brand"}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Menu
                    </Button>
                    <Button size="sm">Sign In</Button>
                  </div>
                </div>

                {/* Hero Section Preview */}
                <div className="mb-8 text-center">
                  <h2 className="mb-4 text-2xl font-bold text-[hsl(var(--preview-primary))]">
                    Welcome to {form.watch("companyName") || "Your Brand"}
                  </h2>
                  <p className="text-muted-foreground">
                    Experience our services with your custom branding
                  </p>
                </div>

                {/* Buttons Preview */}
                <div className="mb-8 flex flex-wrap justify-center gap-4">
                  <Button className="bg-[hsl(var(--preview-primary))] text-[hsl(var(--preview-primary-fg))]">
                    Primary Button
                  </Button>
                  <Button
                    variant="secondary"
                    className="bg-[hsl(var(--preview-secondary))] text-[hsl(var(--preview-secondary-fg))]"
                  >
                    Secondary Button
                  </Button>
                  <Button className="bg-[hsl(var(--preview-accent))] text-[hsl(var(--preview-accent-fg))]">
                    CTA Button
                  </Button>
                </div>

                {/* Cards Preview */}
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[hsl(var(--preview-primary)/0.2)] p-4"
                    >
                      <div className="mb-2 h-2 w-12 rounded bg-[hsl(var(--preview-primary))]" />
                      <h3 className="mb-1 font-semibold text-xl font-semibold tracking-tight">
                        Feature {i}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Description of feature {i}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Badge Preview */}
                <div className="mt-8 flex justify-center gap-2">
                  <Badge className="bg-[hsl(var(--preview-primary))]">
                    New
                  </Badge>
                  <Badge className="bg-[hsl(var(--preview-accent))]">
                    Popular
                  </Badge>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <Button onClick={() => setPreviewMode(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Apply to Platform
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
