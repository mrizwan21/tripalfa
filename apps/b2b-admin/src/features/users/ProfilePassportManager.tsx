import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Globe, Calendar, User, Shield, Edit2, Trash2 } from 'lucide-react';
import { PassportDetail } from './types';
import { PassportDialog } from './dialogs/PassportDialog';

interface Props {
    passports: PassportDetail[];
    onUpdate: (data: PassportDetail[]) => void;
}

export function ProfilePassportManager({ passports, onUpdate }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPassport, setEditingPassport] = useState<PassportDetail | undefined>(undefined);

    const handleAdd = () => {
        setEditingPassport(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (passport: PassportDetail) => {
        setEditingPassport(passport);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this passport?')) {
            const newPassports = passports.filter(p => p.id !== id);
            onUpdate(newPassports);
        }
    };

    const handleSave = (data: Partial<PassportDetail>) => {
        let newPassports = [...passports];

        // Handle Primary Logic: if setting to primary, unset others
        if (data.isPrimary) {
            newPassports = newPassports.map(p => ({ ...p, isPrimary: false }));
        }

        if (editingPassport) {
            newPassports = newPassports.map(p => p.id === editingPassport.id ? { ...p, ...data } as PassportDetail : p);
        } else {
            const newPassport = {
                id: `p-${Date.now()}`,
                passportNo: data.passportNo || '',
                dob: data.dob || '',
                nationality: data.nationality || '',
                issuingCountry: data.issuingCountry || '',
                placeOfIssue: data.placeOfIssue || '',
                expiry: data.expiry || '',
                isPrimary: data.isPrimary || false,
                status: data.status || 'ACTIVE'
            } as PassportDetail;
            newPassports.push(newPassport);
        }
        onUpdate(newPassports);
        setEditingPassport(undefined);
    };

    return (
        <>
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between p-8">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Globe className="h-6 w-6 text-indigo-600" />
                            Travel Documents
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Manage multiple passports and nationality details</p>
                    </div>
                    <Button onClick={handleAdd} className="rounded-xl bg-gray-900 hover:bg-primary font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Passport
                    </Button>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {passports.map((passport) => (
                            <Card key={passport.id} className="border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow p-6 bg-gray-50/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                                            <Shield className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-gray-900">{passport.passportNo}</p>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{passport.nationality}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {passport.isPrimary && (
                                            <Badge className="bg-indigo-600 text-white border-none font-bold text-[10px]">PRIMARY</Badge>
                                        )}
                                        <Badge variant="outline" className={
                                            passport.status === 'ACTIVE' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                                                'border-rose-200 text-rose-700 bg-rose-50'
                                        }>
                                            {passport.status}
                                        </Badge>
                                        <div className="flex gap-1 ml-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm" onClick={() => handleEdit(passport)}>
                                                <Edit2 className="h-4 w-4 text-gray-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(passport.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Expiry Date
                                        </p>
                                        <p className="text-sm font-bold text-gray-900">{new Date(passport.expiry).toLocaleDateString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <User className="h-3 w-3" /> Place of Issue
                                        </p>
                                        <p className="text-sm font-bold text-gray-900">{passport.placeOfIssue}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {passports.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <Globe className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold">No passport details added yet</p>
                                <Button variant="ghost" onClick={handleAdd} className="mt-4 text-primary font-bold">Click here to add</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <PassportDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingPassport}
                onSave={handleSave}
            />
        </>
    );
}
