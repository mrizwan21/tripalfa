import { useEffect, useState, useCallback } from "react"
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
import { Trash2, Edit, Plus, Search, Loader2, Users, UserPlus, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import api from "@/shared/lib/api"
import { UserForm } from "./UserForm"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@tripalfa/shared-utils/utils"


interface User {
  id: string
  name: string
  email: string
  mobileNumber: string
  nationality?: string
  dateOfBirth?: string
  role?: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt?: string
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Load users
  const loadUsers = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      })

      const res = await api.get(`/users?${params.toString()}`)
      const data = res.data?.data || res.data

      if (Array.isArray(data)) {
        setUsers(data)
      } else if (data?.users) {
        setUsers(data.users)
        if (data.pagination) {
          setPagination(data.pagination)
        }
      }
    } catch (error) {
      console.error("Failed to load users", error)
      toast.error("Failed to load users")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers(currentPage, searchTerm)
  }, [currentPage, searchTerm, loadUsers])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleAddUser = () => {
    setSelectedUser(null)
    setIsFormDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsFormDialogOpen(true)
  }

  const handleFormSubmit = async (values: any) => {
    try {
      setIsSubmitting(true)

      if (selectedUser) {
        // Update existing user
        await api.put(`/users/${selectedUser.id}/details`, values)
        toast.success("User updated successfully")
      } else {
        // Create new user
        await api.post("/users", values)
        toast.success("User created successfully")
      }

      setIsFormDialogOpen(false)
      setSelectedUser(null)
      loadUsers(currentPage, searchTerm)
    } catch (error) {
      console.error("Failed to save user", error)
      toast.error("Failed to save user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (userId: string) => {
    setDeleteId(userId)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    try {
      await api.delete(`/users/${deleteId}`)
      toast.success("User deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeleteId(null)
      loadUsers(currentPage, searchTerm)
    } catch (error) {
      console.error("Failed to delete user", error)
      toast.error("Failed to delete user")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-cyan-400" />
            Users Management
          </h1>
          <p className="text-cyan-400/60 mt-1">Manage system users and permissions</p>
        </div>
        <Button
          onClick={handleAddUser}
          className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg shadow-cyan-500/25"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search" className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">
                  Search Users
                </Label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400/50" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or mobile..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-11 bg-cyan-500/5 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-500/40"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  {pagination.total} users
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-cyan-500/10 bg-gradient-to-br from-[#111827]/80 to-[#0a0e17]/90 overflow-hidden">
          <CardHeader className="border-b border-cyan-500/10">
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-cyan-400" />
              Users List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-cyan-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No users found</p>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-cyan-500/10 hover:bg-transparent">
                      <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Name</TableHead>
                      <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Email</TableHead>
                      <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Mobile</TableHead>
                      <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                      <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Created On</TableHead>
                      <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {users.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-cyan-500/5 hover:bg-cyan-500/5 transition-colors"
                        >
                          <TableCell className="font-medium text-white">{user.name}</TableCell>
                          <TableCell className="text-slate-300">{user.email}</TableCell>
                          <TableCell className="text-slate-400">{user.mobileNumber || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium",
                                user.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                              )}
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400">{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(user.id)}
                                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-cyan-500/10">
                <div className="text-sm text-slate-400">
                  Page <span className="text-cyan-400 font-medium">{pagination.page}</span> of{" "}
                  <span className="text-cyan-400 font-medium">{pagination.totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-500/40 disabled:opacity-50 bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= pagination.totalPages}
                    className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-500/40 disabled:opacity-50 bg-transparent"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit User Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#111827] border-cyan-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {selectedUser ? <Edit className="h-5 w-5 text-cyan-400" /> : <UserPlus className="h-5 w-5 text-cyan-400" />}
              {selectedUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedUser
                ? "Update user details, permissions, documents, and password"
                : "Create a new user with complete profile information"}
            </DialogDescription>
          </DialogHeader>

          <UserForm
            userId={selectedUser?.id}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setIsFormDialogOpen(false)
              setSelectedUser(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#111827] border-rose-500/20 text-white">
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-400" />
            Delete User
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            Are you sure you want to delete this user? This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-500/30 text-slate-300 hover:bg-slate-500/10 hover:text-white bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white border-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
