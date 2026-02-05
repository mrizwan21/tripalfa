import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Search, Edit, Trash2, Plus, Filter } from 'lucide-react';
import type { RuleCategory, RuleType } from '../../types/ruleManagement';

interface RuleListProps {
  category: RuleCategory;
  onEditRule: (rule: RuleType) => void;
  onDeleteRule: (rule: RuleType) => void;
  refreshKey?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const RuleList: React.FC<RuleListProps> = ({
  category,
  onEditRule,
  onDeleteRule,
  refreshKey = 0,
  canEdit = true,
  canDelete = true
}) => {
  // Mock data for demonstration
  const mockRules: RuleType[] = [
    {
      id: 'rule-1',
      name: 'Weekend Markup',
      description: 'Additional markup for weekend bookings',
      category: 'markup',
      status: 'active',
      priority: 1,
      conditions: [],
      actions: [],
      metadata: { version: '1.0.0', tags: ['weekend', 'markup'] },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      createdBy: 'admin',
      updatedBy: 'admin'
    },
    {
      id: 'rule-2',
      name: 'Corporate Commission',
      description: 'Commission structure for corporate clients',
      category: 'commission',
      status: 'active',
      priority: 2,
      conditions: [],
      actions: [],
      metadata: { version: '1.0.0', tags: ['corporate', 'commission'] },
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-10'),
      createdBy: 'admin',
      updatedBy: 'admin'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: RuleCategory) => {
    switch (category) {
      case 'markup': return '📈';
      case 'commission': return '💰';
      case 'coupon': return '🎫';
      case 'airline_deal': return '✈️';
      default: return '📋';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">{getCategoryIcon(category)}</span>
            {category.charAt(0).toUpperCase() + category.slice(1)} Rules
            <Badge variant="outline" className="ml-2">
              {mockRules.length} rules
            </Badge>
          </CardTitle>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search rules..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {mockRules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{rule.name}</h3>
                  <Badge className={getStatusColor(rule.status)}>
                    {rule.status}
                  </Badge>
                  <Badge variant="secondary">Priority: {rule.priority}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rule.description}</p>
                <div className="flex flex-wrap gap-2">
                  {rule.metadata.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 sm:items-end">
                <div className="text-xs text-muted-foreground">
                  Created: {rule.createdAt.toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditRule(rule)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteRule(rule)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {mockRules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No rules found for {category}. Create your first rule to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};