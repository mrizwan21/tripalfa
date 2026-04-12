import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tripalfa/ui-components/ui/card';
import { Button } from '@tripalfa/ui-components/ui/button';
import { Badge } from '@tripalfa/ui-components/ui/badge';
import PaymentService from '../../../services/PaymentService.js';
import type { VirtualCardData } from '../../../services/PaymentService.js';

export default function VirtualCardsPage() {
  const [virtualCards, setVirtualCards] = useState<VirtualCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVirtualCards();
  }, []);

  const loadVirtualCards = async () => {
    try {
      setLoading(true);
      const cards = await PaymentService.getVirtualCards();
      setVirtualCards(cards);
    } catch (err) {
      console.error('Error loading virtual cards:', err);
      setError('Failed to load virtual cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async () => {
    try {
      await PaymentService.createVirtualCard({
        cardholderName: 'Test User',
        currency: 'USD',
        spendingLimit: 1000,
        cardType: 'debit',
        usageType: 'business',
      });
      loadVirtualCards(); // Reload cards
    } catch (err) {
      console.error('Error creating virtual card:', err);
      setError('Failed to create virtual card');
    }
  };

  if (loading) {
    return <div className="p-6">Loading virtual cards...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Virtual Cards</h2>
          <p className="text-muted-foreground mt-1">Manage your virtual payment cards</p>
        </div>
        <Button onClick={handleCreateCard}>Create New Card</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {virtualCards.map(card => (
          <Card key={card.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-0 gap-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{card.cardholderName}</CardTitle>
                <Badge variant={card.isActive ? 'default' : 'secondary'}>
                  {card.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription>
                {card.cardType} • {card.usageType}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Currency:</span>
                  <span className="font-medium">{card.currency}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Spending Limit:</span>
                  <span className="font-medium">${card.spendingLimit}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={card.isBlocked ? 'destructive' : 'default'}>
                    {card.isBlocked ? 'Blocked' : card.status}
                  </Badge>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="text-sm">{new Date(card.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {virtualCards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No virtual cards found. Create your first card to get started.
          </p>
        </div>
      )}
    </div>
  );
}
