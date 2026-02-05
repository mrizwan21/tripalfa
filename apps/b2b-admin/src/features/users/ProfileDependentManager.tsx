import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Users, User, Heart, Mail, Calendar, Edit2, Trash2 } from 'lucide-react';
import { DependentDialog, DependentData } from './dialogs/DependentDialog';
import { Dependent } from './types';

interface Props {
    dependents: Dependent[];
    onUpdate: (data: Dependent[]) => void;
}

export function ProfileDependentManager({ dependents, onUpdate }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDependent, setEditingDependent] = useState<Dependent | undefined>(undefined);

    const handleAdd = () => {
        setEditingDependent(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (dep: Dependent) => {
        setEditingDependent(dep);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this dependent?')) {
            const newDependents = dependents.filter(d => d.id !== id);
            onUpdate(newDependents);
        }
    };

    const handleSave = (data: DependentData) => {
        let newDependents = [...dependents];

        if (editingDependent) {
            newDependents = newDependents.map(d => d.id === editingDependent.id ? { ...d, ...data } as Dependent : d);
        } else {
            const newDependent = {
                id: `dep-${Date.now()}`,
                ...data,
                status: 'ACTIVE',
            } as Dependent;
            newDependents.push(newDependent);
        }
        onUpdate(newDependents);
        setIsDialogOpen(false);
        setEditingDependent(undefined);
    };

    return (
        <>
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between p-8">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6 text-rose-500" />
                            Family & Dependents
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Manage family members and linked travelers</p>
                    </div>
                    <Button onClick={handleAdd} className="rounded-xl bg-gray-900 hover:bg-primary font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Dependent
                    </Button>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {dependents.map((dep) => (
                            <Card key={dep.id} className="border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow p-6 bg-gray-50/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center">
                                            <User className="h-6 w-6 text-rose-500" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-gray-900">{dep.firstName} {dep.lastName}</p>
                                            <div className="flex items-center gap-2">
                                                <Heart className="h-3 w-3 text-rose-400 fill-rose-400" />
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{dep.relation}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                                            {dep.status}
                                        </Badge>
                                        <div className="flex gap-1 ml-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm" onClick={() => handleEdit(dep)}>
                                                <Edit2 className="h-4 w-4 text-gray-400" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(dep.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-6 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600 font-medium">DOB: {new Date(dep.dob).toLocaleDateString()}</span>
                                    </div>
                                    {dep.email && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 font-medium">{dep.email}</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                        {dependents.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-bold">No dependents added</p>
                                <Button variant="ghost" onClick={handleAdd} className="mt-4 text-primary font-bold">Add Dependent</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <DependentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingDependent}
                onSave={handleSave}
            />
        </>
    );
}
