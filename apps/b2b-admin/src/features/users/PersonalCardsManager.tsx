import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, CreditCard, Edit, Trash2, Check, Star, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

export interface PersonalCard {
    id: string;
    cardType: 'credit' | 'debit';
    cardNumber: string;
    expiryDate: string;
    cardholderName: string;
    brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
    isDefault: boolean;
    billingAddress?: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
    };
}

const cardSchema = z.object({
    cardType: z.enum(['credit', 'debit']),
    cardNumber: z.string().min(16, "Card number required").max(19),
    expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Format: MM/YY"),
    cardholderName: z.string().min(3, "Cardholder name required"),
    cvv: z.string().min(3).max(4).optional(),
    isDefault: z.boolean(),
    billingStreet: z.string().optional(),
    billingCity: z.string().optional(),
    billingCountry: z.string().optional(),
    billingPostalCode: z.string().optional(),
});

type CardFormValues = z.infer<typeof cardSchema>;

interface PersonalCardsManagerProps {
    cards: PersonalCard[];
    onAdd: (card: Omit<PersonalCard, 'id'>) => void;
    onEdit: (id: string, card: Partial<PersonalCard>) => void;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
}

export function PersonalCardsManager({ cards, onAdd, onEdit, onDelete, onSetDefault }: PersonalCardsManagerProps) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingCard, setEditingCard] = React.useState<PersonalCard | null>(null);
    const [showCVV, setShowCVV] = React.useState(false);

    const form = useForm<CardFormValues>({
        resolver: zodResolver(cardSchema),
        defaultValues: {
            cardType: 'credit',
            cardNumber: '',
            expiryDate: '',
            cardholderName: '',
            cvv: '',
            isDefault: false,
            billingStreet: '',
            billingCity: '',
            billingCountry: '',
            billingPostalCode: '',
        },
    });

    React.useEffect(() => {
        if (editingCard) {
            form.reset({
                cardType: editingCard.cardType,
                cardNumber: editingCard.cardNumber.replace(/\s/g, ''),
                expiryDate: editingCard.expiryDate,
                cardholderName: editingCard.cardholderName,
                isDefault: editingCard.isDefault,
                billingStreet: editingCard.billingAddress?.street || '',
                billingCity: editingCard.billingAddress?.city || '',
                billingCountry: editingCard.billingAddress?.country || '',
                billingPostalCode: editingCard.billingAddress?.postalCode || '',
            });
        } else {
            form.reset({
                cardType: 'credit',
                cardNumber: '',
                expiryDate: '',
                cardholderName: '',
                cvv: '',
                isDefault: cards.length === 0,
                billingStreet: '',
                billingCity: '',
                billingCountry: '',
                billingPostalCode: '',
            });
        }
    }, [editingCard, form, cards.length]);

    const detectCardBrand = (number: string): PersonalCard['brand'] => {
        const cleanNumber = number.replace(/\s/g, '');
        if (/^4/.test(cleanNumber)) return 'visa';
        if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
        if (/^3[47]/.test(cleanNumber)) return 'amex';
        if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
        return 'other';
    };

    const formatCardNumber = (value: string) => {
        return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    };

    const maskCardNumber = (number: string) => {
        const clean = number.replace(/\s/g, '');
        return '**** **** **** ' + clean.slice(-4);
    };

    const getCardGradient = (brand: PersonalCard['brand']) => {
        const gradients: Record<string, string> = {
            visa: 'from-blue-600 to-blue-800',
            mastercard: 'from-red-500 to-orange-500',
            amex: 'from-gray-600 to-gray-800',
            discover: 'from-orange-400 to-orange-600',
            other: 'from-gray-700 to-gray-900',
        };
        return gradients[brand] || gradients.other;
    };

    const handleSubmit = (values: CardFormValues) => {
        const cardData: Omit<PersonalCard, 'id'> = {
            cardType: values.cardType,
            cardNumber: formatCardNumber(values.cardNumber),
            expiryDate: values.expiryDate,
            cardholderName: values.cardholderName.toUpperCase(),
            brand: detectCardBrand(values.cardNumber),
            isDefault: values.isDefault,
            billingAddress: values.billingStreet ? {
                street: values.billingStreet,
                city: values.billingCity || '',
                country: values.billingCountry || '',
                postalCode: values.billingPostalCode || '',
            } : undefined,
        };

        if (editingCard) {
            onEdit(editingCard.id, cardData);
        } else {
            onAdd(cardData);
        }
        setIsModalOpen(false);
        toast.success(editingCard ? 'Card updated' : 'Card added');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Payment Cards</h3>
                    <p className="text-sm text-gray-500">Manage your personal credit and debit cards</p>
                </div>
                <Button onClick={() => { setEditingCard(null); setIsModalOpen(true); }} className="rounded-xl bg-gray-900 hover:bg-primary font-bold">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                </Button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <Card key={card.id} className="border-none shadow-lg rounded-2xl overflow-hidden">
                        {/* Card Design */}
                        <div className={`h-48 bg-gradient-to-br ${getCardGradient(card.brand)} p-5 flex flex-col justify-between text-white relative`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <Badge className={`${card.cardType === 'credit' ? 'bg-white/20' : 'bg-green-500/80'} text-white border-none capitalize`}>
                                        {card.cardType}
                                    </Badge>
                                </div>
                                <div className="flex gap-1">
                                    {card.isDefault && (
                                        <Badge className="bg-yellow-400 text-yellow-900 border-none">
                                            <Star className="h-3 w-3 mr-1 fill-current" />
                                            Default
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="relative z-10 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-white/60" />
                                    <p className="font-mono text-lg tracking-wider">{maskCardNumber(card.cardNumber)}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-white/60">Cardholder</p>
                                        <p className="font-medium text-sm">{card.cardholderName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-white/60">Expires</p>
                                        <p className="font-medium">{card.expiryDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold uppercase">{card.brand}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <CardContent className="p-4 bg-white flex justify-between items-center">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => { setEditingCard(card); setIsModalOpen(true); }}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-lg text-red-500 hover:text-red-600" onClick={() => onDelete(card.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            {!card.isDefault && (
                                <Button variant="ghost" size="sm" className="text-primary font-medium" onClick={() => onSetDefault(card.id)}>
                                    <Check className="h-4 w-4 mr-1" />
                                    Set Default
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {cards.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No payment cards added yet</p>
                        <Button variant="link" onClick={() => { setEditingCard(null); setIsModalOpen(true); }}>
                            Add your first card
                        </Button>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            {editingCard ? 'Edit Card' : 'Add Payment Card'}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="cardType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Card Type</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-3">
                                            <Button
                                                type="button"
                                                variant={field.value === 'credit' ? 'default' : 'outline'}
                                                className={`flex-1 rounded-xl ${field.value === 'credit' ? 'bg-gray-900' : ''}`}
                                                onClick={() => field.onChange('credit')}
                                            >
                                                Credit Card
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={field.value === 'debit' ? 'default' : 'outline'}
                                                className={`flex-1 rounded-xl ${field.value === 'debit' ? 'bg-gray-900' : ''}`}
                                                onClick={() => field.onChange('debit')}
                                            >
                                                Debit Card
                                            </Button>
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="cardNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Card Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="1234 5678 9012 3456"
                                            maxLength={19}
                                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                            className="h-11 font-mono"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="expiryDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Expiry Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="MM/YY"
                                                maxLength={5}
                                                onChange={(e) => {
                                                    let value = e.target.value.replace(/\D/g, '');
                                                    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                                                    field.onChange(value.slice(0, 5));
                                                }}
                                                className="h-11" /> </FormControl> <FormMessage /> </FormItem> )} /> {!editingCard && ( <FormField control={form.control} name="cvv" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">CVV</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        type={showCVV ? 'text' : 'password'}
                                                        placeholder="***"
                                                        maxLength={4}
                                                        className="h-11 pr-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-1 top-1 h-9 w-9"
                                                        onClick={() => setShowCVV(!showCVV)}
                                                    >
                                                        {showCVV ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}
                            </div>

                            <FormField control={form.control} name="cardholderName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Cardholder Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="JOHN DOE" className="h-11 uppercase" onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="isDefault" render={({ field }) => (
                                <FormItem className="flex items-center gap-3 space-y-0 bg-gray-50 rounded-xl p-4">
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="h-5 w-5 rounded-md border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </FormControl>
                                    <div>
                                        <FormLabel className="font-bold text-gray-700">Set as default payment method</FormLabel>
                                        <p className="text-xs text-gray-500">This card will be used for automatic payments</p>
                                    </div>
                                </FormItem>
                            )} />

                            <div className="border-t pt-4">
                                <p className="text-sm font-bold text-gray-700 mb-3">Billing Address (Optional)</p>
                                <div className="space-y-3">
                                    <FormField control={form.control} name="billingStreet" render={({ field }) => (
                                        <FormControl><Input {...field} placeholder="Street address" className="h-10" /></FormControl>
                                    )} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField control={form.control} name="billingCity" render={({ field }) => (
                                            <FormControl><Input {...field} placeholder="City" className="h-10" /></FormControl>
                                        )} />
                                        <FormField control={form.control} name="billingCountry" render={({ field }) => (
                                            <FormControl><Input {...field} placeholder="Country" className="h-10" /></FormControl>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="billingPostalCode" render={({ field }) => (
                                        <FormControl><Input {...field} placeholder="Postal code" className="h-10 w-1/2" /></FormControl>
                                    )} />
                                </div>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-gray-900 hover:bg-primary rounded-xl font-bold">
                                    {editingCard ? 'Update Card' : 'Add Card'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default PersonalCardsManager;
