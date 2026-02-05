import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Plane, Edit, Trash2, Crown, Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

export interface FrequentFlyer {
    id: string;
    airline: string;
    airlineCode: string;
    programName: string;
    memberNumber: string;
    tier: 'basic' | 'silver' | 'gold' | 'platinum' | 'diamond';
    points?: number;
}

export interface LoyaltyMembership {
    id: string;
    program: string;
    programType: 'hotel' | 'car_rental' | 'travel' | 'other';
    memberNumber: string;
    tier?: string;
    points?: number;
}

const frequentFlyerSchema = z.object({
    airline: z.string().min(2, "Airline name required"),
    airlineCode: z.string().min(2).max(3, "2-3 letter code"),
    programName: z.string().min(2, "Program name required"),
    memberNumber: z.string().min(5, "Member number required"),
    tier: z.enum(['basic', 'silver', 'gold', 'platinum', 'diamond']),
    points: z.number().optional(),
});

const loyaltySchema = z.object({
    program: z.string().min(2, "Program name required"),
    programType: z.enum(['hotel', 'car_rental', 'travel', 'other']),
    memberNumber: z.string().min(3, "Member number required"),
    tier: z.string().optional(),
    points: z.number().optional(),
});

interface FrequentFlyerManagerProps {
    frequentFlyers: FrequentFlyer[];
    loyaltyPrograms: LoyaltyMembership[];
    onAddFF: (ff: Omit<FrequentFlyer, 'id'>) => void;
    onEditFF: (id: string, ff: Partial<FrequentFlyer>) => void;
    onDeleteFF: (id: string) => void;
    onAddLoyalty: (loyalty: Omit<LoyaltyMembership, 'id'>) => void;
    onEditLoyalty: (id: string, loyalty: Partial<LoyaltyMembership>) => void;
    onDeleteLoyalty: (id: string) => void;
}

// Common airlines
const AIRLINES = [
    { name: 'Emirates', code: 'EK', program: 'Skywards' },
    { name: 'Qatar Airways', code: 'QR', program: 'Privilege Club' },
    { name: 'Etihad Airways', code: 'EY', program: 'Etihad Guest' },
    { name: 'British Airways', code: 'BA', program: 'Executive Club' },
    { name: 'United Airlines', code: 'UA', program: 'MileagePlus' },
    { name: 'Delta Air Lines', code: 'DL', program: 'SkyMiles' },
    { name: 'American Airlines', code: 'AA', program: 'AAdvantage' },
    { name: 'Lufthansa', code: 'LH', program: 'Miles & More' },
    { name: 'Singapore Airlines', code: 'SQ', program: 'KrisFlyer' },
    { name: 'Air France', code: 'AF', program: 'Flying Blue' },
];

export function FrequentFlyerManager({
    frequentFlyers,
    loyaltyPrograms,
    onAddFF,
    onEditFF,
    onDeleteFF,
    onAddLoyalty,
    onEditLoyalty,
    onDeleteLoyalty,
}: FrequentFlyerManagerProps) {
    const [ffModalOpen, setFfModalOpen] = React.useState(false);
    const [loyaltyModalOpen, setLoyaltyModalOpen] = React.useState(false);
    const [editingFF, setEditingFF] = React.useState<FrequentFlyer | null>(null);
    const [editingLoyalty, setEditingLoyalty] = React.useState<LoyaltyMembership | null>(null);

    const ffForm = useForm<z.infer<typeof frequentFlyerSchema>>({
        resolver: zodResolver(frequentFlyerSchema),
        defaultValues: { airline: '', airlineCode: '', programName: '', memberNumber: '', tier: 'basic' as const, points: 0 },
    });

    const loyaltyForm = useForm<z.infer<typeof loyaltySchema>>({
        resolver: zodResolver(loyaltySchema),
        defaultValues: { program: '', programType: 'hotel' as const, memberNumber: '', tier: '', points: 0 },
    });

    React.useEffect(() => {
        if (editingFF) {
            ffForm.reset({
                airline: editingFF.airline,
                airlineCode: editingFF.airlineCode,
                programName: editingFF.programName,
                memberNumber: editingFF.memberNumber,
                tier: editingFF.tier,
                points: editingFF.points || 0,
            });
        } else {
            ffForm.reset({ airline: '', airlineCode: '', programName: '', memberNumber: '', tier: 'basic', points: 0 });
        }
    }, [editingFF, ffForm]);

    React.useEffect(() => {
        if (editingLoyalty) {
            loyaltyForm.reset({
                program: editingLoyalty.program,
                programType: editingLoyalty.programType,
                memberNumber: editingLoyalty.memberNumber,
                tier: editingLoyalty.tier || '',
                points: editingLoyalty.points || 0,
            });
        } else {
            loyaltyForm.reset({ program: '', programType: 'hotel', memberNumber: '', tier: '', points: 0 });
        }
    }, [editingLoyalty, loyaltyForm]);

    const getTierIcon = (tier: FrequentFlyer['tier']) => {
        switch (tier) {
            case 'diamond': return <Crown className="h-4 w-4" />;
            case 'platinum': return <Award className="h-4 w-4" />;
            case 'gold': return <Star className="h-4 w-4 fill-current" />;
            case 'silver': return <Star className="h-4 w-4" />;
            default: return null;
        }
    };

    const getTierColor = (tier: FrequentFlyer['tier']) => {
        const colors: Record<string, string> = {
            diamond: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white',
            platinum: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white',
            gold: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
            silver: 'bg-gray-200 text-gray-700',
            basic: 'bg-gray-100 text-gray-600',
        };
        return colors[tier] || colors.basic;
    };

    const handleAirlineSelect = (airline: typeof AIRLINES[0]) => {
        ffForm.setValue('airline', airline.name);
        ffForm.setValue('airlineCode', airline.code);
        ffForm.setValue('programName', airline.program);
    };

    const handleFFSubmit = (values: z.infer<typeof frequentFlyerSchema>) => {
        if (editingFF) {
            onEditFF(editingFF.id, values);
        } else {
            onAddFF(values);
        }
        setFfModalOpen(false);
        toast.success(editingFF ? 'Membership updated' : 'Membership added');
    };

    const handleLoyaltySubmit = (values: z.infer<typeof loyaltySchema>) => {
        if (editingLoyalty) {
            onEditLoyalty(editingLoyalty.id, values);
        } else {
            onAddLoyalty(values);
        }
        setLoyaltyModalOpen(false);
        toast.success(editingLoyalty ? 'Loyalty program updated' : 'Loyalty program added');
    };

    return (
        <div className="space-y-8">
            {/* Frequent Flyer Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Frequent Flyer Programs</h3>
                        <p className="text-sm text-gray-500">Your airline loyalty memberships</p>
                    </div>
                    <Button onClick={() => { setEditingFF(null); setFfModalOpen(true); }} className="rounded-xl bg-gray-900 hover:bg-primary font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Program
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {frequentFlyers.map((ff) => (
                        <Card key={ff.id} className="border border-gray-100 shadow-lg rounded-2xl overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                                            {ff.airlineCode}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{ff.airline}</h4>
                                            <p className="text-sm text-gray-500">{ff.programName}</p>
                                        </div>
                                    </div>
                                    <Badge className={`${getTierColor(ff.tier)} border-none capitalize flex items-center gap-1`}>
                                        {getTierIcon(ff.tier)}
                                        {ff.tier}
                                    </Badge>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                                    <p className="text-xs text-gray-500">Member Number</p>
                                    <p className="font-mono font-bold text-gray-900">{ff.memberNumber}</p>
                                </div>

                                {ff.points && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Plane className="h-4 w-4" />
                                        <span>{ff.points.toLocaleString()} points</span>
                                    </div>
                                )}

                                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                                    <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => { setEditingFF(ff); setFfModalOpen(true); }}>
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-500 rounded-lg" onClick={() => onDeleteFF(ff.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {frequentFlyers.length === 0 && (
                        <div className="col-span-full text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Plane className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">No frequent flyer programs added</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Loyalty Programs Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Other Loyalty Programs</h3>
                        <p className="text-sm text-gray-500">Hotel, car rental, and travel rewards</p>
                    </div>
                    <Button onClick={() => { setEditingLoyalty(null); setLoyaltyModalOpen(true); }} className="rounded-xl bg-gray-900 hover:bg-primary font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Program
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {loyaltyPrograms.map((lp) => (
                        <Card key={lp.id} className="border border-gray-100 shadow-md rounded-xl">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge className="bg-purple-100 text-purple-700 border-none capitalize">{lp.programType.replace('_', ' ')}</Badge>
                                    {lp.tier && <Badge className="bg-gray-100 text-gray-600 border-none">{lp.tier}</Badge>}
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">{lp.program}</h4>
                                <p className="text-sm text-gray-500 font-mono">{lp.memberNumber}</p>
                                {lp.points && <p className="text-sm text-gray-500 mt-1">{lp.points.toLocaleString()} points</p>}
                                <div className="flex gap-1 mt-3">
                                    <Button variant="ghost" size="sm" className="flex-1 h-8" onClick={() => { setEditingLoyalty(lp); setLoyaltyModalOpen(true); }}>
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 text-red-500" onClick={() => onDeleteLoyalty(lp.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {loyaltyPrograms.length === 0 && (
                        <div className="col-span-full text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Award className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No loyalty programs added</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Frequent Flyer Modal */}
            <Dialog open={ffModalOpen} onOpenChange={setFfModalOpen}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Plane className="h-5 w-5" />
                            {editingFF ? 'Edit Frequent Flyer' : 'Add Frequent Flyer Program'}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...ffForm}>
                        <form onSubmit={ffForm.handleSubmit(handleFFSubmit)} className="space-y-4 py-4">
                            {/* Quick Airline Select */}
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Quick Select Airline</label>
                                <div className="flex flex-wrap gap-2">
                                    {AIRLINES.slice(0, 5).map((airline) => (
                                        <Button
                                            key={airline.code}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="rounded-lg"
                                            onClick={() => handleAirlineSelect(airline)}
                                        >
                                            {airline.code}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <FormField control={ffForm.control} name="airline" render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel className="font-bold text-gray-700">Airline</FormLabel>
                                        <FormControl><Input {...field} placeholder="Emirates" className="h-10" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={ffForm.control} name="airlineCode" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Code</FormLabel>
                                        <FormControl><Input {...field} placeholder="EK" maxLength={3} className="h-10 uppercase" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={ffForm.control} name="programName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Program Name</FormLabel>
                                    <FormControl><Input {...field} placeholder="Skywards" className="h-10" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={ffForm.control} name="memberNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Member Number</FormLabel>
                                    <FormControl><Input {...field} placeholder="EK123456789" className="h-10 font-mono" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={ffForm.control} name="tier" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Membership Tier</FormLabel>
                                    <FormControl>
                                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                                            <option value="basic">Basic</option>
                                            <option value="silver">Silver</option>
                                            <option value="gold">Gold</option>
                                            <option value="platinum">Platinum</option>
                                            <option value="diamond">Diamond</option>
                                        </select>
                                    </FormControl>
                                </FormItem>
                            )} />

                            <FormField control={ffForm.control} name="points" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Points Balance (Optional)</FormLabel>
                                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="h-10" /></FormControl>
                                </FormItem>
                            )} />

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={() => setFfModalOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-gray-900 hover:bg-primary rounded-xl">
                                    {editingFF ? 'Update' : 'Add Program'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Loyalty Modal */}
            <Dialog open={loyaltyModalOpen} onOpenChange={setLoyaltyModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            {editingLoyalty ? 'Edit Loyalty Program' : 'Add Loyalty Program'}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...loyaltyForm}>
                        <form onSubmit={loyaltyForm.handleSubmit(handleLoyaltySubmit)} className="space-y-4 py-4">
                            <FormField control={loyaltyForm.control} name="programType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Program Type</FormLabel>
                                    <FormControl>
                                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                                            <option value="hotel">Hotel Rewards</option>
                                            <option value="car_rental">Car Rental</option>
                                            <option value="travel">Travel Rewards</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </FormControl>
                                </FormItem>
                            )} />

                            <FormField control={loyaltyForm.control} name="program" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Program Name</FormLabel>
                                    <FormControl><Input {...field} placeholder="Marriott Bonvoy" className="h-10" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={loyaltyForm.control} name="memberNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Member Number</FormLabel>
                                    <FormControl><Input {...field} placeholder="123456789" className="h-10 font-mono" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={loyaltyForm.control} name="tier" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Tier (Optional)</FormLabel>
                                        <FormControl><Input {...field} placeholder="Gold" className="h-10" /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={loyaltyForm.control} name="points" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Points</FormLabel>
                                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="h-10" /></FormControl>
                                    </FormItem>
                                )} />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={() => setLoyaltyModalOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-gray-900 hover:bg-primary rounded-xl">
                                    {editingLoyalty ? 'Update' : 'Add Program'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default FrequentFlyerManager;
