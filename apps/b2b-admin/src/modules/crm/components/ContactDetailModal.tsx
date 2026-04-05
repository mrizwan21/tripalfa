import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/optics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/optics';
import { Button } from '@/components/optics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/optics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/optics';
import { Badge } from '@/components/optics';
import { Textarea } from '@/components/optics';
import { Mail, Phone, MapPin, Calendar, DollarSign, Ticket, MessageSquare, LinkIcon, Trash2 } from '@tripalfa/ui-components/icons';

interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: string;
  totalBookings: number;
  totalSpent: number;
  bookingsCount: number;
  openTicketsCount: number;
  lastActivity: string;
  source?: string;
  phone?: string;
  location?: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
}

interface ContactDetailModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactDetailModal({ contact, isOpen, onClose }: ContactDetailModalProps) {
  const [note, setNote] = React.useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityItem[]>({
    queryKey: ['contact-activities', contact?.id],
    enabled: !!contact,
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contact?.id}/activities`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const response = await fetch(`/api/contacts/${contact?.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteText }),
      });
      if (!response.ok) throw new Error('Failed to add note');
      return response.json();
    },
    onSuccess: () => {
      setNote('');
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/contacts/${contact?.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contact');
      return response.json();
    },
    onSuccess: () => {
      setShowDeleteConfirm(false);
      onClose();
    },
  });

  if (!contact) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">{contact.firstName} {contact.lastName}</DialogTitle>
                <DialogDescription>{contact.email}</DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Customer Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="capitalize">{contact.tier}</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Last Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {new Date(contact.lastActivity).toLocaleDateString()}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar size={16} />
                      Bookings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">{contact.bookingsCount}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign size={16} />
                      Total Spent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold text-green-600">
                    ${contact.totalSpent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p>{contact.email}</p>
                    </div>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p>{contact.phone}</p>
                      </div>
                    </div>
                  )}
                  {contact.location && (
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p>{contact.location}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {contact.openTicketsCount > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-orange-900">
                      <Ticket size={16} />
                      Open Support Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold text-lg text-orange-600">{contact.openTicketsCount}</p>
                    <p className="text-xs text-orange-700 mt-1">Requires attention</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities">
              {activitiesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading activities...</div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map(activity => (
                    <Card key={activity.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No activities found</div>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Add a note</label>
                <Textarea
                  placeholder="Add internal notes about this contact..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="min-h-24"
                />
                <Button
                  onClick={() => addNoteMutation.mutate(note)}
                  disabled={!note.trim() || addNoteMutation.isPending}
                  className="w-full"
                >
                  {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contact.firstName} {contact.lastName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteContactMutation.mutate()}
              disabled={deleteContactMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteContactMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
