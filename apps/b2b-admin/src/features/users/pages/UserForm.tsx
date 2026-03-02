import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Label } from "@tripalfa/ui-components/ui/label";
import { Checkbox } from "@tripalfa/ui-components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tripalfa/ui-components/ui/select";
import { DialogFooter } from "@tripalfa/ui-components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tripalfa/ui-components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@tripalfa/ui-components/ui/form";
import { Card, CardContent } from "@tripalfa/ui-components/ui/card";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/shared/lib/api";

const userDetailsSchema = z.object({
  // Personal Details
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required"),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),

  // Address
  address: z.string().optional(),
  postCode: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),

  // Passport Details
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  issuingCountry: z.string().optional(),

  // Residency Details
  residentNo: z.string().optional(),
  residentExpiry: z.string().optional(),
  residencyIssuingCountry: z.string().optional(),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(6, "Password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

interface UserFormProps {
  onSubmit: (values: any) => void;
  companies?: { id: string; name: string }[];
  branches?: { id: string; name: string }[];
  departments?: { id: string; name: string }[];
  designations?: { id: string; name: string }[];
  isSubmitting?: boolean;
  userId?: string;
  onCancel?: () => void;
}

interface Permission {
  id: string;
  name: string;
  enabled: boolean;
  actions: { name: string; enabled: boolean }[];
}

interface UserDocument {
  id: string;
  name: string;
  uploadedAt: string;
  type: string;
}

interface DropdownOptions {
  countries: { id: string; name: string }[];
  nationalities: { id: string; name: string }[];
  documentTypes: { id: string; name: string }[];
  states: { id: string; name: string; countryId?: string }[];
  cities: { id: string; name: string; stateId?: string }[];
}

export function UserForm({
  onSubmit,
  companies = [],
  branches = [],
  departments = [],
  designations = [],
  isSubmitting,
  userId,
  onCancel,
}: UserFormProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions>({
    countries: [],
    nationalities: [],
    documentTypes: [],
    states: [],
    cities: [],
  });
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const userDetailsForm = useForm<z.infer<typeof userDetailsSchema>>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: {
      name: "",
      email: "",
      mobileNumber: "",
      dateOfBirth: "",
      nationality: "",
      address: "",
      postCode: "",
      country: "",
      state: "",
      city: "",
      passportNumber: "",
      passportExpiry: "",
      issuingCountry: "",
      residentNo: "",
      residentExpiry: "",
      residencyIssuingCountry: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Load user data and dropdown options
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);

        // Load dropdown options in parallel
        const [
          countriesRes,
          nationalitiesRes,
          doctypesRes,
          statesRes,
          citiesRes,
          permsRes,
        ] = await Promise.all([
          api
            .get("/dropdown-options/countries")
            .catch(() => ({ data: { data: [] } })),
          api
            .get("/dropdown-options/nationalities")
            .catch(() => ({ data: { data: [] } })),
          api
            .get("/dropdown-options/document-types")
            .catch(() => ({ data: { data: [] } })),
          api
            .get("/dropdown-options/states")
            .catch(() => ({ data: { data: [] } })),
          api
            .get("/dropdown-options/cities")
            .catch(() => ({ data: { data: [] } })),
          api.get("/permissions").catch(() => ({ data: { data: [] } })),
        ]);

        const countries = countriesRes.data?.data || countriesRes.data || [];
        const nationalities =
          nationalitiesRes.data?.data || nationalitiesRes.data || [];
        const documentTypes = doctypesRes.data?.data || doctypesRes.data || [];
        const states = statesRes.data?.data || statesRes.data || [];
        const cities = citiesRes.data?.data || citiesRes.data || [];
        const permsData = permsRes.data?.data || permsRes.data || [];

        setDropdownOptions({
          countries: Array.isArray(countries) ? countries : [],
          nationalities: Array.isArray(nationalities) ? nationalities : [],
          documentTypes: Array.isArray(documentTypes) ? documentTypes : [],
          states: Array.isArray(states) ? states : [],
          cities: Array.isArray(cities) ? cities : [],
        });

        setPermissions(Array.isArray(permsData) ? permsData : []);

        // Load user-specific data if editing
        if (userId) {
          const [userRes, docsRes] = await Promise.all([
            api.get(`/users/${userId}`).catch(() => ({ data: {} })),
            api
              .get(`/users/${userId}/documents`)
              .catch(() => ({ data: { data: [] } })),
          ]);

          const userData = userRes.data?.data || userRes.data;
          if (userData) {
            userDetailsForm.reset(userData);
            if (userData.profileImage) {
              setProfileImage(userData.profileImage);
            }
            if (userData.country) {
              setSelectedCountry(userData.country);
            }
            if (userData.state) {
              setSelectedState(userData.state);
            }
          }

          const docsData = docsRes.data?.data || docsRes.data || [];
          setDocuments(Array.isArray(docsData) ? docsData : []);
        }
      } catch (error) {
        console.error("Failed to load data", error);
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [userId]);

  const handleUserDetailsSubmit = userDetailsForm.handleSubmit(
    async (values) => {
      try {
        await onSubmit(values);
        toast.success("User details saved successfully");
      } catch (error) {
        console.error("Failed to save user details", error);
        toast.error("Failed to save user details");
      }
    },
  );

  const handlePasswordSubmit = passwordForm.handleSubmit(async (values) => {
    if (!userId) {
      toast.error("User ID is required");
      return;
    }

    try {
      await api.put(`/users/${userId}/password`, {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password updated successfully");
      passwordForm.reset();
    } catch (error) {
      console.error("Failed to update password", error);
      toast.error("Failed to update password");
    }
  });

  const handlePermissionToggle = async (permissionId: string) => {
    try {
      const perm = permissions.find((p) => p.id === permissionId);
      if (perm) {
        const updatedPerms = permissions.map((p) =>
          p.id === permissionId ? { ...p, enabled: !p.enabled } : p,
        );
        setPermissions(updatedPerms);
        await api.put(`/users/${userId}/permissions/${permissionId}`, {
          enabled: !perm.enabled,
        });
      }
    } catch (error) {
      console.error("Failed to update permission", error);
      toast.error("Failed to update permission");
    }
  };

  const handleActionToggle = async (
    permissionId: string,
    actionName: string,
  ) => {
    try {
      const updatedPerms = permissions.map((p) =>
        p.id === permissionId
          ? {
              ...p,
              actions: p.actions.map((a) =>
                a.name === actionName ? { ...a, enabled: !a.enabled } : a,
              ),
            }
          : p,
      );
      setPermissions(updatedPerms);
      await api.put(
        `/users/${userId}/permissions/${permissionId}/actions/${actionName}`,
        {
          enabled: !permissions
            .find((p) => p.id === permissionId)
            ?.actions.find((a) => a.name === actionName)?.enabled,
        },
      );
    } catch (error) {
      console.error("Failed to update action permission", error);
      toast.error("Failed to update permission");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!userId) {
      toast.error("User ID is required");
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      try {
        const formData = new FormData();
        formData.append("document", files[0]);

        const res = await api.post(`/users/${userId}/documents`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newDoc = res.data?.data || res.data;
        setDocuments([...documents, newDoc]);
        toast.success("Document uploaded successfully");
      } catch (error) {
        console.error("Failed to upload document", error);
        toast.error("Failed to upload document");
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const formData = new FormData();
        formData.append("document", files[0]);

        const res = await api.post(`/users/${userId}/documents`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newDoc = res.data?.data || res.data;
        setDocuments([...documents, newDoc]);
        toast.success("Document uploaded successfully");
      } catch (error) {
        console.error("Failed to upload document", error);
        toast.error("Failed to upload document");
      }
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!userId) return;
    try {
      await api.delete(`/users/${userId}/documents/${docId}`);
      setDocuments(documents.filter((d) => d.id !== docId));
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Failed to delete document", error);
      toast.error("Failed to delete document");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const formData = new FormData();
        formData.append("image", files[0]);

        const res = await api.post(`/users/${userId}/image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const imageUrl = res.data?.data?.imageUrl || res.data?.imageUrl;
        setProfileImage(imageUrl);
        toast.success("Profile image updated successfully");
      } catch (error) {
        console.error("Failed to upload image", error);
        toast.error("Failed to upload image");
      }
    }
  };

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center py-8 gap-2">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">
              Loading form data...
            </p>
          </div>
        </div>
      )}

      {!loading && (
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-4">
            <TabsTrigger value="details">User Details</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="documents">User Document</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          {/* User Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Form {...userDetailsForm}>
              <form onSubmit={handleUserDetailsSubmit} className="space-y-6">
                {/* Personal Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold bg-muted px-3 py-2 rounded text-xl font-semibold tracking-tight">
                    Personal Details
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={userDetailsForm.control}
                      name="name"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userDetailsForm.control}
                      name="email"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="email@example.com"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={userDetailsForm.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userDetailsForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DOB</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Date of Birth"
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={userDetailsForm.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select nationality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dropdownOptions.nationalities.map((nation) => (
                              <SelectItem key={nation.id} value={nation.id}>
                                {nation.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold bg-muted px-3 py-2 rounded text-xl font-semibold tracking-tight">
                    Address
                  </h3>
                  <FormField
                    control={userDetailsForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={userDetailsForm.control}
                      name="postCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Postal code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userDetailsForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCountry(value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dropdownOptions.countries.map((country) => (
                                <SelectItem key={country.id} value={country.id}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={userDetailsForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedState(value);
                            }}
                            disabled={!selectedCountry}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dropdownOptions.states
                                .filter(
                                  (state) =>
                                    !selectedCountry ||
                                    state.countryId === selectedCountry,
                                )
                                .map((state) => (
                                  <SelectItem key={state.id} value={state.id}>
                                    {state.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userDetailsForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            disabled={!selectedState}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dropdownOptions.cities
                                .filter(
                                  (city) =>
                                    !selectedState ||
                                    city.stateId === selectedState,
                                )
                                .map((city) => (
                                  <SelectItem key={city.id} value={city.id}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Passport Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold bg-muted px-3 py-2 rounded text-xl font-semibold tracking-tight">
                    Passport Details
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={userDetailsForm.control}
                      name="passportNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passport Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Passport number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userDetailsForm.control}
                      name="passportExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passport Expiry</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Expiry date"
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={userDetailsForm.control}
                    name="issuingCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuing Country</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dropdownOptions.countries.map((country) => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Residency Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold bg-muted px-3 py-2 rounded text-xl font-semibold tracking-tight">
                    Residency Details
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={userDetailsForm.control}
                      name="residentNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resident No.</FormLabel>
                          <FormControl>
                            <Input placeholder="Resident number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userDetailsForm.control}
                      name="residentExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resident Expiry</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Expiry date"
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={userDetailsForm.control}
                    name="residencyIssuingCountry"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Residency Issuing Country</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dropdownOptions.countries.map((country) => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    type="submit"
                    className="bg-yellow-400 hover: text-black"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                  {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {permissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No permissions available
                    </p>
                  ) : (
                    permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={permission.enabled}
                              onCheckedChange={() =>
                                handlePermissionToggle(permission.id)
                              }
                            />
                            <Label className="font-medium text-sm">
                              {permission.name as any}
                            </Label>
                          </div>
                        </div>
                        {permission.actions &&
                          permission.actions.length > 0 && (
                            <div className="ml-6 space-y-2">
                              {permission.actions.map((action) => (
                                <div
                                  key={action.name}
                                  className="flex items-center gap-2"
                                >
                                  <Button
                                    size="sm"
                                    variant={
                                      action.enabled ? "default" : "outline"
                                    }
                                    onClick={() =>
                                      handleActionToggle(
                                        permission.id,
                                        action.name,
                                      )
                                    }
                                  >
                                    {action.enabled ? "✓" : ""} {action.name}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button className="bg-yellow-400 hover: text-black">Save</Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </TabsContent>

          {/* User Document Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Upload Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Label>{"Add Document" as any}</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                        dragActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-border"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="text-4xl mb-2">🖼️</div>
                      <p className="text-sm font-medium">
                        Drag & Drop or Upload Document
                      </p>
                      <p className="text-xs text-muted-foreground">
                        pdf, jpeg, png, and jpg
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileSelect}
                        accept=".pdf,.jpeg,.png,.jpg"
                      />
                    </div>

                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Document" />
                      </SelectTrigger>
                      <SelectContent>
                        {dropdownOptions.documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      className="w-full"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      Add Document
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Document List Section */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 text-xl font-semibold tracking-tight">
                    Document List
                  </h3>
                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No documents uploaded
                      </p>
                    ) : (
                      documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between bg-muted p-3 rounded gap-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-400 rounded flex items-center justify-center text-white gap-2">
                              📄
                            </div>
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded on {doc.uploadedAt}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button className="bg-yellow-400 hover: text-black">Save</Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Profile Image Section */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden gap-2">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">👤</span>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      id="image-upload"
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                    <Button
                      className="bg-yellow-400 hover: text-black"
                      onClick={() =>
                        document.getElementById("image-upload")?.click()
                      }
                    >
                      Edit Image
                    </Button>
                  </div>

                  {/* Password Change Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Change password
                    </h3>
                    <Form {...passwordForm}>
                      <form
                        onSubmit={handlePasswordSubmit}
                        className="space-y-4"
                      >
                        <FormField
                          control={passwordForm.control}
                          name="oldPassword"
                          render={({ field }: { field: any }) => (
                            <FormItem>
                              <FormLabel>Old Password</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter old password"
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }: { field: any }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter new password"
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }: { field: any }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Confirm password"
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full hover:">
                          Save
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
