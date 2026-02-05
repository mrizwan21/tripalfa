import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Search, Filter, Calendar, User, Clock, Eye, EyeOff } from 'lucide-react';
import type { RuleCategory } from '../../types/ruleManagement';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  ruleName: string;
  category: RuleCategory;
  performedBy: string;
  details: string;
  ipAddress: string;
  userAgent: string;
}

export const RuleAuditLog: React.FC<{ category: RuleCategory }> = ({ category }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock audit log data
  useEffect(() => {
    const mockLogs: AuditLogEntry[] = [
      {
        id: 'log-001',
        timestamp: '2024-01-15 14:30:25',
        action: 'updated',
        ruleName: 'Weekend Markup',
        category: 'markup',
        performedBy: 'john.doe@company.com',
        details: 'Updated markup percentage from 15% to 20%',
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/120.0.0.0'
      },
      {
        id: 'log-002',
        timestamp: '2024-01-15 10:15:42',
        action: 'activated',
        ruleName: 'Corporate Commission',
        category: 'commission',
        performedBy: 'admin@company.com',
        details: 'Activated rule for corporate bookings',
        ipAddress: '10.0.0.50',
        userAgent: 'Firefox/121.0'
      },
      {
        id: 'log-003',
        timestamp: '2024-01-14 16:45:12',
        action: 'created',
        ruleName: 'Early Bird Discount',
        category: 'coupon',
        performedBy: 'manager@company.com',
        details: 'Created new discount rule for early bookings',
        ipAddress: '172.16.0.25',
        userAgent: 'Safari/16.6'
      },
      {
        id: 'log-004',
        timestamp: '2024-01-14 09:20:33',
        action: 'deleted',
        ruleName: 'Test Rule',
        category: 'markup',
        performedBy: 'developer@company.com',
        details: 'Removed test rule after development',
        ipAddress: '192.168.1.200',
        userAgent: 'Edge/120.0.0.0'
      },
      {
        id: 'log-005',
        timestamp: '2024-01-13 18:12:18',
        action: 'updated',
        ruleName: 'Group Booking Discount',
        category: 'coupon',
        performedBy: 'supervisor@company.com',
        details: 'Modified group size threshold from 5 to 10',
        ipAddress: '10.0.1.75',
        userAgent: 'Chrome/120.0.0.0'
      }
    ];

    // Simulate API call
    setTimeout(() => {
      setLogs(mockLogs);
      setIsLoading(false);
    }, 1000);
  }, [category]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    const matchesCategory = log.category === category;

    return matchesSearch && matchesAction && matchesCategory;
  });

  // Compute most active user
  const activityCounts: Record<string, number> = filteredLogs.reduce((acc, log) => {
    acc[log.performedBy] = (acc[log.performedBy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostActive = Object.entries(activityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      case 'activated': return 'bg-purple-100 text-purple-800';
      case 'deactivated': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Eye className="h-4 w-4" />;
      case 'updated': return <Eye className="h-4 w-4" />;
      case 'deleted': return <EyeOff className="h-4 w-4" />;
      case 'activated': return <Eye className="h-4 w-4" />;
      case 'deactivated': return <EyeOff className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Audit Log - {category.toUpperCase()}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              {logs.length} total entries
            </Badge>
            <Badge variant="outline">
              {filteredLogs.length} filtered
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by rule name, user, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
              <SelectItem value="activated">Activated</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[140px]">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found for this category.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {log.timestamp}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`${getActionColor(log.action)} flex items-center gap-1`}>
                        {getActionIcon(log.action)}
                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">{log.ruleName}</div>
                      <div className="text-xs text-muted-foreground">{log.category}</div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span className="text-sm">{log.performedBy}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm max-w-md truncate" title={log.details}>
                        {log.details}
                      </div>
                    </TableCell>
                    
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>{log.ipAddress}</span>
                        <span className="text-xs">({log.userAgent.split('/')[0]})</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        {filteredLogs.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Actions</p>
                    <p className="text-2xl font-bold">{filteredLogs.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Users</p>
                    <p className="text-2xl font-bold text-green-600">
                      {new Set(filteredLogs.map(log => log.performedBy)).size}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Most Active</p>
                    <p className="text-lg font-semibold truncate">
                      {mostActive}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recent Activity</p>
                    <p className="text-lg font-semibold">
                      {filteredLogs[0]?.timestamp.split(' ')[0]}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};