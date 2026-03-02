import { useEffect, useState } from "react";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Label } from "@tripalfa/ui-components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tripalfa/ui-components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@tripalfa/ui-components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@tripalfa/ui-components/ui/alert-dialog";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@tripalfa/ui-components/ui/card";
import { Trash2, Edit, Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/shared/lib/api";
import B2BCompanyOnboarding from "./B2BCompanyOnboarding";

interface B2BCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  website?: string;
  creditLimit: number;
  status: "active" | "inactive" | "suspended";
  branchesCount: number;
  usersCount: number;
  createdAt: string;
  updatedAt?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function B2BCompaniesList() {
  const [companies, setCompanies] = useState<B2BCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<B2BCompany | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load companies
  const loadCompanies = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      });

      const res = await api.get(`/companies?${params.toString()}`);
      const data = res.data?.data || res.data;

      if (Array.isArray(data)) {
        setCompanies(data);
      } else if (data?.companies) {
        setCompanies(data.companies);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to load B2B companies", error);
      toast.error("Failed to load B2B companies");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setIsFormDialogOpen(true);
  };

  const handleEditCompany = (company: B2BCompany) => {
    setSelectedCompany(company);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      setIsSubmitting(true);
      toast.success(
        selectedCompany
          ? "B2B company updated successfully"
          : "B2B company created successfully",
      );
      setIsFormDialogOpen(false);
      setSelectedCompany(null);
      loadCompanies(currentPage, searchTerm);
    } catch (error) {
      console.error("Failed to save B2B company", error);
      toast.error("Failed to save B2B company");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (companyId: string) => {
    setDeleteId(companyId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/companies/${deleteId}`);
      toast.success("B2B company deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
      loadCompanies(currentPage, searchTerm);
    } catch (error) {
      console.error("Failed to delete B2B company", error);
      toast.error("Failed to delete B2B company");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400";
      case "suspended":
        return "bg-destructive/10 text-destructive";
      case "inactive":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">B2B Companies Management</h1>
          <p className="text-muted-foreground">
            Manage B2B partner companies, users, and credit limits
          </p>
        </div>
        <Button
          onClick={handleAddCompany}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add B2B Company
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 gap-4">
              <Label htmlFor="search" className="mb-2 text-sm font-medium">
                Search B2B Companies
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by company name, email, or website..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B2B Companies Table */}
      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>B2B Companies ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">
                Loading B2B companies...
              </span>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No B2B companies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[160px]">Company Name</TableHead>
                    <TableHead className="w-[160px]">Email</TableHead>
                    <TableHead className="w-[140px]">Phone</TableHead>
                    <TableHead className="w-[130px]">Credit Limit</TableHead>
                    <TableHead className="w-[100px]">Branches</TableHead>
                    <TableHead className="w-[80px]">Users</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[140px]">Created On</TableHead>
                    <TableHead className="w-[120px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">
                        {company.name}
                      </TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>{company.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatCurrency(company.creditLimit)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {company.branchesCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{company.usersCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(company.status)}>
                          {company.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(company.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCompany(company)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          title="Edit B2B company"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(company.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete B2B company"
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
            <div className="flex items-center justify-between mt-4 pt-4 border-t gap-2">
              <div className="text-sm text-muted-foreground">
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

      {/* Add/Edit B2B Company Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? "Edit B2B Company" : "Add New B2B Company"}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? "Update company profile, branches, users, branding, and media"
                : "Create a new B2B company with complete profile information"}
            </DialogDescription>
          </DialogHeader>

          <B2BCompanyOnboarding
            companyId={selectedCompany?.id}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setIsFormDialogOpen(false);
              setSelectedCompany(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete B2B Company</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this B2B company? This action cannot
            be undone and will remove all associated branches, users, and
            records.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
