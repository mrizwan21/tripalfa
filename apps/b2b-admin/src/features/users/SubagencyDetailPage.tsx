import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, Store, GitBranch, Users, Award, PiggyBank, Wallet, CreditCard, Settings, MapPin, Phone, Mail, Plane, Hash, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { BranchManagement } from '../companies/BranchManagement';
import { DepartmentManagement } from '../companies/DepartmentManagement';
import { DesignationManagement } from '../companies/DesignationManagement';
import { CostCenterManagement } from '../companies/CostCenterManagement';
import { CompanyWalletManagement } from '../companies/CompanyWalletManagement';
import { FinanceManagement } from '../companies/FinanceManagement';

interface Subagency {
    id: string;
    parentCompanyId: string;
    parentCompanyName: string;
    name: string;
    legalName: string;
    registrationNumber?: string;
    taxId?: string;
    iataCode?: string;
    officeId?: string;
    status: 'active' | 'inactive' | 'pending';
    address: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
    };
    phone: string;
    email: string;
    createdAt: string;
    stats: {
        totalBranches: number;
        totalEmployees: number;
        totalBookings: number;
        totalRevenue: number;
    };
}

export function SubagencyDetailPage() {
    const { subagencyId, tab } = useParams<{ subagencyId: string; tab?: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState(tab || 'overview');

    React.useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        navigate(`/subagencies/${subagencyId}/${val}`);
    };

    const { data: subagency, isLoading } = useQuery(['subagency', subagencyId], async () => ({
        id: subagencyId || '1',
        parentCompanyId: '1',
        parentCompanyName: 'TravelPro International',
        name: 'Dubai Holiday Experts',
        legalName: 'DHE Travel LLC',
        registrationNumber: 'LLC-2022-56789',
        taxId: 'TAX-5678901234',
        iataCode: 'DHE01',
        officeId: 'OFF-DHE-001',
        status: 'active',
        address: {
            street: 'Al Wasl Road, Office 501',
            city: 'Dubai',
            country: 'UAE',
            postalCode: '00000',
        },
        phone: '+971-4-555-6789',
        email: 'info@dhetravel.ae',
        createdAt: '2022-03-10',
        stats: {
            totalBranches: 2,
            totalEmployees: 18,
            totalBookings: 3250,
            totalRevenue: 820000,
        },
    } as Subagency));

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-gray-100 text-gray-600',
            pending: 'bg-yellow-100 text-yellow-700',
        };
        return styles[status] || styles.inactive;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-gray-500">Loading subagency details...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                {/* Back Button & Header */}
                <div className="flex items-center gap-4">
                    <Link to="/users">
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center">
                                <Store className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-extrabold text-gray-900">{subagency?.name}</h1>
                                    <Badge className="bg-purple-100 text-purple-700 border-none">Subagency</Badge>
                                    <Badge className={getStatusBadge(subagency?.status || 'inactive')}>
                                        {subagency?.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                    <Building2 className="h-4 w-4" />
                                    <span>Under {subagency?.parentCompanyName}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-xl h-10 font-bold">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </div>

                {/* Subagency Overview Card */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white rounded-3xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Subagency Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                        <Store className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-200">Registration</p>
                                        <p className="font-bold">{subagency?.registrationNumber}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Plane className="h-4 w-4 text-purple-300" />
                                        <span className="text-purple-200">IATA:</span>
                                        <span className="font-bold">{subagency?.iataCode || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-purple-300" />
                                        <span className="text-purple-200">Office:</span>
                                        <span className="font-bold">{subagency?.officeId || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 border-l border-white/10 pl-6">
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-purple-300 mt-0.5" />
                                    <div>
                                        <p className="text-purple-200">Address</p>
                                        <p className="font-medium">{subagency?.address.street}</p>
                                        <p className="text-purple-200">{subagency?.address.city}, {subagency?.address.country}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-purple-300" />
                                    <span>{subagency?.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-purple-300" />
                                    <span>{subagency?.email}</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-xs text-purple-200 uppercase">Branches</p>
                                    <p className="text-2xl font-extrabold mt-1">{subagency?.stats.totalBranches}</p>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-xs text-purple-200 uppercase">Employees</p>
                                    <p className="text-2xl font-extrabold mt-1">{subagency?.stats.totalEmployees}</p>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-xs text-purple-200 uppercase">Bookings</p>
                                    <p className="text-2xl font-extrabold mt-1">{subagency?.stats.totalBookings.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-xs text-purple-200 uppercase">Revenue</p>
                                    <p className="text-2xl font-extrabold mt-1">${((subagency?.stats.totalRevenue || 0) / 1000).toFixed(0)}K</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="bg-white rounded-2xl shadow-lg p-1.5 border border-gray-100 grid grid-cols-7 gap-1">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold py-2.5">
                            <Store className="h-4 w-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="branches" className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold py-2.5">
                            <GitBranch className="h-4 w-4 mr-2" />
                            Branches
                        </TabsTrigger>
                        <TabsTrigger value="departments" className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold py-2.5">
                            <Users className="h-4 w-4 mr-2" />
                            Departments
                        </TabsTrigger>
                        <TabsTrigger value="designations" className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold py-2.5">
                            <Award className="h-4 w-4 mr-2" />
                            Designations
                        </TabsTrigger>
                        <TabsTrigger value="cost-centers" className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold py-2.5">
                            <PiggyBank className="h-4 w-4 mr-2" />
                            Cost Centers
                        </TabsTrigger>
                        <TabsTrigger value="wallet" className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold py-2.5">
                            <Wallet className="h-4 w-4 mr-2" />
                            Wallet
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white font-bold py-2.5">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Finance
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="overview" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-none shadow-lg rounded-2xl">
                                    <CardContent className="p-6">
                                        <h3 className="font-bold text-gray-900 mb-4">Subagency Details</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-500">Legal Name</span>
                                                <span className="font-medium text-gray-900">{subagency?.legalName}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-500">Parent Company</span>
                                                <span className="font-medium text-purple-600">{subagency?.parentCompanyName}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-500">Tax ID</span>
                                                <span className="font-medium text-gray-900">{subagency?.taxId}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-500">IATA Code</span>
                                                <span className="font-bold text-blue-600">{subagency?.iataCode || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-500">Office ID</span>
                                                <span className="font-bold text-purple-600">{subagency?.officeId || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between py-2">
                                                <span className="text-gray-500">Established</span>
                                                <span className="font-medium text-gray-900 flex items-center gap-1">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {new Date(subagency?.createdAt || '').toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-lg rounded-2xl">
                                    <CardContent className="p-6">
                                        <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-purple-600 mb-2">
                                                    <GitBranch className="h-5 w-5" />
                                                    <span className="text-xs font-bold uppercase">Branches</span>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900">{subagency?.stats.totalBranches}</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-blue-600 mb-2">
                                                    <Users className="h-5 w-5" />
                                                    <span className="text-xs font-bold uppercase">Employees</span>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900">{subagency?.stats.totalEmployees}</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-green-600 mb-2">
                                                    <Plane className="h-5 w-5" />
                                                    <span className="text-xs font-bold uppercase">Bookings</span>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900">{subagency?.stats.totalBookings.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-amber-600 mb-2">
                                                    <Wallet className="h-5 w-5" />
                                                    <span className="text-xs font-bold uppercase">Revenue</span>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900">${((subagency?.stats.totalRevenue || 0) / 1000).toFixed(0)}K</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="branches" className="mt-0">
                            <BranchManagement companyId={subagencyId || '1'} />
                        </TabsContent>

                        <TabsContent value="departments" className="mt-0">
                            <DepartmentManagement companyId={subagencyId || '1'} />
                        </TabsContent>

                        <TabsContent value="designations" className="mt-0">
                            <DesignationManagement companyId={subagencyId || '1'} />
                        </TabsContent>

                        <TabsContent value="cost-centers" className="mt-0">
                            <CostCenterManagement companyId={subagencyId || '1'} />
                        </TabsContent>

                        <TabsContent value="wallet" className="mt-0">
                            <CompanyWalletManagement companyId={subagencyId || '1'} />
                        </TabsContent>

                        <TabsContent value="finance" className="mt-0">
                            <FinanceManagement companyId={subagencyId || '1'} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

export default SubagencyDetailPage;
