import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    CreditCard,
    Plane,
    Award,
    Building2,
    Store,
    Edit,
    Save,
    X,
    Camera,
    ArrowLeft,
    Settings,
    Globe,
    Briefcase,
    Star
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

import StaffProfileForm from './StaffProfileForm';
import ConsumerProfileForm from './ConsumerProfileForm';
import SubagentProfileForm from './SubagentProfileForm';

import { UserProfile } from './types';
import { ProfilePassportManager } from './ProfilePassportManager';
import { ProfileVisaManager } from './ProfileVisaManager';
import { ProfilePreferencesManager } from './ProfilePreferencesManager';
import { ProfileLoyaltyPayments } from './ProfileLoyaltyPayments';
import { ProfileDependentManager } from './ProfileDependentManager';
import { ProfileDocumentVault } from './ProfileDocumentVault';
import { ProfileAssociatedClientsManager } from './ProfileAssociatedClientsManager';
import UserPreferences from '@/components/notifications/UserPreferences';

export function UserProfilePage() {
    const { userId, tab } = useParams<{ userId: string; tab?: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState(tab || 'details');

    React.useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        navigate(`/users/profile/${userId}/${val}`);
    };

    const { data: user, isLoading } = useQuery(['user', userId], async () => {
        const mockUser: UserProfile = {
            id: userId || '1',
            userType: 'staff',
            email: 'john.smith@travelpro.ae',
            phone: '+971 50 123 4567',
            firstName: 'John',
            middleName: 'Quincy',
            lastName: 'Smith',
            preferredName: 'Johnny',
            gender: 'MALE',
            dob: '1985-05-15',
            status: 'active',
            createdAt: '2023-08-15',
            homeAddress: {
                street: '123 Marina Walk',
                country: 'UAE',
                state: 'Dubai',
                city: 'Dubai',
                postCode: '00000'
            },
            emergencyContact: {
                name: 'Jane Smith',
                relation: 'Spouse',
                phone: '+971 50 987 6543',
                mobile: '+971 50 987 6543',
                email: 'jane.smith@email.com'
            },
            passports: [
                { id: 'p1', passportNo: 'L839201', dob: '1985-05-15', nationality: 'British', issuingCountry: 'UK', placeOfIssue: 'London', expiry: '2028-10-20', isPrimary: true, status: 'ACTIVE' }
            ],
            visas: [
                { id: 'v1', country: 'United States', visaNo: 'U92039', type: 'B1/B2', dateOfIssue: '2022-03-15', dateOfExpiry: '2032-03-15', remarks: 'Multi-entry business visa' }
            ],
            loyaltyPrograms: [
                { id: 'l1', provider: 'Emirates Skywards', type: 'AIRLINE', membershipNumber: 'EK123456789', expiryDate: '2025-12-31' },
                { id: 'l2', provider: 'Marriott Bonvoy', type: 'HOTEL', membershipNumber: 'MB-99201' }
            ],
            paymentCards: [
                { id: 'c1', cardName: 'Primary Visa', type: 'VISA', nameOnCard: 'JOHN Q SMITH', cardNumberMasked: '**** **** **** 4421', expiry: '08/27' }
            ],
            preferences: {
                flight: {
                    seatPreference: 'WINDOW',
                    mealPreference: 'VGML (Vegan)',
                    classPreference: 'BUSINESS',
                    preferredAirlines: ['Emirates', 'British Airways'],
                    tsaPrecheck: 'K8291039'
                },
                hotel: {
                    roomPreference: 'KING',
                    smokingPreference: 'NON_SMOKING',
                    starRating: 5,
                    facilities: ['High-speed WiFi', 'Late Check-out', 'Gym Access']
                },
                car: {
                    carType: 'SUV',
                    preferredCompany: 'Hertz'
                }
            },
            documents: [
                { id: 'd1', title: 'Passport Scan - 2023', fileUrl: '#', uploadDate: '2023-08-15', fileType: 'application/pdf' },
                { id: 'd2', title: 'Vaccination Doc', fileUrl: '#', uploadDate: '2023-11-20', fileType: 'application/pdf' }
            ]
        };

        const extendedUser = mockUser as any;
        extendedUser.dependents = [
            { id: 'dep1', firstName: 'Jane', lastName: 'Smith', relation: 'Spouse', gender: 'FEMALE', dob: '1987-10-12', email: 'jane.smith@email.com', status: 'ACTIVE' },
            { id: 'dep2', firstName: 'Leo', lastName: 'Smith', relation: 'Child', gender: 'MALE', dob: '2015-04-20', status: 'ACTIVE' }
        ];
        extendedUser.associatedClients = [
            { id: 'assoc1', name: 'Robert Johnson', email: 'robert.j@pwc.com', status: 'ACTIVE', relation: 'Colleague', associatedDate: '2023-09-01' }
        ];
        extendedUser.feedbacks = [
            { id: 'f1', service: 'Flight EK201', rating: 5, comment: 'Excellent service, very supportive staff.', date: '2023-12-10' }
        ];

        return mockUser;
    });

    const updateMutation = useMutation(
        async (updatedUser: Partial<UserProfile>) => {
            await new Promise(r => setTimeout(r, 1000));
            return updatedUser;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['user', userId]);
                setIsEditing(false);
                toast.success('Profile updated successfully');
            }
        }
    );

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'staff': return 'from-blue-500 to-indigo-600';
            case 'b2c': return 'from-green-500 to-emerald-600';
            case 'b2b_subagent': return 'from-purple-500 to-pink-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen font-bold text-gray-400">Loading comprehensive profile...</div>;
    }

    if (!user) {
        return <div className="flex items-center justify-center min-h-screen">User not found</div>;
    }

    const extendedUser = user as any;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="rounded-xl font-bold" onClick={() => navigate('/users')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Directory
                    </Button>
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} className="rounded-xl bg-gray-900 hover:bg-primary font-bold shadow-lg shadow-gray-200">
                            <Edit className="h-4 w-4 mr-2" />
                            Update Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl font-bold">
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button className="rounded-xl bg-primary text-white font-bold" onClick={() => setIsEditing(false)}>
                                <Save className="h-4 w-4 mr-2" />
                                Commit Changes
                            </Button>
                        </div>
                    )}
                </div>

                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                    <div className={`h-40 bg-gradient-to-r ${getTypeColor(user.userType)} relative`}>
                        <div className="absolute inset-0 bg-black/5" />
                        {user.status === 'active' && (
                            <Badge className="absolute top-6 right-8 bg-white/20 text-white border-none backdrop-blur-md px-4 py-1.5 font-black uppercase tracking-tighter">
                                <Shield className="h-3 w-3 mr-2" /> Verified Profile
                            </Badge>
                        )}
                    </div>
                    <CardContent className="p-10 pt-0 -mt-16">
                        <div className="flex flex-col md:flex-row items-end gap-8">
                            <div className="relative">
                                <div className="h-40 w-40 rounded-[2rem] bg-white p-1.5 shadow-2xl rotate-2">
                                    <div className="h-full w-full rounded-[1.75rem] bg-gray-100 flex items-center justify-center overflow-hidden">
                                        <User className="h-20 w-20 text-gray-300" />
                                    </div>
                                </div>
                                {isEditing && (
                                    <Button size="icon" className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl shadow-2xl bg-primary hover:bg-primary/90 text-white">
                                        <Camera className="h-6 w-6" />
                                    </Button>
                                )}
                            </div>
                            <div className="flex-1 pb-4">
                                <div className="flex items-center gap-4">
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                                        {user.firstName} {user.lastName}
                                    </h1>
                                    <Badge className="bg-indigo-50 text-indigo-700 border-none px-3 py-1 font-black uppercase text-[10px] tracking-widest">
                                        {user.userType.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-500 font-bold">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-primary" />
                                        {user.email}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-primary" />
                                        {user.phone}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-primary" />
                                        Senior Manager
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {!isEditing ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 space-y-6">
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="bg-white rounded-3xl shadow-xl border border-gray-100 p-1.5 w-full justify-start overflow-x-auto h-auto flex-wrap gap-1">
                                    {[
                                        { id: 'details', label: 'Summary' },
                                        { id: 'passports', label: 'Passports' },
                                        { id: 'visas', label: 'Visas' },
                                        { id: 'travel', label: 'Preferences' },
                                        { id: 'payments', label: 'Finance' },
                                        { id: 'dependents', label: 'Family' },
                                        { id: 'links', label: 'Linked' },
                                        { id: 'feedback', label: 'History' },
                                    ].map(t => (
                                        <TabsTrigger
                                            key={t.id}
                                            value={t.id}
                                            className="rounded-2xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black px-6 py-3.5 text-xs transition-all tracking-wider" > {t.label} </TabsTrigger> ))} </TabsList> <div className="mt-8">
                                    <TabsContent value="details" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Card className="border-none shadow-xl rounded-3xl bg-white">
                                                <CardHeader className="border-b border-gray-100 p-8">
                                                    <CardTitle className="text-lg font-black flex items-center gap-3">
                                                        <MapPin className="h-6 w-6 text-rose-500" />
                                                        Address Information
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-8">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Home Address</p>
                                                        <p className="text-xl font-black text-gray-900">{user.homeAddress?.street}</p>
                                                        <p className="text-gray-500 font-bold">{user.homeAddress?.city}, {user.homeAddress?.state}, {user.homeAddress?.country}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="border-none shadow-xl rounded-3xl bg-white">
                                                <CardHeader className="border-b border-gray-100 p-8">
                                                    <CardTitle className="text-lg font-black flex items-center gap-3">
                                                        <Shield className="h-6 w-6 text-amber-500" />
                                                        Emergency Contact
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-8 space-y-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Contact Name</p>
                                                        <p className="text-xl font-black text-gray-900">{user.emergencyContact?.name}</p>
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-600 font-black mt-1 uppercase text-[10px] border-amber-200">{user.emergencyContact?.relation}</Badge>
                                                    </div>
                                                    <p className="font-bold text-gray-600">{user.emergencyContact?.mobile}</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="passports" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <ProfilePassportManager passports={user.passports} onUpdate={(updated) => updateMutation.mutate({ passports: updated })} />
                                    </TabsContent>

                                    <TabsContent value="visas" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <ProfileVisaManager visas={user.visas} onUpdate={(updated) => updateMutation.mutate({ visas: updated })} />
                                    </TabsContent>

                                    <TabsContent value="travel" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <ProfilePreferencesManager preferences={user.preferences} />
                                    </TabsContent>

                                    <TabsContent value="payments" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <ProfileLoyaltyPayments
                                            loyaltyPrograms={user.loyaltyPrograms}
                                            paymentCards={user.paymentCards}
                                            onUpdateCards={(updated) => updateMutation.mutate({ paymentCards: updated })}
                                            onUpdateLoyalty={(updated) => updateMutation.mutate({ loyaltyPrograms: updated })}
                                        />
                                    </TabsContent>

                                    <TabsContent value="dependents" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <ProfileDependentManager dependents={extendedUser.dependents || []} onUpdate={(updated) => updateMutation.mutate({ dependents: updated })} />
                                    </TabsContent>

                                    <TabsContent value="links" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <ProfileAssociatedClientsManager clients={extendedUser.associatedClients || []} onAssociate={() => { }} />
                                    </TabsContent>

                                    <TabsContent value="documents" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <ProfileDocumentVault documents={extendedUser.documents || []} onUpdate={(updated) => updateMutation.mutate({ documents: updated })} />
                                    </TabsContent>

                                    <TabsContent value="feedback" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-4">
                                            {extendedUser.feedbacks.map((f: any) => (
                                                <Card key={f.id} className="border-none shadow-xl rounded-3xl p-8 bg-white">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-black text-xl text-gray-900">{f.service}</p>
                                                            <div className="flex text-amber-400 gap-0.5 mt-1">
                                                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-black text-gray-400">{f.date}</p>
                                                    </div>
                                                    <p className="mt-4 text-gray-600 font-medium italic">"{f.comment}"</p>
                                                </Card>
                                            ))}
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>

                        <div className="space-y-6">
                            <Card className="border-none shadow-xl rounded-3xl bg-white p-4">
                                <CardHeader className="px-4 pt-4">
                                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Notifications</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <UserPreferences userId={user.id} />
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gray-900 text-white overflow-hidden p-10 relative">
                                <div className="relative z-10">
                                    <div className="h-20 w-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-6 border border-white/5">
                                        <Award className="h-10 w-10 text-primary" />
                                    </div>
                                    <h3 className="font-black text-2xl mb-1 tracking-tight">Elite Tier</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Active Member</p>
                                    <div className="grid grid-cols-2 gap-4 mt-8">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-3xl font-black">12</p>
                                            <p className="text-[10px] uppercase font-black text-gray-500">Trips</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-3xl font-black text-primary">45k</p>
                                            <p className="text-[10px] uppercase font-black text-gray-500">Points</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-primary/20 blur-[100px] pointer-events-none" />
                            </Card>

                            <Card className="border-none shadow-xl rounded-3xl bg-white p-2">
                                <CardHeader className="px-6 pt-6">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                        <Settings className="h-4 w-4" /> Management
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 space-y-2">
                                    <Button variant="ghost" className="w-full justify-start rounded-2xl h-12 font-bold text-gray-600 hover:bg-gray-50">Reset Security</Button>
                                    <Button variant="ghost" className="w-full justify-start rounded-2xl h-12 font-bold text-rose-500 hover:bg-rose-50">Restrict User</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {user.userType === 'staff' && (
                            <StaffProfileForm
                                defaultValues={user as any}
                                onChange={(val) => {
                                    // In a real app, strict typing would be needed here
                                    // For now we just log or would update a local state buffer
                                    console.log('Staff profile update:', val);
                                }}
                            />
                        )}
                        {user.userType === 'b2b_subagent' && (
                            <SubagentProfileForm
                                defaultValues={user as any}
                                onChange={(val) => {
                                    console.log('Subagent profile update:', val);
                                }}
                            />
                        )}
                        {user.userType === 'b2c' && (
                            <ConsumerProfileForm
                                defaultValues={user as any}
                                onChange={(val) => {
                                    console.log('Consumer profile update:', val);
                                }}
                            />
                        )}

                        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                            <div className="flex items-start gap-4 p-4 bg-amber-50 text-amber-800 rounded-2xl">
                                <Star className="h-6 w-6 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-lg mb-1">Editing Profile</h4>
                                    <p className="text-sm opacity-90">
                                        You are currently editing the main profile details.
                                        Changes made here will be saved when you click "Commit Changes" at the top.
                                        <br /><br />
                                        <strong>Note:</strong> Sensitive items like Passports, Visas, and Cards are managed separately via their respective tabs.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserProfilePage;
