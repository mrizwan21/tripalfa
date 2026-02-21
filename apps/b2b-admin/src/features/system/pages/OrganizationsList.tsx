import { useEffect, useState } from "react"
import { Button } from "@tripalfa/ui-components/ui/button"
import { Input } from "@tripalfa/ui-components/ui/input"
import { Label } from "@tripalfa/ui-components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tripalfa/ui-components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@tripalfa/ui-components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@tripalfa/ui-components/ui/alert-dialog"
import { Badge } from "@tripalfa/ui-components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@tripalfa/ui-components/ui/card"
import { Trash2, Edit, Plus, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/shared/lib/api"
import OrganizationOnboarding from "./OrganizationOnboarding"

interface Organization {
  id: string
  name: string
  email: string
  phone: string
  website?: string
  industry?: string
  status: "active" | "inactive" | "pending"
  branchesCount: number
  usersCount: number
  createdAt: string
  updatedAt?: string
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function OrganizationsList() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  })

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Load organizations
  const loadOrganizations = async (page = 1, search = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      })

      const res = await api.get(`/organization?${params.toString()}`)
      const data = res.data?.data || res.data

      if (Array.isArray(data)) {
        setOrganizations(data)
      } else if (data?.organizations) {
        setOrganizations(data.organizations)
        if (data.pagination) {
          setPagination(data.pagination)
        }
      }
    } catch (error) {
      console.error("Failed to load organizations", error)
      toast.error("Failed to load organizations")
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations(currentPage, searchTerm)
  }, [currentPage, searchTerm])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleAddOrganization = () => {
    setSelectedOrganization(null)
    setIsFormDialogOpen(true)
  }

  const handleEditOrganization = (organization: Organization) => {
    setSelectedOrganization(organization)
    setIsFormDialogOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      setIsSubmitting(true)
      toast.success(selectedOrganization ? "Organization updated successfully" : "Organization created successfully")
      setIsFormDialogOpen(false)
      setSelectedOrganization(null)
      loadOrganizations(currentPage, searchTerm)
    } catch (error) {
      console.error("Failed to save organization", error)
      toast.error("Failed to save organization")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (organizationId: string) => {
    setDeleteId(organizationId)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    try {
      await api.delete(`/organization/${deleteId}`)
      toast.success("Organization deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeleteId(null)
      loadOrganizations(currentPage, searchTerm)
    } catch (error) {
      console.error("Failed to delete organization", error)
      toast.error("Failed to delete organization")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations Management</h1>
          <p className="text-slate-500">Manage organization profiles, branches, and branding</p>
        </div>
        <Button
          onClick={handleAddOrganization}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2">
                Search Organizations
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or website..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Organizations ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
              <span className="text-slate-500">Loading organizations...</span>
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No organizations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[180px]">Name</TableHead>
                    <TableHead className="w-[160px]">Email</TableHead>
                    <TableHead className="w-[140px]">Phone</TableHead>
                    <TableHead className="w-[140px]">Industry</TableHead>
                    <TableHead className="w-[100px]">Branches</TableHead>
                    <TableHead className="w-[80px]">Users</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[140px]">Created On</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{org.email}</TableCell>
                      <TableCell>{org.phone}</TableCell>
                      <TableCell>
                        {org.industry ? (
                          <Badge variant="outline">{org.industry}</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{org.branchesCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{org.usersCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(org.status)}>
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(org.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditOrganization(org)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          title="Edit organization"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(org.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Delete organization"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Organization Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOrganization ? "Edit Organization" : "Add New Organization"}
            </DialogTitle>
            <DialogDescription>
              {selectedOrganization
                ? "Update organization profile, branches, branding, and media"
                : "Create a new organization with complete profile information"}
            </DialogDescription>
          </DialogHeader>

          <OrganizationOnboarding
            organizationId={selectedOrganization?.id}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setIsFormDialogOpen(false)
              setSelectedOrganization(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Organization</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this organization? This action cannot be undone and will remove all associated branches, users, and records.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
