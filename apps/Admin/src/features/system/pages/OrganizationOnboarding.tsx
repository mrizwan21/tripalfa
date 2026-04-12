import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tripalfa/ui-components/ui/card';
import { Button } from '@tripalfa/ui-components/ui/button';
import { Badge } from '@tripalfa/ui-components/ui/badge';
import { Plus, Trash2, Edit, MapPin, FileText } from 'lucide-react';
import { Label } from '@tripalfa/ui-components/ui/label';
import { Input } from '@tripalfa/ui-components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@tripalfa/ui-components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@tripalfa/ui-components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tripalfa/ui-components/ui/tabs';
import { Textarea } from '@tripalfa/ui-components/ui/textarea';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

type CompanyProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  registrationNumber: string;
  taxNumber: string;
  logo?: string;
  coverImage?: string;
};

type Branch = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  address: string;
  status: 'active' | 'inactive';
};

type MediaItem = {
  id: string;
  name: string;
  type: 'logo' | 'header' | 'footer' | 'banner';
  url: string;
  uploadedAt: string;
  size: string;
  status: 'pending' | 'approved' | 'rejected';
};

const profileSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  website: z.string().url('Valid URL is required').optional().or(z.literal('')),
  industry: z.string().min(2, 'Industry is required'),
  registrationNumber: z.string().min(5, 'Registration number is required'),
  taxNumber: z.string().min(5, 'Tax number is required'),
});

const branchSchema = z.object({
  name: z.string().min(2, 'Branch name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  zipCode: z.string().min(3, 'ZIP code is required'),
  address: z.string().min(5, 'Address is required'),
});

const headersFooterSchema = z.object({
  headerTitle: z.string().min(2, 'Header title is required'),
  headerSubtitle: z.string().optional(),
  headerContent: z.string().optional(),
  footerText: z.string().min(2, 'Footer text is required'),
  footerLinks: z.string().optional(),
  copyrightText: z.string().optional(),
});

interface OrganizationOnboardingProps {
  entityId?: string;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function OrganizationOnboarding({
  entityId,
  onSubmit,
  onCancel,
  isSubmitting,
}: OrganizationOnboardingProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [openBranchDialog, setOpenBranchDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      website: '',
      industry: '',
      registrationNumber: '',
      taxNumber: '',
    },
  });

  const branchForm = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      address: '',
    },
  });

  const headersFooterForm = useForm<z.infer<typeof headersFooterSchema>>({
    resolver: zodResolver(headersFooterSchema),
    defaultValues: {
      headerTitle: '',
      headerSubtitle: '',
      headerContent: '',
      footerText: '',
      footerLinks: '',
      copyrightText: '',
    },
  });

  // Load organization data
  useEffect(() => {
    const loadOrganizationData = async () => {
      try {
        setLoading(true);
        const [profileRes, branchesRes, mediaRes, headersRes] = await Promise.all([
          api.get('/organization'),
          api.get('/branches'),
          api.get('/branding/media'),
          api.get('/branding/headers'),
        ]);

        const profileData = profileRes.data?.data || profileRes.data;
        if (profileData) {
          setProfile(profileData);
          profileForm.reset(profileData);
        }

        const branchesData = Array.isArray(branchesRes.data)
          ? branchesRes.data
          : branchesRes.data?.data || [];
        setBranches(branchesData);

        const mediaData = Array.isArray(mediaRes.data) ? mediaRes.data : mediaRes.data?.data || [];
        setMediaItems(mediaData);

        const headersData = headersRes.data?.data || headersRes.data;
        if (headersData) {
          headersFooterForm.reset(headersData);
        }
      } catch (error) {
        console.error('Failed to load organization data', error);
        toast.error('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    };

    loadOrganizationData();
  }, []);

  const handleSaveProfile = profileForm.handleSubmit(async values => {
    try {
      await api.post('/organization/profile', values);
      toast.success('Organization profile updated successfully');
      profileForm.reset();
    } catch (error) {
      console.error('Failed to save profile', error);
      toast.error('Failed to save organization profile');
    }
  });

  const handleAddBranch = branchForm.handleSubmit(async values => {
    try {
      const endpoint = editingBranch ? `/branches/${editingBranch.id}` : '/branches';

      if (editingBranch) {
        await api.put(endpoint, values);
        toast.success('Branch updated successfully');
      } else {
        await api.post(endpoint, values);
        toast.success('Branch added successfully');
      }

      // Reload branches
      const res = await api.get('/branches');
      const branchesData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setBranches(branchesData);

      branchForm.reset();
      setOpenBranchDialog(false);
      setEditingBranch(null);
    } catch (error) {
      console.error('Failed to add/update branch', error);
      toast.error(editingBranch ? 'Failed to update branch' : 'Failed to add branch');
    }
  });

  const handleDeleteBranch = async (branchId: string) => {
    try {
      await api.delete(`/branches/${branchId}`);
      setBranches(branches.filter(b => b.id !== branchId));
      toast.success('Branch deleted successfully');
    } catch (error) {
      console.error('Failed to delete branch', error);
      toast.error('Failed to delete branch');
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    branchForm.reset(branch);
    setOpenBranchDialog(true);
  };

  const handleCloseBranchDialog = () => {
    setOpenBranchDialog(false);
    setEditingBranch(null);
    branchForm.reset();
  };

  const handleSaveHeadersFooter = headersFooterForm.handleSubmit(async values => {
    try {
      await api.post('/branding/headers', values);
      toast.success('Headers & footer updated successfully');
    } catch (error) {
      console.error('Failed to save headers/footer', error);
      toast.error('Failed to save headers & footer');
    }
  });

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) return;

    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      const res = await api.post('/branding/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newMedia = res.data?.data || res.data;
      setMediaItems([...mediaItems, newMedia]);
      toast.success('Media uploaded successfully');
    } catch (error) {
      console.error('Failed to upload media', error);
      toast.error('Failed to upload media');
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await api.delete(`/branding/media/${mediaId}`);
      setMediaItems(mediaItems.filter(m => m.id !== mediaId));
      toast.success('Media deleted successfully');
    } catch (error) {
      console.error('Failed to delete media', error);
      toast.error('Failed to delete media');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Organization Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Configure your organization's profile, branches, and branding
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto gap-4">
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="branches">Manage Branches</TabsTrigger>
          <TabsTrigger value="headers">Headers & Footer</TabsTrigger>
          <TabsTrigger value="media">Download Media</TabsTrigger>
        </TabsList>

        {/* Company Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>
                Manage your organization's basic information and registration details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading profile data...
                </div>
              ) : (
                <Form {...profileForm}>
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="company@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Travel, Technology" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="registrationNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter registration number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="taxNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax/VAT Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter tax/VAT number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Branches Tab */}
        <TabsContent value="branches">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Manage Branches</CardTitle>
                <CardDescription>
                  Add and manage your organization's branch locations
                </CardDescription>
              </div>
              <Dialog open={openBranchDialog} onOpenChange={setOpenBranchDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Branch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
                    <DialogDescription>
                      {editingBranch
                        ? 'Update branch information'
                        : 'Enter the details for a new branch location'}
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...branchForm}>
                    <form onSubmit={handleAddBranch} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={branchForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Branch Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Dubai HQ" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={branchForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="branch@example.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={branchForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 000-0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={branchForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main Street" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={branchForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Dubai" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={branchForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Province</FormLabel>
                              <FormControl>
                                <Input placeholder="Dubai" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={branchForm.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="00000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={branchForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="UAE" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={handleCloseBranchDialog}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={branchForm.formState.isSubmitting}>
                          {branchForm.formState.isSubmitting
                            ? 'Saving...'
                            : editingBranch
                              ? 'Update Branch'
                              : 'Add Branch'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {branches.length === 0 ? (
                <div className="py-8 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No branches added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {branches.map(branch => (
                    <div
                      key={branch.id}
                      className="flex items-center justify-between rounded-lg border p-4 gap-2"
                    >
                      <div className="flex-1 gap-4">
                        <div className="font-semibold text-foreground">{branch.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {branch.address}, {branch.city}, {branch.state} {branch.zipCode}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {branch.email} · {branch.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                          {branch.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBranch(branch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBranch(branch.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Headers & Footer Tab */}
        <TabsContent value="headers">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Headers & Footer</CardTitle>
              <CardDescription>
                Customize headers and footer content for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...headersFooterForm}>
                <form onSubmit={handleSaveHeadersFooter} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Header Settings</h3>
                    <FormField
                      control={headersFooterForm.control}
                      name="headerTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Welcome to Our Organization" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headersFooterForm.control}
                      name="headerSubtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header Subtitle</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Your journey starts here" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headersFooterForm.control}
                      name="headerContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header Content</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional header content" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Footer Settings</h3>
                    <FormField
                      control={headersFooterForm.control}
                      name="footerText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Footer Text</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Contact us at support@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headersFooterForm.control}
                      name="footerLinks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Footer Links (comma-separated)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Privacy Policy, Terms of Service, Contact"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headersFooterForm.control}
                      name="copyrightText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Copyright Text</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., © 2024 Your Company. All rights reserved."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={headersFooterForm.formState.isSubmitting}>
                      {headersFooterForm.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Download Media Tab */}
        <TabsContent value="media">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Download Media</CardTitle>
                <CardDescription>
                  Upload and manage media files for your organization
                </CardDescription>
              </div>
              <label htmlFor="media-upload">
                <Button type="button">
                  <span>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Media
                  </span>
                </Button>
              </label>
              <input
                id="media-upload"
                type="file"
                className="hidden"
                onChange={handleUploadMedia}
                accept="image/*,application/pdf"
              />
            </CardHeader>
            <CardContent>
              {mediaItems.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No media files uploaded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                          File Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                          Size
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                          Uploaded
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mediaItems.map(item => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-3">{item.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{item.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{item.size}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(item.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                item.status === 'approved'
                                  ? 'default'
                                  : item.status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMedia(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
