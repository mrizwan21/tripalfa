import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Download, Trash2, Plus, File, Image as ImageIcon, Shield } from 'lucide-react';
import { UserDocument } from './types';
import { DocumentUploadDialog } from './dialogs/DocumentUploadDialog';

interface Props {
    documents: UserDocument[];
    onUpdate: (data: UserDocument[]) => void;
}

export function ProfileDocumentVault({ documents, onUpdate }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return <ImageIcon className="h-6 w-6 text-blue-500" />;
        if (type.includes('pdf')) return <FileText className="h-6 w-6 text-rose-500" />;
        return <File className="h-6 w-6 text-gray-500" />;
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            const newDocs = documents.filter(d => d.id !== id);
            onUpdate(newDocs);
        }
    };

    const handleUpload = (data: Partial<UserDocument>) => {
        const newDoc = {
            id: `doc-${Date.now()}`,
            title: data.title || 'Untitled',
            fileType: data.fileType || 'application/pdf',
            fileUrl: data.fileUrl || '#',
            uploadDate: data.uploadDate || new Date().toISOString()
        } as UserDocument;

        onUpdate([...documents, newDoc]);
        setIsDialogOpen(false);
    };

    return (
        <>
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between p-8">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="h-6 w-6 text-blue-600" />
                            Document Vault
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Securely store ID proofs, tickets, and travel insurance</p>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl bg-gray-900 hover:bg-primary font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        Upload File
                    </Button>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {documents.map((doc) => (
                            <div key={doc.id} className="group relative border border-gray-100 rounded-3xl p-6 bg-white hover:shadow-xl transition-all duration-300">
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        {getFileIcon(doc.fileType)}
                                    </div>
                                    <p className="font-bold text-gray-900 line-clamp-1 h-6">{doc.title}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                </div>

                                <div className="flex gap-2 mt-6">
                                    <Button variant="ghost" size="icon" className="flex-1 h-9 rounded-xl bg-gray-50 hover:bg-gray-100">
                                        <Download className="h-4 w-4 text-gray-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-gray-50 hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(doc.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {documents.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                                <FileText className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-bold">No documents stored in this profile</p>
                                <p className="text-sm text-gray-400 mt-1">Add scans of passports or IDs for faster booking</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <DocumentUploadDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleUpload}
            />
        </>
    );
}
