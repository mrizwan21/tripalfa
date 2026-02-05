import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { X, Plus, Save, ArrowLeft } from 'lucide-react';
import type { RuleCategory, RuleType } from '../../types/ruleManagement';

interface RuleFormProps {
  category: RuleCategory;
  rule?: RuleType | null;
  onClose: () => void;
}

export const RuleForm: React.FC<RuleFormProps> = ({
  category,
  rule = null,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    status: rule?.status || 'active',
    priority: rule?.priority || 1,
    conditions: rule?.conditions || [],
    actions: rule?.actions || []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Mock API call
      console.log('Submitting rule:', { ...formData, category });
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error submitting rule:', error);
      setIsSubmitting(false);
    }
  };

  const handleAddCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: 'equals', value: '', logic: 'and' }]
    }));
  };

  const handleAddAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: 'apply_markup', parameters: {} }]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {rule ? 'Edit Rule' : 'Create New Rule'} - {category.toUpperCase()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure rule settings and conditions for {category} rules
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              Category: {category}
            </Badge>
            <Badge variant="secondary">
              Priority: {formData.priority}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter rule name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this rule does"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Conditions</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCondition}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Condition
                </Button>
              </div>
              
              {formData.conditions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  No conditions defined. Click "Add Condition" to create rule conditions.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <Input
                          placeholder="Field"
                          value={condition.field}
                          onChange={(e) => {
                            const newConditions = [...formData.conditions];
                            newConditions[index].field = e.target.value;
                            setFormData(prev => ({ ...prev, conditions: newConditions }));
                          }}
                        />
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => {
                            const newConditions = [...formData.conditions];
                            newConditions[index].operator = value as any;
                            setFormData(prev => ({ ...prev, conditions: newConditions }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="in">In</SelectItem>
                            <SelectItem value="not_in">Not In</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Value"
                          value={condition.value}
                          onChange={(e) => {
                            const newConditions = [...formData.conditions];
                            newConditions[index].value = e.target.value;
                            setFormData(prev => ({ ...prev, conditions: newConditions }));
                          }}
                        />
                        <Select
                          value={condition.logic}
                          onValueChange={(value) => {
                            const newConditions = [...formData.conditions];
                            newConditions[index].logic = value as any;
                            setFormData(prev => ({ ...prev, conditions: newConditions }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Logic" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="and">AND</SelectItem>
                            <SelectItem value="or">OR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newConditions = formData.conditions.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, conditions: newConditions }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Actions</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAction}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Action
                </Button>
              </div>
              
              {formData.actions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  No actions defined. Click "Add Action" to create rule actions.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex gap-2 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Select
                          value={action.type}
                          onValueChange={(value) => {
                            const newActions = [...formData.actions];
                            newActions[index].type = value as any;
                            setFormData(prev => ({ ...prev, actions: newActions }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Action Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apply_markup">Apply Markup</SelectItem>
                            <SelectItem value="apply_commission">Apply Commission</SelectItem>
                            <SelectItem value="apply_discount">Apply Discount</SelectItem>
                            <SelectItem value="block_booking">Block Booking</SelectItem>
                            <SelectItem value="require_approval">Require Approval</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Parameters"
                          value={JSON.stringify(action.parameters)}
                          onChange={(e) => {
                            const newActions = [...formData.actions];
                            try {
                              newActions[index].parameters = JSON.parse(e.target.value);
                            } catch {
                              newActions[index].parameters = {};
                            }
                            setFormData(prev => ({ ...prev, actions: newActions }));
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newActions = formData.actions.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, actions: newActions }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {rule ? 'Update Rule' : 'Create Rule'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};