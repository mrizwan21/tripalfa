import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Plane, MapPin, Calendar, FileText, Edit2, Trash2 } from 'lucide-react';
import { VisaDetail } from './types';
import { VisaDialog } from './dialogs/VisaDialog';

interface Props {
    visas: VisaDetail[];
    onUpdate: (data: VisaDetail[]) => void;
}

export function ProfileVisaManager({ visas, onUpdate }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingVisa, setEditingVisa] = useState<VisaDetail | undefined>(undefined);

    const handleAdd = () => {
        setEditingVisa(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (visa: VisaDetail) => {
        setEditingVisa(visa);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this visa?')) {
            const newVisas = visas.filter(v => v.id !== id);
            onUpdate(newVisas);
        }
    };

    const handleSave = (data: Partial<VisaDetail>) => {
        let newVisas = [...visas];

        if (editingVisa) {
            newVisas = newVisas.map(v => v.id === editingVisa.id ? { ...v, ...data } as VisaDetail : v);
        } else {
            const newVisa = {
                id: `v-${Date.now()}`,
                country: data.country || '',
                visaNo: data.visaNo || '',
                type: data.type || '',
                dateOfIssue: data.dateOfIssue || '',
                dateOfExpiry: data.dateOfExpiry || '',
                remarks: data.remarks || '',
            } as VisaDetail;
            newVisas.push(newVisa);
        }
        onUpdate(newVisas);
        setEditingVisa(undefined);
    };

    return (
        <>
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between p-8">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Plane className="h-6 w-6 text-emerald-600" />
                            Visas & Permits
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Active visas and international travel permits</p>
                    </div>
                    <Button onClick={handleAdd} className="rounded-xl bg-gray-900 hover:bg-primary font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Visa
                    </Button>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {visas.map((visa) => (
                            <Card key={visa.id} className="border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow p-6 bg-gray-50/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                                            <MapPin className="h-6 w-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-gray-900">{visa.country}</p>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{visa.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-black text-gray-400 mr-2">#{visa.visaNo}</p>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm" onClick={() => handleEdit(visa)}>
                                                <Edit2 className="h-4 w-4 text-gray-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(visa.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Issued
                                        </p>
                                        <p className="text-sm font-bold text-gray-900">{new Date(visa.dateOfIssue).toLocaleDateString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Expiry
                                        </p>
                                        <p className="text-sm font-bold text-gray-900">{new Date(visa.dateOfExpiry).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {visa.remarks && (
                                    <div className="mt-4 p-3 bg-white rounded-xl flex items-start gap-2">
                                        <FileText className="h-3.5 w-3.5 text-gray-400 mt-1" />
                                        <p className="text-xs text-gray-500 italic">{visa.remarks}</p>
                                    </div>
                                )}
                            </Card>
                        ))}
                        {visas.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <Plane className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold">No visas recorded</p>
                                <Button variant="ghost" onClick={handleAdd} className="mt-4 text-emerald-600 font-bold">Add New Entry</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <VisaDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingVisa}
                onSave={handleSave}
            />
        </>
    );
}
