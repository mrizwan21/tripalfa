import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tripalfa/ui-components/ui/card"
import { Button } from "@tripalfa/ui-components/ui/button"
import { Badge } from "@tripalfa/ui-components/ui/badge"
import { Plus, Trash2, Edit, MapPin, FileText, Users } from "lucide-react"
import { Label } from "@tripalfa/ui-components/ui/label"
import { Input } from "@tripalfa/ui-components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@tripalfa/ui-components/ui/form"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@tripalfa/ui-components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@tripalfa/ui-components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@tripalfa/ui-components/ui/tabs"
import { Textarea } from "@tripalfa/ui-components/ui/textarea"
import { Checkbox } from "@tripalfa/ui-components/ui/checkbox"
import api from "@/shared/lib/api"
import { toast } from "sonner"

type B2BCompanyProfile = {
  id: string
  name: string
  email: string
  phone: string
  website: string
  industry: string
  registrationNumber: string
  taxNumber: string
  logo?: string
  coverImage?: string
  creditLimit?: number
  status?: "active" | "suspended"
}

type Branch = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  state: string
  country: string
  zipCode: string
  address: string
  status: "active" | "inactive"
}

type B2BUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  department: string
  designation: string
  status: "active" | "inactive" | "suspended"
  joinDate: string
}

type MediaItem = {
  id: string
  name: string
  type: "logo" | "header" | "footer" | "banner"
  url: string
  uploadedAt: string
  size: string
  status: "pending" | "approved" | "rejected"
}

const profileSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  website: z.string().url("Valid URL is required").optional().or(z.literal("")),
  industry: z.string().min(2, "Industry is required"),
  registrationNumber: z.string().min(5, "Registration number is required"),
  taxNumber: z.string().min(5, "Tax number is required"),
  creditLimit: z.number().min(0, "Credit limit must be 0 or greater").optional(),
})

const branchSchema = z.object({
  name: z.string().min(2, "Branch name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  zipCode: z.string().min(3, "ZIP code is required"),
  address: z.string().min(5, "Address is required"),
})

const userSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  role: z.string().min(2, "Role is required"),
  department: z.string().optional(),
  designation: z.string().optional(),
})

const headersFooterSchema = z.object({
  headerTitle: z.string().min(2, "Header title is required"),
  headerSubtitle: z.string().optional(),
  headerContent: z.string().optional(),
  footerText: z.string().min(2, "Footer text is required"),
  footerLinks: z.string().optional(),
  copyrightText: z.string().optional(),
})

const roleOptions = ["Admin", "Manager", "Supervisor", "Agent", "Viewer"] as const
const departmentOptions = ["Sales", "Operations", "Finance", "Support", "Marketing"] as const
const designationOptions = ["Director", "Manager", "Executive", "Supervisor", "Staff"] as const

interface B2BCompanyOnboardingProps {
  companyId?: string
  onSubmit?: () => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export default function B2BCompanyOnboarding({
  companyId,
  onSubmit,
  onCancel,
  isSubmitting
}: B2BCompanyOnboardingProps = {}) {
  const [internalCompanyId, setInternalCompanyId] = useState<string | null>(companyId || null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [users, setUsers] = useState<B2BUser[]>([])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [profile, setProfile] = useState<B2BCompanyProfile | null>(null)
  const [openBranchDialog, setOpenBranchDialog] = useState(false)
  const [openUserDialog, setOpenUserDialog] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [editingUser, setEditingUser] = useState<B2BUser | null>(null)
  const [loading, setLoading] = useState(false)

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      industry: "",
      registrationNumber: "",
      taxNumber: "",
      creditLimit: 0,
    },
  })

  const branchForm = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      address: "",
    },
  })

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      designation: "",
    },
  })

  const headersFooterForm = useForm<z.infer<typeof headersFooterSchema>>({
    resolver: zodResolver(headersFooterSchema),
    defaultValues: {
      headerTitle: "",
      headerSubtitle: "",
      headerContent: "",
      footerText: "",
      footerLinks: "",
      copyrightText: "",
    },
  })

  // Load B2B company data (assuming companyId is passed via URL or props)
  useEffect(() => {
    // This would be set from parent component or route params
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get("companyId")
    if (id) {
      setInternalCompanyId(id)
    }
  }, [])

  useEffect(() => {
    if (!internalCompanyId) return

    const loadCompanyData = async () => {
      try {
        setLoading(true)
        const [profileRes, branchesRes, usersRes, mediaRes, headersRes] = await Promise.all([
          api.get(`/companies/${internalCompanyId}`),
          api.get(`/companies/${internalCompanyId}/branches`),
          api.get(`/companies/${internalCompanyId}/users`),
          api.get(`/branding/media?companyId=${internalCompanyId}`),
          api.get(`/branding/headers?companyId=${internalCompanyId}`),
        ])

        const profileData = profileRes.data?.data || profileRes.data
        if (profileData) {
          setProfile(profileData)
          profileForm.reset(profileData)
        }

        const branchesData = Array.isArray(branchesRes.data) ? branchesRes.data : branchesRes.data?.data || []
        setBranches(branchesData)

        const usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || []
        setUsers(usersData)

        const mediaData = Array.isArray(mediaRes.data) ? mediaRes.data : mediaRes.data?.data || []
        setMediaItems(mediaData)

        const headersData = headersRes.data?.data || headersRes.data
        if (headersData) {
          headersFooterForm.reset(headersData)
        }
      } catch (error) {
        console.error("Failed to load company data", error)
        toast.error("Failed to load company data")
      } finally {
        setLoading(false)
      }
    }

    loadCompanyData()
  }, [internalCompanyId])

  const handleSaveProfile = profileForm.handleSubmit(async (values) => {
    try {
      if (internalCompanyId) {
        await api.put(`/companies/${internalCompanyId}`, values)
        toast.success("Company profile updated successfully")
      } else {
        const res = await api.post("/companies", values)
        const newId = res.data?.data?.id || res.data?.id
        setInternalCompanyId(newId)
        toast.success("Company created successfully")
      }
      profileForm.reset()
    } catch (error) {
      console.error("Failed to save profile", error)
      toast.error("Failed to save company profile")
    }
  })

  const handleAddBranch = branchForm.handleSubmit(async (values) => {
    if (!internalCompanyId) {
      toast.error("Create or select a company first")
      return
    }

    try {
      const endpoint = editingBranch
        ? `/companies/${internalCompanyId}/branches/${editingBranch.id}`
        : `/companies/${internalCompanyId}/branches`

      if (editingBranch) {
        await api.put(endpoint, values)
        toast.success("Branch updated successfully")
      } else {
        await api.post(endpoint, values)
        toast.success("Branch added successfully")
      }

      // Reload branches
      const res = await api.get(`/companies/${internalCompanyId}/branches`)
      const branchesData = Array.isArray(res.data) ? res.data : res.data?.data || []
      setBranches(branchesData)

      branchForm.reset()
      setOpenBranchDialog(false)
      setEditingBranch(null)
    } catch (error) {
      console.error("Failed to add/update branch", error)
      toast.error(editingBranch ? "Failed to update branch" : "Failed to add branch")
    }
  })

  const handleDeleteBranch = async (branchId: string) => {
    if (!internalCompanyId) return
    try {
      await api.delete(`/companies/${internalCompanyId}/branches/${branchId}`)
      setBranches(branches.filter((b) => b.id !== branchId))
      toast.success("Branch deleted successfully")
    } catch (error) {
      console.error("Failed to delete branch", error)
      toast.error("Failed to delete branch")
    }
  }

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch)
    branchForm.reset(branch)
    setOpenBranchDialog(true)
  }

  const handleCloseBranchDialog = () => {
    setOpenBranchDialog(false)
    setEditingBranch(null)
    branchForm.reset()
  }

  const handleAddUser = userForm.handleSubmit(async (values) => {
    if (!internalCompanyId) {
      toast.error("Create or select a company first")
      return
    }

    try {
      const endpoint = editingUser
        ? `/companies/${internalCompanyId}/users/${editingUser.id}`
        : `/companies/${internalCompanyId}/users`

      if (editingUser) {
        await api.put(endpoint, values)
        toast.success("User updated successfully")
      } else {
        await api.post(endpoint, values)
        toast.success("User added successfully")
      }

      // Reload users
      const res = await api.get(`/companies/${internalCompanyId}/users`)
      const usersData = Array.isArray(res.data) ? res.data : res.data?.data || []
      setUsers(usersData)

      userForm.reset()
      setOpenUserDialog(false)
      setEditingUser(null)
    } catch (error) {
      console.error("Failed to add/update user", error)
      toast.error(editingUser ? "Failed to update user" : "Failed to add user")
    }
  })

  const handleDeleteUser = async (userId: string) => {
    if (!internalCompanyId) return
    try {
      await api.delete(`/companies/${internalCompanyId}/users/${userId}`)
      setUsers(users.filter((u) => u.id !== userId))
      toast.success("User deleted successfully")
    } catch (error) {
      console.error("Failed to delete user", error)
      toast.error("Failed to delete user")
    }
  }

  const handleEditUser = (user: B2BUser) => {
    setEditingUser(user)
    userForm.reset(user)
    setOpenUserDialog(true)
  }

  const handleCloseUserDialog = () => {
    setOpenUserDialog(false)
    setEditingUser(null)
    userForm.reset()
  }

  const handleSaveHeadersFooter = headersFooterForm.handleSubmit(async (values) => {
    if (!internalCompanyId) {
      toast.error("Create or select a company first")
      return
    }

    try {
      await api.post(`/branding/headers?companyId=${internalCompanyId}`, values)
      toast.success("Headers & footer updated successfully")
    } catch (error) {
      console.error("Failed to save headers/footer", error)
      toast.error("Failed to save headers & footer")
    }
  })

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!internalCompanyId) {
      toast.error("Create or select a company first")
      return
    }

    const files = e.target.files
    if (!files || !files[0]) return

    try {
      const formData = new FormData()
      formData.append("file", files[0])
      formData.append("companyId", internalCompanyId)

      const res = await api.post("/branding/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const newMedia = res.data?.data || res.data
      setMediaItems([...mediaItems, newMedia])
      toast.success("Media uploaded successfully")
    } catch (error) {
      console.error("Failed to upload media", error)
      toast.error("Failed to upload media")
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await api.delete(`/branding/media/${mediaId}`)
      setMediaItems(mediaItems.filter((m) => m.id !== mediaId))
      toast.success("Media deleted successfully")
    } catch (error) {
      console.error("Failed to delete media", error)
      toast.error("Failed to delete media")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">B2B Company Settings</h1>
          <p className="mt-2 text-slate-600">Configure B2B company profile, branches, users, and branding</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="headers">Headers & Footer</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* Company Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>B2B Company Profile</CardTitle>
              <CardDescription>Manage your B2B company's basic information and registration details</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-500">Loading profile data...</div>
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
                        name="creditLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Limit (USD)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="0"
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
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
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting ? "Saving..." : "Save Profile"}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Branches</CardTitle>
                <CardDescription>Add and manage company branch locations</CardDescription>
              </div>
              <Dialog open={openBranchDialog} onOpenChange={setOpenBranchDialog}>
                <DialogTrigger asChild>
                  <Button disabled={!internalCompanyId}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Branch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingBranch ? "Edit Branch" : "Add New Branch"}</DialogTitle>
                    <DialogDescription>
                      {editingBranch ? "Update branch information" : "Enter the details for a new branch location"}
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
                          {branchForm.formState.isSubmitting ? "Saving..." : editingBranch ? "Update Branch" : "Add Branch"}
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
                  <MapPin className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-500">No branches added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {branches.map((branch) => (
                    <div key={branch.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{branch.name}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {branch.address}, {branch.city}, {branch.state} {branch.zipCode}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">{branch.email} · {branch.phone}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={branch.status === "active" ? "default" : "secondary"}>
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

        {/* Manage Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>Add and manage company users and their roles</CardDescription>
              </div>
              <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
                <DialogTrigger asChild>
                  <Button disabled={!internalCompanyId}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                      {editingUser ? "Update user information" : "Enter the details for a new user"}
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...userForm}>
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={userForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={userForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="john@example.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
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
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={userForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roleOptions.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {departmentOptions.map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                      {dept}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={userForm.control}
                        name="designation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Designation</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select designation" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {designationOptions.map((desig) => (
                                  <SelectItem key={desig} value={desig}>
                                    {desig}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={handleCloseUserDialog}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={userForm.formState.isSubmitting}>
                          {userForm.formState.isSubmitting ? "Saving..." : editingUser ? "Update User" : "Add User"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-500">No users added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{user.firstName} {user.lastName}</div>
                        <div className="mt-1 text-sm text-slate-600">{user.email}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {user.role} · {user.department} · {user.designation}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.status === "active" ? "default" : user.status === "inactive" ? "secondary" : "destructive"}>
                          {user.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
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
            <CardHeader>
              <CardTitle>Headers & Footer</CardTitle>
              <CardDescription>Customize headers and footer content for company branding</CardDescription>
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
                            <Input placeholder="e.g., Welcome to Our Company" {...field} />
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
                            <Textarea placeholder="e.g., Contact us at support@example.com" {...field} />
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
                            <Input placeholder="e.g., Privacy Policy, Terms of Service, Contact" {...field} />
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
                            <Input placeholder="e.g., © 2024 Your Company. All rights reserved." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={headersFooterForm.formState.isSubmitting || !internalCompanyId}>
                      {headersFooterForm.formState.isSubmitting ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Media Library</CardTitle>
                <CardDescription>Upload and manage media files for your company</CardDescription>
              </div>
              <label htmlFor="media-upload">
                <Button type="button" disabled={!internalCompanyId}>
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
                  <FileText className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-500">No media files uploaded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">File Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Size</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Uploaded</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mediaItems.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-3">{item.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{item.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{item.size}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {new Date(item.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                item.status === "approved"
                                  ? "default"
                                  : item.status === "pending"
                                    ? "secondary"
                                    : "destructive"
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
  )
}
