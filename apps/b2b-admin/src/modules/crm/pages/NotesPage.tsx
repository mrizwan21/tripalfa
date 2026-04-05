import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  MessageCircle,
  User,
  Clock,
  Lock,
} from '@tripalfa/ui-components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Badge } from '@/components/optics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/optics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components';
import { cn } from '@tripalfa/shared-utils/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'INTERNAL' | 'SHARED' | 'CONFIDENTIAL';
  relatedTo?: {
    type: 'BOOKING' | 'CONTACT' | 'COMPANY' | 'OPPORTUNITY';
    id: string;
    name: string;
  };
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  updatedAt: string;
  comments?: {
    id: string;
    content: string;
    createdBy: {
      id: string;
      name: string;
      avatar?: string;
    };
    createdAt: string;
  }[];
}

export default function NotesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | Note['type']>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    type: 'INTERNAL' as const,
  });
  const [newComment, setNewComment] = useState('');

  const { data: notes, isLoading, refetch } = useQuery<Note[]>({
    queryKey: ['notes', searchTerm, selectedType, showArchived],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'ALL') params.append('type', selectedType);
      params.append('archived', showArchived.toString());
      const response = await api.get(`/crm/notes?${params}`);
      return response.data;
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: typeof newNote) => {
      const response = await api.post('/crm/notes', data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      setNewNote({ title: '', content: '', type: 'INTERNAL' });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...data }: Note) => {
      const response = await api.put(`/crm/notes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setSelectedNote(null);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/notes/${id}`);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
      const response = await api.post(`/crm/notes/${noteId}/comments`, {
        content,
      });
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setNewComment('');
    },
  });

  const pinnedNotes = notes?.filter((n) => n.isPinned && !n.isArchived) || [];
  const regularNotes = notes?.filter((n) => !n.isPinned) || [];

  const getTypeStatusForBadge = (type: string): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const typeMap = {
      INTERNAL: 'primary' as const,
      SHARED: 'success' as const,
      CONFIDENTIAL: 'warning' as const,
    };
    return typeMap[type as keyof typeof typeMap] || 'default';
  };

  const NoteCard = ({ note }: { note: Note }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedNote(note)}
    >
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{note.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {note.content}
              </p>
            </div>
            {note.isPinned && (
              <span className="text-orange-500">📌</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <StatusBadge status={getTypeStatusForBadge(note.type)} label={note.type} size="sm" />
            <span className="text-xs text-muted-foreground">
              {new Date(note.createdAt).toLocaleDateString()}
            </span>
          </div>

          {note.relatedTo && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Related to: {note.relatedTo.name}
            </div>
          )}

          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground border-t">
            <User className="w-3 h-3" />
            <span>{note.createdBy.name}</span>
            {note.comments && note.comments.length > 0 && (
              <>
                <MessageCircle className="w-3 h-3 ml-auto" />
                <span>{note.comments.length}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Notes</h1>
          <p className="text-caption mt-1">
            Internal notes, comments, and collaboration
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus size={18} />
          New Note
        </Button>
      </div>

      {/* Filters */}
      <div className="filter-bar card-compact p-4">
        <div className="space-y-4">
          <div className="flex gap-3 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search notes by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['ALL', 'INTERNAL', 'SHARED', 'CONFIDENTIAL'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={selectedType === type ? 'filter-chip-active' : 'filter-chip'}
              >
                {type === 'ALL' ? 'All Notes' : type}
              </button>
            ))}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={showArchived ? 'filter-chip-active' : 'filter-chip'}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <h2 className="text-subsection-title mb-3">📌 Pinned Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Notes */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading notes...
        </div>
      ) : regularNotes.length === 0 ? (
        <Card className="text-center py-12">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No notes found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {/* Note Detail Panel */}
      {selectedNote && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>{selectedNote.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <User className="w-3 h-3" />
                  {selectedNote.createdBy.name}
                  <Clock className="w-3 h-3 ml-2" />
                  {new Date(selectedNote.createdAt).toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateNoteMutation.mutate({
                      ...selectedNote,
                      isPinned: !selectedNote.isPinned,
                    })
                  }
                >
                  {selectedNote.isPinned ? 'Unpin' : 'Pin'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteNoteMutation.mutate(selectedNote.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <StatusBadge status={getTypeStatusForBadge(selectedNote.type)} label={selectedNote.type} size="sm" />
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{selectedNote.content}</p>
            </div>

            {/* Comments Section */}
            {selectedNote.comments && selectedNote.comments.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-semibold text-sm">Comments</h4>
                {selectedNote.comments.map((comment) => (
                  <div key={comment.id} className="bg-muted/50 p-3 rounded text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{comment.createdBy.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p>{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment */}
            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium">Add Comment</label>
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <Button
                size="sm"
                onClick={() =>
                  addCommentMutation.mutate({
                    noteId: selectedNote.id,
                    content: newComment,
                  })
                }
                disabled={!newComment || addCommentMutation.isPending}
              >
                Post Comment
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedNote(null)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Note Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Add an internal note for your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Note title"
                value={newNote.title}
                onChange={(e) =>
                  setNewNote((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <textarea
                placeholder="Note content..."
                value={newNote.content}
                onChange={(e) =>
                  setNewNote((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm min-h-32"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                value={newNote.type}
                onChange={(e) =>
                  setNewNote((prev) => ({
                    ...prev,
                    type: e.target.value as typeof newNote.type,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="INTERNAL">Internal</option>
                <option value="SHARED">Shared</option>
                <option value="CONFIDENTIAL">Confidential</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createNoteMutation.mutate(newNote)}
              disabled={!newNote.title || !newNote.content || createNoteMutation.isPending}
            >
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
