import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, MapPin, Plane, Heart, Phone, CreditCard, Award, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import MapboxAddressPicker, { Address } from '@/components/MapboxAddressPicker';
import PersonalCardsManager, { PersonalCard } from './PersonalCardsManager';
import FrequentFlyerManager, { FrequentFlyer, LoyaltyMembership } from './FrequentFlyerManager';

export interface ConsumerProfile {
    dateOfBirth: string;
    nationality: string;
    passportNumber?: string;
    passportExpiry?: string;
    gender: 'male' | 'female' | 'other';
    address?: Address;
    preferences: {
        seatPreference: 'window' | 'aisle' | 'middle';
        mealPreference: string;
        cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
        specialAssistance?: string[];
    };
    emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
        email?: string;
    };
    personalCards: PersonalCard[];
    frequentFlyers: FrequentFlyer[];
    loyaltyPrograms: LoyaltyMembership[];
}

const consumerProfileSchema = z.object({
    dateOfBirth: z.string().min(1, "Date of birth required"),
    nationality: z.string().min(2, "Nationality required"),
    passportNumber: z.string().optional(),
    passportExpiry: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']),
    seatPreference: z.enum(['window', 'aisle', 'middle']),
    mealPreference: z.string(),
    cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']),
    specialAssistance: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyRelationship: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyEmail: z.string().email().optional().or(z.literal('')),
});

interface ConsumerProfileFormProps {
    defaultValues?: Partial<ConsumerProfile>;
    onChange: (values: ConsumerProfile) => void;
}

export function ConsumerProfileForm({ defaultValues, onChange }: ConsumerProfileFormProps) {
    const [activeTab, setActiveTab] = React.useState('personal');
    const [address, setAddress] = React.useState<Address | undefined>(defaultValues?.address);
    const [personalCards, setPersonalCards] = React.useState<PersonalCard[]>(defaultValues?.personalCards || []);
    const [frequentFlyers, setFrequentFlyers] = React.useState<FrequentFlyer[]>(defaultValues?.frequentFlyers || []);
    const [loyaltyPrograms, setLoyaltyPrograms] = React.useState<LoyaltyMembership[]>(defaultValues?.loyaltyPrograms || []);

    const form = useForm({
        resolver: zodResolver(consumerProfileSchema),
        defaultValues: {
            dateOfBirth: defaultValues?.dateOfBirth || '',
            nationality: defaultValues?.nationality || '',
            passportNumber: defaultValues?.passportNumber || '',
            passportExpiry: defaultValues?.passportExpiry || '',
            gender: defaultValues?.gender || 'male',
            seatPreference: defaultValues?.preferences?.seatPreference || 'window',
            mealPreference: defaultValues?.preferences?.mealPreference || '',
            cabinClass: defaultValues?.preferences?.cabinClass || 'economy',
            specialAssistance: defaultValues?.preferences?.specialAssistance?.join(', ') || '',
            emergencyName: defaultValues?.emergencyContact?.name || '',
            emergencyRelationship: defaultValues?.emergencyContact?.relationship || '',
            emergencyPhone: defaultValues?.emergencyContact?.phone || '',
            emergencyEmail: defaultValues?.emergencyContact?.email || '',
        },
    });

    // Compile profile and notify parent
    const compileProfile = React.useCallback(() => {
        const values = form.getValues();
        const profile: ConsumerProfile = {
            dateOfBirth: values.dateOfBirth,
            nationality: values.nationality,
            passportNumber: values.passportNumber,
            passportExpiry: values.passportExpiry,
            gender: values.gender,
            address,
            preferences: {
                seatPreference: values.seatPreference,
                mealPreference: values.mealPreference,
                cabinClass: values.cabinClass,
                specialAssistance: values.specialAssistance ? values.specialAssistance.split(',').map(s => s.trim()) : undefined,
            },
            emergencyContact: values.emergencyName ? {
                name: values.emergencyName,
                relationship: values.emergencyRelationship || '',
                phone: values.emergencyPhone || '',
                email: values.emergencyEmail || undefined,
            } : undefined,
            personalCards,
            frequentFlyers,
            loyaltyPrograms,
        };
        onChange(profile);
    }, [form, address, personalCards, frequentFlyers, loyaltyPrograms, onChange]);

    React.useEffect(() => {
        const subscription = form.watch(() => compileProfile());
        return () => subscription.unsubscribe();
    }, [form, compileProfile]);

    React.useEffect(() => {
        compileProfile();
    }, [address, personalCards, frequentFlyers, loyaltyPrograms, compileProfile]);

    // Card handlers
    const handleAddCard = (card: Omit<PersonalCard, 'id'>) => {
        setPersonalCards(prev => [...prev, { ...card, id: `card-${Date.now()}` }]);
    };
    const handleEditCard = (id: string, card: Partial<PersonalCard>) => {
        setPersonalCards(prev => prev.map(c => c.id === id ? { ...c, ...card } : c));
    };
    const handleDeleteCard = (id: string) => {
        setPersonalCards(prev => prev.filter(c => c.id !== id));
    };
    const handleSetDefaultCard = (id: string) => {
        setPersonalCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
    };

    // FF handlers
    const handleAddFF = (ff: Omit<FrequentFlyer, 'id'>) => {
        setFrequentFlyers(prev => [...prev, { ...ff, id: `ff-${Date.now()}` }]);
    };
    const handleEditFF = (id: string, ff: Partial<FrequentFlyer>) => {
        setFrequentFlyers(prev => prev.map(f => f.id === id ? { ...f, ...ff } : f));
    };
    const handleDeleteFF = (id: string) => {
        setFrequentFlyers(prev => prev.filter(f => f.id !== id));
    };

    // Loyalty handlers
    const handleAddLoyalty = (lp: Omit<LoyaltyMembership, 'id'>) => {
        setLoyaltyPrograms(prev => [...prev, { ...lp, id: `lp-${Date.now()}` }]);
    };
    const handleEditLoyalty = (id: string, lp: Partial<LoyaltyMembership>) => {
        setLoyaltyPrograms(prev => prev.map(l => l.id === id ? { ...l, ...lp } : l));
    };
    const handleDeleteLoyalty = (id: string) => {
        setLoyaltyPrograms(prev => prev.filter(l => l.id !== id));
    };

    return (
        <Card className="border-none shadow-lg rounded-2xl">
            <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Consumer Profile
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-gray-100 rounded-xl p-1 mb-6">
                        <TabsTrigger value="personal" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
                            <User className="h-3 w-3 mr-1" />
                            Personal
                        </TabsTrigger>
                        <TabsTrigger value="address" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            Address
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
                            <Plane className="h-3 w-3 mr-1" />
                            Travel
                        </TabsTrigger>
                        <TabsTrigger value="cards" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Cards
                        </TabsTrigger>
                        <TabsTrigger value="loyalty" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            Loyalty
                        </TabsTrigger>
                    </TabsList>

                    <Form {...form}>
                        {/* Personal Tab */}
                        <TabsContent value="personal" className="mt-0 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Date of Birth *</FormLabel>
                                        <FormControl><Input type="date" {...field} className="h-11 rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="gender" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Gender *</FormLabel>
                                        <FormControl>
                                            <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={form.control} name="nationality" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Nationality *</FormLabel>
                                    <FormControl><Input {...field} placeholder="United Arab Emirates" className="h-11 rounded-xl" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="border-t pt-4">
                                <h4 className="font-bold text-gray-900 mb-4">Travel Documents</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="passportNumber" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Passport Number</FormLabel>
                                            <FormControl><Input {...field} placeholder="AB1234567" className="h-11 rounded-xl font-mono" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="passportExpiry" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Passport Expiry</FormLabel>
                                            <FormControl><Input type="date" {...field} className="h-11 rounded-xl" /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    Emergency Contact
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="emergencyName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Contact Name</FormLabel>
                                            <FormControl><Input {...field} placeholder="Jane Doe" className="h-11 rounded-xl" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="emergencyRelationship" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Relationship</FormLabel>
                                            <FormControl><Input {...field} placeholder="Spouse" className="h-11 rounded-xl" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="emergencyPhone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Phone</FormLabel>
                                            <FormControl><Input {...field} placeholder="+971 50 123 4567" className="h-11 rounded-xl" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="emergencyEmail" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Email</FormLabel>
                                            <FormControl><Input type="email" {...field} placeholder="jane@email.com" className="h-11 rounded-xl" /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Address Tab */}
                        <TabsContent value="address" className="mt-0">
                            <MapboxAddressPicker value={address} onChange={setAddress} placeholder="Search your home address..." />
                        </TabsContent>

                        {/* Preferences Tab */}
                        <TabsContent value="preferences" className="mt-0 space-y-6">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                <Plane className="h-4 w-4" />
                                Flight Preferences
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="seatPreference" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Seat Preference</FormLabel>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                {['window', 'aisle', 'middle'].map((seat) => (
                                                    <button
                                                        key={seat}
                                                        type="button"
                                                        onClick={() => field.onChange(seat)}
                                                        className={`flex-1 py-3 px-4 rounded-xl border font-bold capitalize transition-all ${field.value === seat
                                                                ? 'bg-gray-900 text-white border-gray-900'
                                                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {seat}
                                                    </button>
                                                ))}
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="cabinClass" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Preferred Cabin Class</FormLabel>
                                        <FormControl>
                                            <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                                <option value="economy">Economy</option>
                                                <option value="premium_economy">Premium Economy</option>
                                                <option value="business">Business</option>
                                                <option value="first">First Class</option>
                                            </select>
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={form.control} name="mealPreference" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Meal Preference</FormLabel>
                                    <FormControl>
                                        <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                            <option value="">No preference</option>
                                            <option value="vegetarian">Vegetarian (VGML)</option>
                                            <option value="vegan">Vegan (VGMN)</option>
                                            <option value="halal">Halal (MOML)</option>
                                            <option value="kosher">Kosher (KSML)</option>
                                            <option value="hindu">Hindu (HNML)</option>
                                            <option value="gluten_free">Gluten Free (GFML)</option>
                                            <option value="diabetic">Diabetic (DBML)</option>
                                            <option value="low_sodium">Low Sodium (LSML)</option>
                                            <option value="child">Child Meal (CHML)</option>
                                        </select>
                                    </FormControl>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="specialAssistance" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Special Assistance</FormLabel>
                                    <FormControl><Input {...field} placeholder="Wheelchair, visual assistance, etc." className="h-11 rounded-xl" /></FormControl>
                                </FormItem>
                            )} />
                        </TabsContent>

                        {/* Cards Tab */}
                        <TabsContent value="cards" className="mt-0">
                            <PersonalCardsManager
                                cards={personalCards}
                                onAdd={handleAddCard}
                                onEdit={handleEditCard}
                                onDelete={handleDeleteCard}
                                onSetDefault={handleSetDefaultCard}
                            />
                        </TabsContent>

                        {/* Loyalty Tab */}
                        <TabsContent value="loyalty" className="mt-0">
                            <FrequentFlyerManager
                                frequentFlyers={frequentFlyers}
                                loyaltyPrograms={loyaltyPrograms}
                                onAddFF={handleAddFF}
                                onEditFF={handleEditFF}
                                onDeleteFF={handleDeleteFF}
                                onAddLoyalty={handleAddLoyalty}
                                onEditLoyalty={handleEditLoyalty}
                                onDeleteLoyalty={handleDeleteLoyalty}
                            />
                        </TabsContent>
                    </Form>
                </Tabs>
            </CardContent>
        </Card>
    );
}

export default ConsumerProfileForm;
