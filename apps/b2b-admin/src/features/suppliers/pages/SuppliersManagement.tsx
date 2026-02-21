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
import { Trash2, Edit, Plus, Search, Loader2, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"
import api from "@/shared/lib/api"
import SuppliersList from "./SuppliersList"

interface Supplier {
  id: string
  name: string
  email: string
  country: string
  businessType: string
  status: "active" | "inactive" | "pending"
  productsCount: number
  createdAt: string
  updatedAt?: string
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function SuppliersManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
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
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Load suppliers
  const loadSuppliers = async (page = 1, search = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      })

      const res = await api.get(`/admin/suppliers?${params.toString()}`)
      const data = res.data?.data || res.data

      if (Array.isArray(data)) {
        setSuppliers(data)
      } else if (data?.suppliers) {
        setSuppliers(data.suppliers)
        if (data.pagination) {
          setPagination(data.pagination)
        }
      }
    } catch (error) {
      console.error("Failed to load suppliers", error)
      toast.error("Failed to load suppliers")
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers(currentPage, searchTerm)
  }, [currentPage, searchTerm])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleAddSupplier = () => {
    setSelectedSupplier(null)
    setIsFormDialogOpen(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsFormDialogOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      setIsSubmitting(true)
      toast.success(selectedSupplier ? "Supplier updated successfully" : "Supplier created successfully")
      setIsFormDialogOpen(false)
      setSelectedSupplier(null)
      loadSuppliers(currentPage, searchTerm)
    } catch (error) {
      console.error("Failed to save supplier", error)
      toast.error("Failed to save supplier")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (supplierId: string) => {
    setDeleteId(supplierId)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    try {
      await api.delete(`/admin/suppliers/${deleteId}`)
      toast.success("Supplier deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeleteId(null)
      loadSuppliers(currentPage, searchTerm)
    } catch (error) {
      console.error("Failed to delete supplier", error)
      toast.error("Failed to delete supplier")
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
          <h1 className="text-3xl font-bold">Suppliers Management</h1>
          <p className="text-slate-500">Manage supplier profiles, products, and documentation</p>
        </div>
        <Button
          onClick={handleAddSupplier}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2">
                Search Suppliers
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or country..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Suppliers ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
              <span className="text-slate-500">Loading suppliers...</span>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No suppliers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[180px]">Name</TableHead>
                    <TableHead className="w-[180px]">Email</TableHead>
                    <TableHead className="w-[140px]">Country</TableHead>
                    <TableHead className="w-[140px]">Business Type</TableHead>
                    <TableHead className="w-[100px]">Products</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[140px]">Created On</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>{supplier.country}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{supplier.businessType}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{supplier.productsCount}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(supplier.status)}>
                          {supplier.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(supplier.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSupplier(supplier)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          title="Edit supplier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(supplier.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Delete supplier"
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

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
            <DialogDescription>
              {selectedSupplier
                ? "Update supplier profile, products, payments, documents, and API credentials"
                : "Create a new supplier with complete profile information"}
            </DialogDescription>
          </DialogHeader>

          <SuppliersList
            supplierId={selectedSupplier?.id}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setIsFormDialogOpen(false)
              setSelectedSupplier(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this supplier? This action cannot be undone and will remove all associated products, documents, and records.
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
