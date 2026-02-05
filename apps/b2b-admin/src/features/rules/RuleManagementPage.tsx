import React, { useState, useEffect } from 'react';
import { useRulePermissions } from '../../hooks/useRulePermissions';
import { RulePermissionGuard } from '../../components/RulePermissionGuard';
import { 
  RulePermissionUtils, 
  PermissionValidator 
} from '../../utils/rulePermissions';
import { RULE_PERMISSIONS } from '../../types/rulePermissions';

// Import rule types and components
import type { RuleCategory, RuleType } from '../../types/ruleManagement';
import { RuleCategorySelector } from './RuleCategorySelector';
import { RuleList } from './RuleList';
import { RuleForm } from './RuleForm';
import { RuleAnalytics } from './RuleAnalytics';
import { RuleAuditLog } from './RuleAuditLog';

// Import UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Shield, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';

interface RuleManagementPageProps {
  initialCategory?: RuleCategory;
}

export const RuleManagementPage: React.FC<RuleManagementPageProps> = ({
  initialCategory = 'markup'
}) => {
  const [activeTab, setActiveTab] = useState('rules');
  const [selectedCategory, setSelectedCategory] = useState<RuleCategory>(initialCategory);
  const [selectedRule, setSelectedRule] = useState<RuleType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Permission hooks
  const {
    canViewRules,
    canCreateRules,
    canUpdateRules,
    canDeleteRules,
    isLoading: permissionsLoading,
    error: permissionError
  } = useRulePermissions();

  // Permission utilities
  const canManageCategory = RulePermissionUtils.canManageCategory(
    [], // Will be populated by hook
    selectedCategory
  );

  const handleCategoryChange = (category: any) => {
    setSelectedCategory(category as RuleCategory);
    setSelectedRule(null);
    setIsFormOpen(false);
  };

  const handleCreateRule = () => {
    setSelectedRule(null);
    setIsFormOpen(true);
  };

  const handleEditRule = (rule: RuleType) => {
    setSelectedRule(rule);
    setIsFormOpen(true);
  };

  const handleDeleteRule = (rule: RuleType) => {
    // Implementation for rule deletion
    console.log('Delete rule:', rule);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedRule(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (permissionError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading permissions: {permissionError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rule Management</h1>
          <p className="text-muted-foreground">
            Manage markup, commission, coupon, and airline deal rules
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={permissionsLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {canCreateRules && (
            <Button onClick={handleCreateRule}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          )}
        </div>
      </div>

      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={canViewRules ? "default" : "secondary"}>
                View Rules
              </Badge>
              <span className="text-sm text-muted-foreground">
                {canViewRules ? "Allowed" : "Restricted"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={canCreateRules ? "default" : "secondary"}>
                Create Rules
              </Badge>
              <span className="text-sm text-muted-foreground">
                {canCreateRules ? "Allowed" : "Restricted"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={canUpdateRules ? "default" : "secondary"}>
                Edit Rules
              </Badge>
              <span className="text-sm text-muted-foreground">
                {canUpdateRules ? "Allowed" : "Restricted"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={canDeleteRules ? "default" : "secondary"}>
                Delete Rules
              </Badge>
              <span className="text-sm text-muted-foreground">
                {canDeleteRules ? "Allowed" : "Restricted"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Selector */}
      <RulePermissionGuard
        permissions={[
          RULE_PERMISSIONS.MARKUP_VIEW,
          RULE_PERMISSIONS.COMMISSION_VIEW,
          RULE_PERMISSIONS.COUPON_VIEW,
          RULE_PERMISSIONS.AIRLINE_DEAL_VIEW
        ]}
        fallback={
          <Alert>
            <AlertDescription>
              You don't have permission to view any rule categories.
            </AlertDescription>
          </Alert>
        }
      >
        <RuleCategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          disabled={!canViewRules}
        />
      </RulePermissionGuard>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <RulePermissionGuard
            permissions={[
              RULE_PERMISSIONS.MARKUP_VIEW,
              RULE_PERMISSIONS.COMMISSION_VIEW,
              RULE_PERMISSIONS.COUPON_VIEW,
              RULE_PERMISSIONS.AIRLINE_DEAL_VIEW
            ]}
            fallback={
              <Alert>
                <AlertDescription>
                  You don't have permission to view rules.
                </AlertDescription>
              </Alert>
            }
          >
              <RuleList
              category={selectedCategory}
              onEditRule={handleEditRule}
              onDeleteRule={handleDeleteRule}
              refreshKey={refreshKey}
              canEdit={canUpdateRules}
              canDelete={canDeleteRules}
            />
          </RulePermissionGuard>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <RulePermissionGuard
            permissions={[RULE_PERMISSIONS.RULE_AUDIT]}
            fallback={
              <Alert>
                <AlertDescription>
                  You don't have permission to view rule analytics.
                </AlertDescription>
              </Alert>
            }
          >
            <RuleAnalytics category={selectedCategory} />
          </RulePermissionGuard>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <RulePermissionGuard
            permissions={[RULE_PERMISSIONS.RULE_AUDIT]}
            fallback={
              <Alert>
                <AlertDescription>
                  You don't have permission to view audit logs.
                </AlertDescription>
              </Alert>
            }
          >
            <RuleAuditLog category={selectedCategory} />
          </RulePermissionGuard>
        </TabsContent>
      </Tabs>

      {/* Rule Form Modal */}
      {isFormOpen && (
        <RulePermissionGuard
          permissions={selectedRule ? [RULE_PERMISSIONS.MARKUP_EDIT] : [RULE_PERMISSIONS.MARKUP_CREATE]}
          fallback={
            <Alert variant="destructive">
              <AlertDescription>
                You don't have permission to {selectedRule ? 'edit' : 'create'} rules.
              </AlertDescription>
            </Alert>
          }
        >
          <RuleForm
            category={selectedCategory}
            rule={selectedRule}
            onClose={handleFormClose}
          />
        </RulePermissionGuard>
      )}
    </div>
  );
};

export default RuleManagementPage;