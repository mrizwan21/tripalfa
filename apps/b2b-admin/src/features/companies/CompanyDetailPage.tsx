import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, GitBranch, Users, Award, PiggyBank, Wallet, CreditCard, Settings, MapPin, Phone, Mail, Globe, Plane, Hash, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { BranchManagement } from './BranchManagement';
import { DepartmentManagement } from './DepartmentManagement';
import { DesignationManagement } from './DesignationManagement';
import { CostCenterManagement } from './CostCenterManagement';
import { CompanyWalletManagement } from './CompanyWalletManagement';
import { FinanceManagement } from './FinanceManagement';

import { companyService } from './MockCompanyService';
import { Company } from './types';

export function CompanyDetailPage() {
    const { companyId, tab } = useParams<{ companyId: string; tab?: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState(tab || 'overview');

    React.useEffect(() => {
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        navigate(`/companies/${companyId}/${val}`);
    };

    const { data: company, isLoading } = useQuery({
        queryKey: ['company', companyId],
        queryFn: () => companyService.getCompany(companyId || '1')
    });

    const getTierBadge = (tier: string) => {
        const styles: Record<string, string> = {
            standard: 'bg-gray-100 text-gray-700',
            premium: 'bg-blue-100 text-blue-700',
            enterprise: 'bg-purple-100 text-purple-700',
        };
        return styles[tier] || styles.standard;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-gray-500">Loading company details...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                {/* Back Button & Header */}
                <div className="flex items-center gap-4">
                    <Link to="/companies">
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-extrabold text-gray-900">{company?.name}</h1>
                            <Badge className={`${getTierBadge(company?.tier || 'standard')} border-none capitalize font-bold`}>
                                {company?.tier}
                            </Badge>
                            <Badge className={company?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                                {company?.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{company?.legalName}</p>
                    </div>
                    <Button variant="outline" className="rounded-xl h-10 font-bold">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                </div>

                {/* Company Overview Card */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Company Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                        <Building2 className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Registration</p>
                                        <p className="font-bold">{company?.registrationNumber}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Plane className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-300">IATA:</span>
                                        <span className="font-bold">{company?.iataCode || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-300">Office:</span>
                                        <span className="font-bold">{company?.officeId || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 border-l border-white/10 pl-6">
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-gray-400">Address</p>
                                        <p className="font-medium">{company?.address.street}</p>
                                        <p className="text-gray-300">{company?.address.city}, {company?.address.country}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{company?.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span>{company?.email}</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-xs text-gray-400 uppercase">Branches</p>
                                    <p className="text-2xl font-extrabold mt-1">{company?.stats.totalBranches}</p>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-xs text-gray-400 uppercase">Employees</p>
                                    <p className="text-2xl font-extrabold mt-1">{company?.stats.totalEmployees}</p>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-xs text-gray-400 uppercase">Bookings</p>
                                    <p className="text-2xl font-extrabold mt-1">{company?.stats.totalBookings.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-xs text-gray-400 uppercase">Revenue</p>
                                    <p className="text-2xl font-extrabold mt-1">${(company?.stats.totalRevenue || 0 / 1000000).toFixed(1)}M</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="bg-white rounded-2xl shadow-lg p-1.5 border border-gray-100 grid grid-cols-7 gap-1">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-2.5">
                            <Building2 className="h-4 w-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="branches" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-2.5">
                            <GitBranch className="h-4 w-4 mr-2" />
                            Branches
                        </TabsTrigger>
                        <TabsTrigger value="departments" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-2.5">
                            <Users className="h-4 w-4 mr-2" />
                            Departments
                        </TabsTrigger>
                        <TabsTrigger value="designations" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-2.5">
                            <Award className="h-4 w-4 mr-2" />
                            Designations
                        </TabsTrigger>
                        <TabsTrigger value="cost-centers" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-2.5">
                            <PiggyBank className="h-4 w-4 mr-2" />
                            Cost Centers
                        </TabsTrigger>
                        <TabsTrigger value="wallet" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-2.5">
                            <Wallet className="h-4 w-4 mr-2" />
                            Wallet
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold py-2.5">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Finance
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="overview" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-none shadow-lg rounded-2xl">
                                    <CardContent className="p-6">
                                        <h3 className="font-bold text-gray-900 mb-4">Company Details</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-500">Legal Name</span>
                                                <span className="font-medium text-gray-900">{company?.legalName}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-500">Tax ID</span>
                                                <span className="font-medium text-gray-900">{company?.taxId}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-500">Registration Number</span>
                                                <span className="font-medium text-gray-900">{company?.registrationNumber}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-500">IATA Code</span>
                                                <span className="font-bold text-blue-600">{company?.iataCode || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-500">Office ID</span>
                                                <span className="font-bold text-purple-600">{company?.officeId || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between py-2">
                                                <span className="text-gray-500">Member Since</span>
                                                <span className="font-medium text-gray-900 flex items-center gap-1">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {new Date(company?.createdAt || '').toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-lg rounded-2xl">
                                    <CardContent className="p-6">
                                        <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                                    <GitBranch className="h-5 w-5" />
                                                    <span className="text-xs font-bold uppercase">Branches</span>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900">{company?.stats.totalBranches}</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-blue-600 mb-2">
                                                    <Users className="h-5 w-5" />
                                                    <span className="text-xs font-bold uppercase">Employees</span>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900">{company?.stats.totalEmployees}</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-green-600 mb-2">
                                                    <Plane className="h-5 w-5" />
                                                    <span className="text-xs font-bold uppercase">Bookings</span>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900">{company?.stats.totalBookings.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-purple-600 mb-2">
                                                    <Wallet className="h-5 w-5" />
                                                    <span className="text-xs font-bold uppercase">Revenue</span>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900">${((company?.stats.totalRevenue || 0) / 1000000).toFixed(1)}M</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="branches" className="mt-0">
                            <BranchManagement companyId={companyId || '1'} />
                        </TabsContent>

                        <TabsContent value="departments" className="mt-0">
                            <DepartmentManagement companyId={companyId || '1'} />
                        </TabsContent>

                        <TabsContent value="designations" className="mt-0">
                            <DesignationManagement companyId={companyId || '1'} />
                        </TabsContent>

                        <TabsContent value="cost-centers" className="mt-0">
                            <CostCenterManagement companyId={companyId || '1'} />
                        </TabsContent>

                        <TabsContent value="wallet" className="mt-0">
                            <CompanyWalletManagement companyId={companyId || '1'} />
                        </TabsContent>

                        <TabsContent value="finance" className="mt-0">
                            <FinanceManagement companyId={companyId || '1'} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

export default CompanyDetailPage;
