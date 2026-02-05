import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Percent, 
  DollarSign, 
  Gift, 
  Plane, 
  Users 
} from 'lucide-react';

interface RuleCategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  disabled?: boolean;
}

export const RuleCategorySelector: React.FC<RuleCategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  disabled = false
}) => {
  const categories = [
    {
      id: 'markup',
      name: 'Markup Rules',
      description: 'Manage markup percentages and rules',
      icon: Percent,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'commission',
      name: 'Commission Rules',
      description: 'Manage commission structures',
      icon: DollarSign,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'coupon',
      name: 'Coupon Rules',
      description: 'Manage discount coupons',
      icon: Gift,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'airline_deal',
      name: 'Airline Deals',
      description: 'Manage airline-specific deals',
      icon: Plane,
      color: 'bg-orange-100 text-orange-800'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Select Rule Category</h2>
          <p className="text-sm text-muted-foreground">
            Choose the type of rules you want to manage
          </p>
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => onCategoryChange(category.id)}
              disabled={disabled}
              className="flex items-center gap-2" > <category.icon className="h-4 w-4" />
              {category.name}
              {selectedCategory === category.id && (
                <Badge variant="secondary" className="ml-2">Active</Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedCategory === category.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onCategoryChange(category.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${category.color}`}>
                  <category.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
              {selectedCategory === category.id && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-xs font-medium text-primary">Selected</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};