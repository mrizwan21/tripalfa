import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Search, 
  Globe, 
  Tag, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Shield,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useMarketingPermissions } from '@/hooks/useMarketingPermissions';
import PermissionGuard, { PermissionButton, PermissionStatus } from '@/components/PermissionGuard';

const seoSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(60, "Title must be less than 60 characters"),
  description: z.string().min(50, "Description must be at least 50 characters").max(160, "Description must be less than 160 characters"),
  keywords: z.string().min(5, "Keywords are required"),
  canonicalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  structuredData: z.string().optional(),
  openGraphTitle: z.string().optional(),
  openGraphDescription: z.string().optional(),
  openGraphImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  twitterCard: z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
  twitterSite: z.string().optional(),
  schemaOrgType: z.enum(['WebSite', 'Organization', 'LocalBusiness', 'Product', 'Article']).optional(),
});

type SEOFormValues = z.infer<typeof seoSchema>;

const SEOManagement: React.FC = () => {
  const { 
    canViewSEO, 
    canEditSEO, 
    canPublishSEO,
    isLoading: permissionsLoading 
  } = useMarketingPermissions();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [seoPreview, setSeoPreview] = useState({
    title: "Your Website Title",
    description: "Your website description here...",
    url: "https://yourwebsite.com"
  });

  const form = useForm<SEOFormValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      title: "TripAlfa - Your Travel Portal",
      description: "Book flights, hotels, and travel packages with the best prices and customer service.",
      keywords: "travel, flights, hotels, booking, TripAlfa",
      canonicalUrl: "",
      robotsIndex: true,
      robotsFollow: true,
      structuredData: "",
      openGraphTitle: "",
      openGraphDescription: "",
      openGraphImage: "",
      twitterCard: "summary",
      twitterSite: "@tripalfa",
      schemaOrgType: "WebSite"
    }
  });

  // Update preview when form values change
  useEffect(() => {
    const subscription = form.watch((data) => {
      setSeoPreview({
        title: data.title || seoPreview.title,
        description: data.description || seoPreview.description,
        url: data.canonicalUrl || seoPreview.url
      });
    });
    return () => subscription.unsubscribe();
  }, [form.watch, seoPreview]);

  const onSubmit = async (values: SEOFormValues) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("SEO settings saved successfully!", {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />
      });
    } catch (error) {
      toast.error("Failed to save SEO settings", {
        icon: <AlertCircle className="h-4 w-4 text-red-600" />
      });
    }
  };

  const handleResetDefaults = () => {
    form.reset({
      title: "TripAlfa - Your Travel Portal",
      description: "Book flights, hotels, and travel packages with the best prices and customer service.",
      keywords: "travel, flights, hotels, booking, TripAlfa",
      canonicalUrl: "",
      robotsIndex: true,
      robotsFollow: true,
      structuredData: "",
      openGraphTitle: "",
      openGraphDescription: "",
      openGraphImage: "",
      twitterCard: "summary",
      twitterSite: "@tripalfa",
      schemaOrgType: "WebSite"
    });
    toast.info("Reset to default values");
  };

  const getCharacterCount = (text: string, max: number) => {
    return `${text.length}/${max}`;
  };

  const getRobotsMeta = (index: boolean, follow: boolean) => {
    const parts: string[] = [];
    if (!index) parts.push('noindex');
    if (!follow) parts.push('nofollow');
    return parts.length > 0 ? parts.join(', ') : 'index, follow';
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading SEO settings...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="marketing:seo:seo_settings:view">
      <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">SEO Management</h2>
            <p className="text-gray-500 mt-2 font-medium">Optimize your website for search engines and social media.</p>
          </div>
          <div className="flex items-center gap-4">
            <PermissionStatus permission="marketing:seo:seo_settings:view" label="View Access" />
            <PermissionStatus permission="marketing:seo:seo_settings:update" label="Edit Access" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main SEO Settings */}
          <Card className="lg:col-span-2 border-none shadow-lg bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold">SEO Settings</CardTitle>
                  <CardDescription>Configure your website's search engine optimization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic SEO Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Page Title
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter page title..." 
                              {...field} 
                              className="h-12 bg-white"
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Recommended: 50-60 characters</span>
                            <span className={form.watch('title').length > 60 ? 'text-red-500' : 'text-gray-500'}>
                              {getCharacterCount(form.watch('title'), 60)}
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canonicalUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Canonical URL
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://yourwebsite.com" 
                              {...field} 
                              className="h-12 bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Meta Description
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter meta description..." 
                            {...field} 
                            className="min-h-[120px] bg-white"
                          />
                        </FormControl>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Recommended: 150-160 characters</span>
                          <span className={form.watch('description').length > 160 ? 'text-red-500' : 'text-gray-500'}>
                            {getCharacterCount(form.watch('description'), 160)}
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Keywords
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="travel, flights, hotels, booking..." 
                            {...field} 
                            className="h-12 bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Robots Settings */}
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="h-5 w-5 text-gray-600" />
                      <h3 className="font-bold text-gray-900">Robots Meta Settings</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="robotsIndex"
                        render={({ field }) => (
                          <FormItem className="flex flex-col space-y-3">
                            <FormLabel className="font-bold">Allow Indexing</FormLabel>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label>{field.value ? 'Yes' : 'No'}</Label>
                            </div>
                            <p className="text-xs text-gray-500">Should search engines index this page?</p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="robotsFollow"
                        render={({ field }) => (
                          <FormItem className="flex flex-col space-y-3">
                            <FormLabel className="font-bold">Allow Following</FormLabel>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label>{field.value ? 'Yes' : 'No'}</Label>
                            </div>
                            <p className="text-xs text-gray-500">Should search engines follow links on this page?</p>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Current robots meta:</p>
                      <p className="text-sm text-gray-600 font-mono">
                        {getRobotsMeta(form.watch('robotsIndex'), form.watch('robotsFollow'))}
                      </p>
                    </div>
                  </div>

                  {/* Open Graph Settings */}
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <h3 className="font-bold text-gray-900">Open Graph (Social Media)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="openGraphTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">OG Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Social media title..." 
                                {...field} 
                                className="h-12 bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="openGraphImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">OG Image URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://yourwebsite.com/image.jpg" 
                                {...field} 
                                className="h-12 bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="openGraphDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">OG Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Social media description..." 
                              {...field} 
                              className="min-h-[80px] bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Twitter Card Settings */}
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Eye className="h-5 w-5 text-blue-400" />
                      <h3 className="font-bold text-gray-900">Twitter Card</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="twitterCard"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Card Type</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="summary">Summary</option>
                                <option value="summary_large_image">Summary Large Image</option>
                                <option value="app">App</option>
                                <option value="player">Player</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="twitterSite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Twitter Site</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="@yourhandle" 
                                {...field} 
                                className="h-12 bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Schema.org Settings */}
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-bold text-gray-900">Schema.org Structured Data</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="schemaOrgType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Schema Type</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="WebSite">Website</option>
                                <option value="Organization">Organization</option>
                                <option value="LocalBusiness">Local Business</option>
                                <option value="Product">Product</option>
                                <option value="Article">Article</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="structuredData"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Custom JSON-LD</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder='{"@context":"https://schema.org","@type":"WebSite","name":"Your Site"}' 
                              {...field} 
                              className="min-h-[120px] font-mono bg-white"
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500 mt-1">Custom structured data in JSON-LD format</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                    <div className="flex gap-3">
                      <PermissionButton
                        permission="marketing:seo:seo_settings:update"
                        onClick={handleResetDefaults}
                        variant="outline"
                        className="border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Defaults
                      </PermissionButton>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                        variant="outline"
                        className="border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {isPreviewOpen ? 'Hide' : 'Show'} Preview
                      </Button>
                      
                      <PermissionButton
                        permission="marketing:seo:seo_settings:update"
                        type="submit"
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-6"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save SEO Settings
                      </PermissionButton>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 font-bold">Live Preview</CardTitle>
                  <CardDescription>How your page will appear in search results</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isPreviewOpen ? (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="font-bold text-blue-600 text-sm mb-1 truncate">{seoPreview.title}</h4>
                    <p className="text-gray-600 text-sm mb-1 truncate">{seoPreview.url}</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{seoPreview.description}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Meta Tags Preview:</p>
                      <div className="text-xs font-mono text-gray-500 space-y-1">
                      <div>{`<title>${seoPreview.title}</title>`}</div>
                      <div>{`<meta name="description" content="${seoPreview.description}">`}</div>
                      <div>{`<meta name="robots" content="${getRobotsMeta(form.watch("robotsIndex"), form.watch("robotsFollow"))}">`}</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">Open Graph Preview:</p>
                    <div className="text-xs font-mono text-blue-500 space-y-1">
                      <div>{`<meta property="og:title" content="${form.watch("openGraphTitle") || seoPreview.title}">`}</div>
                      <div>{`<meta property="og:description" content="${form.watch("openGraphDescription") || seoPreview.description}">`}</div>
                      {form.watch('openGraphImage') && (
                        <div>{`<meta property="og:image" content="${form.watch("openGraphImage")}">`}</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">SEO Score:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, (seoPreview.title.length / 60 + seoPreview.description.length / 160) * 50)}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {Math.round((seoPreview.title.length / 60 + seoPreview.description.length / 160) * 50)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Based on title and description optimization</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <EyeOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Enable preview to see how your SEO settings will appear in search results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SEO Tips */}
        <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-gray-900 font-bold">SEO Best Practices</CardTitle>
                <CardDescription>Follow these guidelines for optimal search engine performance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Title Optimization
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Keep titles under 60 characters</li>
                  <li>• Include primary keywords</li>
                  <li>• Make titles compelling and unique</li>
                  <li>• Use title case for better readability</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Description Optimization
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Keep descriptions 150-160 characters</li>
                  <li>• Include target keywords naturally</li>
                  <li>• Write compelling, action-oriented copy</li>
                  <li>• Each page should have unique description</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Technical SEO
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use canonical URLs to prevent duplicates</li>
                  <li>• Configure robots.txt appropriately</li>
                  <li>• Implement structured data</li>
                  <li>• Optimize for mobile devices</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default SEOManagement;