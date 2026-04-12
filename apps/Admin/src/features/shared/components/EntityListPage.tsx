import { useEffect, useState, useCallback } from 'react';
import { Button } from '@tripalfa/ui-components/ui/button';
import { Input } from '@tripalfa/ui-components/ui/input';
import { Label } from '@tripalfa/ui-components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tripalfa/ui-components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@tripalfa/ui-components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@tripalfa/ui-components/ui/alert-dialog';
import { Badge } from '@tripalfa/ui-components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@tripalfa/ui-components/ui/card';
import { Trash2, Edit, Plus, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@tripalfa/shared-utils/date-utils';
import api from '@/shared/lib/api';

export interface EntityListPageProps<T> {
  title: string;
  description: string;
  entityName: string;
  entityNamePlural: string;
  endpoint: string;
  columns: {
    key: string;
    header: string;
    className?: string;
    render?: (entity: T) => React.ReactNode;
  }[];
  onAdd: (values?: any) => Promise<void>;
  onEdit: (entity: T, values?: any) => Promise<void>;
  onDelete: (id: string) => void;
  FormDialog: React.ComponentType<{
    entityId?: string;
    onSubmit: () => Promise<void>;
    isSubmitting: boolean;
    onCancel: () => void;
  }>;
  isFormDialogOpen: boolean;
  setIsFormDialogOpen: (open: boolean) => void;
  selectedEntity: T | null;
  setSelectedEntity: (entity: T | null) => void;
  isSubmitting: boolean;
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  searchPlaceholder?: string;
  transformData?: (data: any[]) => T[];
}

export function EntityListPage<T extends { id: string; status?: any; createdAt: string }>({
  title,
  description,
  entityName,
  entityNamePlural,
  endpoint,
  columns,
  onAdd,
  onEdit,
  onDelete,
  FormDialog,
  isFormDialogOpen,
  setIsFormDialogOpen,
  selectedEntity,
  setSelectedEntity,
  isSubmitting,
  deleteId,
  setDeleteId,
  searchPlaceholder = `Search by name, email, or website...`,
  transformData,
}: EntityListPageProps<T>) {
  const [entities, setEntities] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const handleFormSubmit = async (values?: any) => {
    if (selectedEntity) {
      await onEdit(selectedEntity, values);
    } else {
      await onAdd(values);
    }
  };

  const loadEntities = useCallback(
    async (page = 1, search = '') => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(search && { search }),
        });

        const res = await api.get(`${endpoint}?${params.toString()}`);
        const data = res.data?.data || res.data;

        let payload: any[] = [];
        if (Array.isArray(data)) {
          payload = data;
        } else if (data?.[entityNamePlural.toLowerCase()]) {
          payload = data[entityNamePlural.toLowerCase()];
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }

        const transformed = transformData ? transformData(payload) : payload;
        setEntities(transformed);
      } catch (error) {
        console.error(`Failed to load ${entityNamePlural.toLowerCase()}`, error);
        toast.error(`Failed to load ${entityNamePlural.toLowerCase()}`);
        setEntities([]);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, entityNamePlural, transformData]
  );

  useEffect(() => {
    loadEntities(currentPage, searchTerm);
  }, [currentPage, searchTerm, loadEntities]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`${endpoint}/${deleteId}`);
      toast.success(`${entityName} deleted successfully`);
      setDeleteId(null);
      loadEntities(currentPage, searchTerm);
    } catch (error) {
      console.error(`Failed to delete ${entityName.toLowerCase()}`, error);
      toast.error(`Failed to delete ${entityName.toLowerCase()}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button onClick={onAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add {entityName}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 gap-4">
              <Label htmlFor="search" className="mb-2 text-sm font-medium">
                Search {entityNamePlural}
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>
            {entityNamePlural} ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">
                Loading {entityNamePlural.toLowerCase()}...
              </span>
            </div>
          ) : entities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No {entityNamePlural.toLowerCase()} found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    {columns.map(col => (
                      <TableHead key={col.key} className={col.className}>
                        {col.header}
                      </TableHead>
                    ))}
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entities.map(entity => (
                    <TableRow key={entity.id} className="hover:bg-muted/40">
                      {columns.map(col => (
                        <TableCell key={col.key}>
                          {col.render
                            ? col.render(entity)
                            : (entity as any)[col.key]?.toString() || '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(entity)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          title={`Edit ${entityName.toLowerCase()}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(entity.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title={`Delete ${entityName.toLowerCase()}`}
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

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t gap-2">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEntity ? `Edit ${entityName}` : `Add New ${entityName}`}
            </DialogTitle>
            <DialogDescription>
              {selectedEntity
                ? `Update ${entityName.toLowerCase()} profile and configuration`
                : `Create a new ${entityName.toLowerCase()} with complete information`}
            </DialogDescription>
          </DialogHeader>
          <FormDialog
            entityId={selectedEntity?.id}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setIsFormDialogOpen(false);
              setSelectedEntity(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={open => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete {entityName}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this {entityName.toLowerCase()}? This action cannot be
            undone.
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
