import React, { useState } from 'react';
import { X, Utensils, Check, Plus, Info } from 'lucide-react';
import { Button } from './ui/button';
import { formatCurrency } from '@tripalfa/ui-components';

interface MealSelectionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (meals: any[]) => void;
    isLCC?: boolean;
    availableServices?: any[];
    /** Number of passengers – drives the passenger selector. Defaults to 1. */
    passengerCount?: number;
}

export const MealSelectionPopup = ({ isOpen, onClose, onConfirm, isLCC = false, availableServices, passengerCount = 1 }: MealSelectionPopupProps) => {
    const [selectedPassenger, setSelectedPassenger] = useState(1);

    // Mock meals based on carrier type
    const fscMeals = [
        { id: 'm1', name: 'Vegetarian Hindu Meal (AVML)', price: 0, description: 'Spicy vegetarian meal with no meat/eggs' },
        { id: 'm2', name: 'Muslim Meal (MOML)', price: 0, description: 'Prepared according to Islamic dietary laws' },
        { id: 'm3', name: 'Gluten-Free Meal (GFML)', price: 0, description: 'Eliminates all gluten proteins' },
        { id: 'm4', name: 'Fruit Platter (FPML)', price: 0, description: 'Fresh seasonal fruits only' }
    ];

    const lccMeals = [
        { id: 'l1', name: 'Hot Chicken Biryani', price: 15, description: 'Traditional spicy rice dish with chicken' },
        { id: 'l2', name: 'Club Sandwich & Soda', price: 10, description: 'Fresh chicken club sandwich with a drink' },
        { id: 'l3', name: 'Pasta Primavera', price: 12, description: 'Italian pasta with seasonal vegetables' },
        { id: 'l4', name: 'Breakfast Combo', price: 8, description: 'Omelette, hash browns and coffee' }
    ];

    // Map real meals from availableServices
    const dynamicMeals = (availableServices || [])
        .filter((s: any) => s.type === 'meal')
        .map((s: any) => ({
            id: s.id,
            name: s.metadata?.name || 'In-Flight Meal',
            price: parseFloat(s.total_amount),
            description: s.metadata?.description || 'Delicious meal option for your journey'
        }));

    // Fallback to defaults if no dynamic meals
    const meals = dynamicMeals.length > 0 ? dynamicMeals : (isLCC ? lccMeals : fscMeals);
    const [selections, setSelections] = useState<{ [key: number]: string }>({});

    if (!isOpen) return null;

    // Generate passenger list from count – no hardcoded names
    const passengers = Array.from({ length: Math.max(1, passengerCount) }, (_, i) => ({
        id: i + 1,
        label: `Passenger ${i + 1}`,
    }));

    const handleSelectMeal = (mealId: string) => {
        setSelections(prev => ({
            ...prev,
            [selectedPassenger]: mealId
        }));
    };

    const currentSelection = selections[selectedPassenger];
    const totalAmount = Object.values(selections).reduce((sum: number, mealId: string) => {
        const meal = meals.find((m: any) => m.id === mealId);
        return sum + (meal?.price || 0);
    }, 0);

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100 flex flex-col max-h-[90vh]">

                <div className="p-8 text-center relative border-b border-gray-50">
                    <h2 className="text-2xl font-black text-gray-900">In-Flight Meals</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {isLCC ? 'Pre-book your favorite meal' : 'Select your dietary preference'}
                    </p>
                    <button onClick={onClose} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {/* Passenger Selection – generic "Passenger N" labels */}
                    <div className="flex justify-center gap-3 flex-wrap">
                        {passengers.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPassenger(p.id)}
                                className={`px-6 h-12 rounded-[2rem] flex items-center gap-3 border transition-all ${selectedPassenger === p.id
                                    ? 'bg-[#FFD700] border-[#FFD700] shadow-lg text-gray-900'
                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                    }`}
                            >
                                {/* Numbered avatar circle */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${selectedPassenger === p.id ? 'bg-gray-900 text-white' : 'bg-purple-100 text-purple-600'}`}>
                                    {p.id}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                                {/* Tick if a meal was selected for this passenger */}
                                {selections[p.id] && (
                                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                        <Check size={10} className="text-white stroke-[3px]" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {meals.map((meal) => {
                            const isSelected = currentSelection === meal.id;
                            return (
                                <div
                                    key={meal.id}
                                    onClick={() => handleSelectMeal(meal.id)}
                                    className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all flex items-center gap-6 group ${isSelected
                                        ? 'border-[#8B5CF6] bg-purple-50/50'
                                        : 'border-gray-50 hover:border-gray-200 bg-white'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-[#8B5CF6] text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}>
                                        <Utensils size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{meal.name}</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-tight mt-1">{meal.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${meal.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {meal.price === 0 ? 'FREE' : formatCurrency(meal.price)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-8 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Items</p>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(totalAmount)}</p>
                    </div>
                    <Button
                        onClick={() => {
                            const selectedMeals = Object.entries(selections)
                                .map(([pId, mId]) => {
                                    const meal = meals.find(m => m.id === mId);
                                    return { passengerId: pId, ...meal };
                                })
                                .filter(m => !!m.id);
                            onConfirm(selectedMeals);
                        }}
                        className="bg-[#111827] hover:bg-black text-white px-10 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1"
                    >
                        Confirm Meals
                    </Button>
                </div>
            </div>
        </div>
    );
};
