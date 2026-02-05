import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, Users, Building2, Store, User, Edit, Trash2, Eye, MoreVertical, Filter, Shield, Calendar, Mail, Phone, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import UserCreateWizard from './UserCreateWizard';

type UserType = 'all' | 'staff' | 'b2c' | 'b2b_subagent';

interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  userType: 'staff' | 'b2c' | 'b2b_subagent';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;

  // Staff-specific
  companyName?: string;
  companyId?: string;
  branchName?: string;
  departmentName?: string;
  designationName?: string;

  // Subagent-specific
  subagencyName?: string;
  subagencyId?: string;

  // B2C-specific
  nationality?: string;
  loyaltyTier?: string;
}

export default function UsersListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { tab } = useParams();
  const [activeTab, setActiveTab] = React.useState<UserType>((tab as UserType) || 'all');

  React.useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab as UserType);
    }
  }, [tab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as UserType);
    navigate(`/users/${value}`);
  };
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreateWizard, setShowCreateWizard] = React.useState(false);

  const { data: users = [], isLoading } = useQuery(['users', activeTab], async () => [
    { id: '1', firstName: 'John', lastName: 'Smith', email: 'john.smith@travelpro.ae', phone: '+971 50 123 4567', userType: 'staff', status: 'active', createdAt: '2023-08-15', companyName: 'TravelPro International', branchName: 'Dubai Main', departmentName: 'Operations', designationName: 'Senior Manager' },
    { id: '2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@email.com', phone: '+971 55 987 6543', userType: 'b2c', status: 'active', createdAt: '2024-01-10', nationality: 'UAE', loyaltyTier: 'Gold' },
    { id: '3', firstName: 'Mike', lastName: 'Brown', email: 'mike.b@dhetravel.ae', phone: '+971 52 456 7890', userType: 'b2b_subagent', status: 'active', createdAt: '2023-11-22', subagencyName: 'Dubai Holiday Experts', subagencyId: '1', designationName: 'Travel Consultant' },
    { id: '4', firstName: 'Emily', lastName: 'Davis', email: 'emily.d@travelpro.ae', phone: '+971 50 234 5678', userType: 'staff', status: 'inactive', createdAt: '2023-05-20', companyName: 'TravelPro International', branchName: 'Abu Dhabi', departmentName: 'Sales', designationName: 'Manager' },
    { id: '5', firstName: 'Ahmed', lastName: 'Al-Hassan', email: 'ahmed@email.com', phone: '+971 56 111 2222', userType: 'b2c', status: 'pending', createdAt: '2024-01-25', nationality: 'Saudi Arabia' },
    { id: '6', firstName: 'Lisa', lastName: 'Wang', email: 'lisa.w@llttravel.com', phone: '+44 20 1234 5678', userType: 'b2b_subagent', status: 'active', createdAt: '2023-09-10', subagencyName: 'London Luxury Travel', subagencyId: '3', designationName: 'Agency Owner' },
  ] as UserListItem[]);

  const filteredUsers = React.useMemo(() => {
    let result = users;
    if (activeTab !== 'all') {
      result = result.filter(u => u.userType === activeTab);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.companyName?.toLowerCase().includes(query) ||
        u.subagencyName?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [users, activeTab, searchQuery]);

  const stats = React.useMemo(() => ({
    total: users.length,
    staff: users.filter(u => u.userType === 'staff').length,
    b2c: users.filter(u => u.userType === 'b2c').length,
    subagent: users.filter(u => u.userType === 'b2b_subagent').length,
    active: users.filter(u => u.status === 'active').length,
  }), [users]);

  const deleteMutation = useMutation(
    async (id: string) => {
      await new Promise(r => setTimeout(r, 500));
      return id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('User deleted');
      },
    }
  );

  const handleDelete = (user: UserListItem) => {
    if (window.confirm(`Delete ${user.firstName} ${user.lastName}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleCreateComplete = (userData: any) => {
    console.log('User created:', userData);
    setShowCreateWizard(false);
    queryClient.invalidateQueries(['users']);
    toast.success('User created successfully');
  };

  const getUserTypeBadge = (type: UserListItem['userType']) => {
    const badges = {
      staff: { className: 'bg-blue-100 text-blue-700', icon: Building2, label: 'Staff' },
      b2c: { className: 'bg-green-100 text-green-700', icon: User, label: 'Consumer' },
      b2b_subagent: { className: 'bg-purple-100 text-purple-700', icon: Store, label: 'Subagent' },
    };
    const badge = badges[type];
    return (
      <Badge className={`${badge.className} border-none font-medium`}>
        <badge.icon className="h-3 w-3 mr-1" />
        {badge.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: UserListItem['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return <Badge className={`${styles[status]} border-none capitalize`}>{status}</Badge>;
  };

  if (showCreateWizard) {
    return (
      <UserCreateWizard
        onComplete={handleCreateComplete}
        onCancel={() => setShowCreateWizard(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">Manage staff, consumers, and subagent users</p>
          </div>
          <Button onClick={() => setShowCreateWizard(true)} className="rounded-xl h-11 bg-gray-900 hover:bg-primary font-bold">
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-200 uppercase">Total Users</p>
                <h3 className="text-3xl font-extrabold mt-1">{stats.total}</h3>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-white rounded-2xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Staff</p>
                <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{stats.staff}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-white rounded-2xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Consumers</p>
                <h3 className="text-2xl font-extrabold text-green-600 mt-1">{stats.b2c}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-white rounded-2xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Subagents</p>
                <h3 className="text-2xl font-extrabold text-purple-600 mt-1">{stats.subagent}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Store className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-white rounded-2xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Active</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.active}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Search */}
        <div className="flex items-center gap-4 border-b border-gray-100">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="h-14 bg-transparent p-0 gap-6">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold px-4">
                All Users
              </TabsTrigger>
              <TabsTrigger value="staff" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold px-4">
                <Building2 className="h-4 w-4 mr-2" />
                Staff
              </TabsTrigger>
              <TabsTrigger value="b2c" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold px-4">
                <User className="h-4 w-4 mr-2" />
                B2C
              </TabsTrigger>
              <TabsTrigger value="b2b_subagent" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white font-bold px-4">
                <Store className="h-4 w-4 mr-2" />
                Subagents
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl border-gray-200"
              />
            </div>
            <Button variant="outline" className="rounded-xl h-10">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-bold text-gray-900 py-4 pl-6">User</TableHead>
                <TableHead className="font-bold text-gray-900 py-4">Type</TableHead>
                <TableHead className="font-bold text-gray-900 py-4">Organization</TableHead>
                <TableHead className="font-bold text-gray-900 py-4">Role/Tier</TableHead>
                <TableHead className="font-bold text-gray-900 py-4">Status</TableHead>
                <TableHead className="font-bold text-gray-900 py-4">Joined</TableHead>
                <TableHead className="font-bold text-gray-900 py-4 pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getUserTypeBadge(user.userType)}</TableCell>
                    <TableCell>
                      {user.userType === 'staff' && (
                        <div>
                          <p className="font-medium text-gray-900">{user.companyName}</p>
                          <p className="text-xs text-gray-500">{user.branchName}</p>
                        </div>
                      )}
                      {user.userType === 'b2b_subagent' && (
                        <div>
                          <p className="font-medium text-purple-600">{user.subagencyName}</p>
                          <p className="text-xs text-gray-500">Subagency</p>
                        </div>
                      )}
                      {user.userType === 'b2c' && (
                        <div className="text-gray-500">
                          <p className="font-medium">{user.nationality || '-'}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.userType === 'staff' && (
                        <div>
                          <p className="font-medium text-gray-900">{user.designationName}</p>
                          <p className="text-xs text-gray-500">{user.departmentName}</p>
                        </div>
                      )}
                      {user.userType === 'b2b_subagent' && (
                        <p className="font-medium text-gray-900">{user.designationName}</p>
                      )}
                      {user.userType === 'b2c' && user.loyaltyTier && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-none">{user.loyaltyTier}</Badge>
                      )}
                      {user.userType === 'b2c' && !user.loyaltyTier && '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => navigate(`/users/profile/${user.id}`)} className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          {user.userType === 'b2b_subagent' && user.subagencyId && (
                            <DropdownMenuItem onClick={() => navigate(`/subagencies/${user.subagencyId}`)} className="gap-2">
                              <Store className="h-4 w-4" />
                              View Subagency
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(user)} className="gap-2 text-red-600">
                            <Trash2 className="h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
