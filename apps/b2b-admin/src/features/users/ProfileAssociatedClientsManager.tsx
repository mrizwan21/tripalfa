import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Link2, UserPlus, Mail, ShieldCheck } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { AssociatedClient } from './types';

interface Props {
    clients: AssociatedClient[];
    onAssociate: () => void;
}

export function ProfileAssociatedClientsManager({ clients, onAssociate }: Props) {
    return (
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between p-8">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Link2 className="h-6 w-6 text-blue-500" />
                        Linked & Associated Profiles
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Connect this profile with other registered travelers</p>
                </div>
                <Button onClick={onAssociate} className="rounded-xl bg-gray-900 hover:bg-primary font-bold">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Link Profile
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="font-black text-[10px] text-gray-400 uppercase tracking-widest pl-8 py-4">Traveler Name</TableHead>
                            <TableHead className="font-black text-[10px] text-gray-400 uppercase tracking-widest py-4">Relation</TableHead>
                            <TableHead className="font-black text-[10px] text-gray-400 uppercase tracking-widest py-4">Status</TableHead>
                            <TableHead className="font-black text-[10px] text-gray-400 uppercase tracking-widest py-4">Linked On</TableHead>
                            <TableHead className="font-black text-[10px] text-gray-400 uppercase tracking-widest pr-8 py-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="pl-8 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xs">
                                            {client.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{client.name}</p>
                                            <p className="text-xs text-gray-400">{client.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-lg">
                                        {client.relation}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge className={client.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-none' : 'bg-gray-50 text-gray-400 border-none'}>
                                        {client.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                    {new Date(client.associatedDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="pr-8 py-4 text-right">
                                    <Button variant="ghost" className="text-rose-500 font-bold text-xs hover:bg-rose-50">
                                        De-associate
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {clients.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <Link2 className="h-12 w-12 mx-auto text-gray-200 mb-4" />
                                    <p className="text-gray-400 font-bold">No associated profiles linked to this traveler</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
