import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import { Star, Folder, Plus, Trash2, Edit2, FolderPlus, Tag } from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Badge } from '@/components/optics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components/optics';
import { cn } from '@tripalfa/shared-utils/utils';

interface FavoriteItem {
  id: string;
  type: 'CONTACT' | 'COMPANY' | 'BOOKING' | 'KYC_APPLICANT';
  entityId: string;
  name: string;
  description?: string;
  folderId?: string;
  tags: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lastViewed: string;
}

interface FavoriteFolder {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  createdAt: string;
}

export function FavoritesPage() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newItemData, setNewItemData] = useState({
    name: '',
    type: 'CONTACT' as const,
    priority: 'MEDIUM' as const,
  });

  const {
    data: folders,
    isLoading: foldersLoading,
    refetch: refetchFolders,
  } = useQuery<FavoriteFolder[]>({
    queryKey: ['favorite-folders'],
    queryFn: async () => {
      const response = await api.get('/crm/favorites/folders');
      return response.data;
    },
  });

  const {
    data: favoriteItems,
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = useQuery<FavoriteItem[]>({
    queryKey: ['favorite-items', selectedFolder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFolder) params.append('folderId', selectedFolder);
      const response = await api.get(`/crm/favorites?${params}`);
      return response.data;
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/crm/favorites/folders', { name });
      return response.data;
    },
    onSuccess: () => {
      refetchFolders();
      setIsNewFolderOpen(false);
      setNewFolderName('');
    },
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async (data: typeof newItemData & { folderId?: string }) => {
      const response = await api.post('/crm/favorites', data);
      return response.data;
    },
    onSuccess: () => {
      refetchItems();
      setIsNewItemOpen(false);
      setNewItemData({ name: '', type: 'CONTACT', priority: 'MEDIUM' });
    },
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/favorites/${id}`);
    },
    onSuccess: () => refetchItems(),
  });

  const getPriorityForBadge = (
    priority?: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const priorityMap = {
      LOW: 'success' as const,
      MEDIUM: 'info' as const,
      HIGH: 'warning' as const,
      URGENT: 'warning' as const,
    };
    return priorityMap[priority as keyof typeof priorityMap] || 'default';
  };

  const kycApplicants = favoriteItems?.filter(item => item.type === 'KYC_APPLICANT') || [];

  return (
    <div className="space-y-5">
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Favorites & Collections</h1>
          <p className="text-caption mt-1">
            Organize and quick-access important contacts and opportunities
          </p>
        </div>
        <Button onClick={() => setIsNewFolderOpen(true)} className="gap-2">
          <FolderPlus size={18} />
          New Collection
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer ${selectedFolder === null ? 'border-blue-500 bg-blue-50' : ''}`}
          onClick={() => setSelectedFolder(null)}
        >
          <CardContent className="pt-6">
            <Star className="w-6 h-6 mb-2" />
            <p className="font-medium">All Favorites</p>
            <p className="text-sm text-muted-foreground mt-1">{favoriteItems?.length || 0} items</p>
          </CardContent>
        </Card>

        {folders?.map(folder => (
          <Card
            key={folder.id}
            className={`cursor-pointer ${selectedFolder === folder.id ? 'border-blue-500 bg-blue-50' : ''}`}
            onClick={() => setSelectedFolder(folder.id)}
          >
            <CardContent className="pt-6">
              <Folder className="w-6 h-6 mb-2" />
              <p className="font-medium truncate">{folder.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{folder.itemCount} items</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {kycApplicants.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-orange-900">KYC Applicants Under Review</p>
                <p className="text-sm text-orange-800 mt-1">
                  {kycApplicants.length} applicants favorited for urgent review
                </p>
              </div>
              <span className="text-2xl font-bold text-orange-900">{kycApplicants.length}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {selectedFolder
            ? `Favorites in: ${folders?.find(f => f.id === selectedFolder)?.name}`
            : 'All Favorites'}
        </h2>
        <Button onClick={() => setIsNewItemOpen(true)} variant="outline">
          <Plus size={18} className="mr-2" />
          Add Item
        </Button>
      </div>

      {itemsLoading ? (
        <div className="text-center py-8">Loading favorites...</div>
      ) : favoriteItems?.length === 0 ? (
        <Card className="text-center">
          <CardContent className="pt-12 pb-12">
            <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No favorites in this collection yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favoriteItems?.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <h3 className="font-semibold">{item.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.type}</p>
                    {item.description && (
                      <p className="text-sm mt-2 text-gray-600">{item.description}</p>
                    )}
                    <div className="flex gap-2 flex-wrap mt-3">
                      {item.priority && (
                        <StatusBadge
                          status={getPriorityForBadge(item.priority)}
                          label={item.priority}
                          size="sm"
                        />
                      )}
                      {item.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteFavoriteMutation.mutate(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Collection Name</label>
            <Input
              placeholder="e.g., VIP Clients, KYC Reviews, Q1 Opportunities"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createFolderMutation.mutate(newFolderName)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewItemOpen} onOpenChange={setIsNewItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Favorites</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Item Name</label>
              <Input
                value={newItemData.name}
                onChange={e => setNewItemData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                value={newItemData.type}
                onChange={e => setNewItemData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="CONTACT">Contact</option>
                <option value="COMPANY">Company</option>
                <option value="BOOKING">Booking</option>
                <option value="KYC_APPLICANT">KYC Applicant</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                value={newItemData.priority}
                onChange={e =>
                  setNewItemData(prev => ({ ...prev, priority: e.target.value as any }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewItemOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                addFavoriteMutation.mutate({
                  ...newItemData,
                  folderId: selectedFolder || undefined,
                })
              }
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
