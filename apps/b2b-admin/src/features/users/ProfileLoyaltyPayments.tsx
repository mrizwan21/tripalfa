import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Award, Plus, MoreVertical, ShieldCheck, Landmark, Edit2, Trash2 } from 'lucide-react';
import { LoyaltyProgram, PaymentCard } from './types';
import { CreditCardDialog } from './dialogs/CreditCardDialog';
import { LoyaltyProgramDialog } from './dialogs/LoyaltyProgramDialog';

interface Props {
    loyaltyPrograms: LoyaltyProgram[];
    paymentCards: PaymentCard[];
    onUpdateLoyalty: (programs: LoyaltyProgram[]) => void;
    onUpdateCards: (cards: PaymentCard[]) => void;
}

export function ProfileLoyaltyPayments({ loyaltyPrograms, paymentCards, onUpdateLoyalty, onUpdateCards }: Props) {
    const [isLoyaltyDialogOpen, setIsLoyaltyDialogOpen] = useState(false);
    const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
    const [editingLoyalty, setEditingLoyalty] = useState<LoyaltyProgram | undefined>(undefined);
    const [editingCard, setEditingCard] = useState<PaymentCard | undefined>(undefined);

    // --- Card Logic ---
    const handleAddCard = () => {
        setEditingCard(undefined);
        setIsCardDialogOpen(true);
    };
    const handleEditCard = (card: PaymentCard) => {
        setEditingCard(card);
        setIsCardDialogOpen(true);
    };
    const handleDeleteCard = (id: string) => {
        if (window.confirm('Delete this card?')) {
            onUpdateCards(paymentCards.filter(c => c.id !== id));
        }
    };
    const handleSaveCard = (data: Partial<PaymentCard>) => {
        let newCards = [...paymentCards];
        if (editingCard) {
            newCards = newCards.map(c => c.id === editingCard.id ? { ...c, ...data } as PaymentCard : c);
        } else {
            const newCard = { ...data, id: `card-${Date.now()}` } as PaymentCard;
            newCards.push(newCard);
        }
        onUpdateCards(newCards);
        setIsCardDialogOpen(false);
        setEditingCard(undefined);
    };

    // --- Loyalty Logic ---
    const handleAddLoyalty = () => {
        setEditingLoyalty(undefined);
        setIsLoyaltyDialogOpen(true);
    };
    const handleEditLoyalty = (prog: LoyaltyProgram) => {
        setEditingLoyalty(prog);
        setIsLoyaltyDialogOpen(true);
    };
    const handleDeleteLoyalty = (id: string) => {
        if (window.confirm('Delete this loyalty program?')) {
            onUpdateLoyalty(loyaltyPrograms.filter(p => p.id !== id));
        }
    };
    const handleSaveLoyalty = (data: Partial<LoyaltyProgram>) => {
        let newProgs = [...loyaltyPrograms];
        if (editingLoyalty) {
            newProgs = newProgs.map(p => p.id === editingLoyalty.id ? { ...p, ...data } as LoyaltyProgram : p);
        } else {
            const newProg = { ...data, id: `loy-${Date.now()}` } as LoyaltyProgram;
            newProgs.push(newProg);
        }
        onUpdateLoyalty(newProgs);
        setIsLoyaltyDialogOpen(false);
        setEditingLoyalty(undefined);
    };

    const getCardIcon = (type: string) => {
        return <Landmark className="h-6 w-6 text-white" />;
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Loyalty Programs */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-8 border-b border-gray-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Award className="h-6 w-6 text-amber-500" />
                                Loyalty Programs
                            </CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleAddLoyalty} className="rounded-xl hover:bg-amber-50 text-amber-600">
                            <Plus className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {loyaltyPrograms.map((program) => (
                            <div key={program.id} className="group relative flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-amber-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <Award className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{program.provider}</p>
                                        <p className="text-xs font-bold text-gray-500">{program.membershipNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 uppercase text-[10px] font-bold">
                                        {program.type}
                                    </Badge>
                                    <div className="hidden group-hover:flex ml-2">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditLoyalty(program)}>
                                            <Edit2 className="h-3 w-3 text-gray-400" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400 hover:text-rose-600" onClick={() => handleDeleteLoyalty(program.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loyaltyPrograms.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-500 font-medium">No loyalty programs added</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Cards */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-8 border-b border-gray-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <CreditCard className="h-6 w-6 text-blue-600" />
                                Stored Cards
                            </CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleAddCard} className="rounded-xl hover:bg-blue-50 text-blue-600">
                            <Plus className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {paymentCards.map((card) => (
                            <div key={card.id} className="relative h-40 w-full rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 p-6 text-white shadow-lg overflow-hidden group">
                                <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all" />
                                <div className="flex justify-between items-start">
                                    {getCardIcon(card.type)}
                                    <div className="flex items-center gap-1 z-10">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={() => handleEditCard(card)}>
                                            <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white hover:bg-rose-500/20" onClick={() => handleDeleteCard(card.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-xs font-black tracking-widest opacity-80">{card.type}</p>
                                    <p className="text-lg font-bold tracking-[0.2em] mt-1">{card.cardNumberMasked}</p>
                                </div>
                                <div className="mt-4 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-blue-200">Card Holder</p>
                                        <p className="text-sm font-bold uppercase">{card.nameOnCard}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-blue-200">Expires</p>
                                        <p className="text-sm font-bold">{card.expiry}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {paymentCards.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-500 font-medium">No payment methods stored</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <CreditCardDialog
                open={isCardDialogOpen}
                onOpenChange={setIsCardDialogOpen}
                initialData={editingCard}
                onSave={handleSaveCard}
            />
            <LoyaltyProgramDialog
                open={isLoyaltyDialogOpen}
                onOpenChange={setIsLoyaltyDialogOpen}
                initialData={editingLoyalty}
                onSave={handleSaveLoyalty}
            />
        </>
    );
}
