import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Eye,
  File,
  FileText,
  Image,
  Archive,
  Link as LinkIcon,
  Clock,
  User,
  Lock,
} from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Badge } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/optics';
import { cn } from '@tripalfa/shared-utils/utils';

interface Attachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'UPLOADED' | 'FAILED';
  accessLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  relatedTo?: {
    type: 'BOOKING' | 'CONTACT' | 'COMPANY' | 'OPPORTUNITY';
    id: string;
    name: string;
  };
  tags?: string[];
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  downloadCount?: number;
  expiresAt?: string;
  securityScan?: {
    status: 'PENDING' | 'CLEAN' | 'QUARANTINED';
    message?: string;
  };
}

export default function AttachmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | string>('ALL');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<'ALL' | Attachment['accessLevel']>(
    'ALL'
  );
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  const {
    data: attachments,
    isLoading,
    refetch,
  } = useQuery<Attachment[]>({
    queryKey: ['attachments', searchTerm, selectedType, selectedAccessLevel],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (selectedAccessLevel !== 'ALL') params.append('accessLevel', selectedAccessLevel);
      const response = await api.get(`/crm/attachments?${params}`);
      return response.data;
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/crm/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (e: any) => {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/attachments/${id}`);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const downloadAttachmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.get(`/crm/attachments/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data, id) => {
      const attachment = attachments?.find(a => a.id === id);
      if (attachment) {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.filename;
        link.click();
      }
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('word') || mimeType.includes('document'))
      return <FileText className="w-4 h-4" />;
    if (mimeType.includes('sheet') || mimeType.includes('csv'))
      return <Archive className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getAccessLevelStatus = (
    level: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      PUBLIC: 'info' as const,
      INTERNAL: 'warning' as const,
      CONFIDENTIAL: 'primary' as const,
    };
    return statusMap[level as keyof typeof statusMap] || 'default';
  };

  const getSecurityStatusStatus = (
    status: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      PENDING: 'warning' as const,
      CLEAN: 'success' as const,
      QUARANTINED: 'primary' as const,
    };
    return statusMap[status as keyof typeof statusMap] || 'default';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const fileTypes = ['ALL', 'PDF', 'Images', 'Documents', 'Spreadsheets', 'Other'];

  const totalSize = attachments?.reduce((sum, a) => sum + a.fileSize, 0) || 0;
  const totalFiles = attachments?.length || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Documents & Files</h1>
          <p className="text-caption mt-1">Manage attachments, KYC documents, and file storage</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
          <Plus size={18} />
          Upload File
        </Button>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Files</p>
              <p className="text-2xl font-bold mt-2">{totalFiles}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold mt-2">{formatFileSize(totalSize)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Remaining Quota</p>
              <p className="text-2xl font-bold mt-2">
                {formatFileSize(10 * 1024 * 1024 * 1024 - totalSize)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-3 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search files by name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">File Type</label>
              <div className="flex flex-wrap gap-2">
                {fileTypes.map(type => (
                  <Badge
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Access Level</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(['ALL', 'PUBLIC', 'INTERNAL', 'CONFIDENTIAL'] as const).map(level => (
                  <Badge
                    key={level}
                    variant={selectedAccessLevel === level ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedAccessLevel(level)}
                  >
                    {level === 'ALL' ? 'All Levels' : level}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading files...</div>
      ) : attachments && attachments.length === 0 ? (
        <Card className="text-center py-12">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No files found</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {attachments?.map(attachment => (
            <Card key={attachment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-muted-foreground mt-1">
                      {getFileIcon(attachment.mimeType)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{attachment.filename}</h3>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.fileSize)}
                        </span>
                        {attachment.securityScan && (
                          <StatusBadge
                            status={getSecurityStatusStatus(attachment.securityScan.status)}
                            label={attachment.securityScan.status}
                            size="sm"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                        <User className="w-3 h-3" />
                        <span>{attachment.uploadedBy.name}</span>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(attachment.uploadedAt).toLocaleDateString()}</span>
                        {attachment.downloadCount !== undefined && (
                          <>
                            <Download className="w-3 h-3" />
                            <span>{attachment.downloadCount} downloads</span>
                          </>
                        )}
                      </div>

                      {attachment.relatedTo && (
                        <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded mt-2 w-fit">
                          Related to: {attachment.relatedTo.name}
                        </div>
                      )}

                      {attachment.tags && attachment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {attachment.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge
                      status={getAccessLevelStatus(attachment.accessLevel)}
                      label={attachment.accessLevel}
                      size="sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAttachment(attachment)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAttachmentMutation.mutate(attachment.id)}
                      disabled={downloadAttachmentMutation.isPending}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Upload documents, images, or other files</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop files here or click to browse
              </p>
              <input
                id="file-input"
                name="fileInput"
                type="file"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                Select File
              </Button>
            </div>

            {selectedFile && (
              <div className="bg-muted p-3 rounded text-sm">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}

            {uploadProgress > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedFile) {
                  uploadAttachmentMutation.mutate(selectedFile);
                }
              }}
              disabled={!selectedFile || uploadAttachmentMutation.isPending}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Detail Modal */}
      {selectedAttachment && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedAttachment.filename}</span>
              <Button variant="ghost" onClick={() => setSelectedAttachment(null)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">File Size</label>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedAttachment.fileSize)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">File Type</label>
                <p className="text-sm text-muted-foreground">{selectedAttachment.mimeType}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Access Level</label>
                <StatusBadge
                  status={getAccessLevelStatus(selectedAttachment.accessLevel)}
                  label={selectedAttachment.accessLevel}
                  size="sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Uploaded</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedAttachment.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => downloadAttachmentMutation.mutate(selectedAttachment.id)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedAttachment(null)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
