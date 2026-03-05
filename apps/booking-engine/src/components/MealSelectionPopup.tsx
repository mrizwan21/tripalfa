import React, { useState } from "react";
import { X, Utensils, Check, Plus, Info } from "lucide-react";
import { Button } from "@tripalfa/ui-components";
import { formatCurrency } from "@tripalfa/ui-components";

interface MealSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (meals: any[]) => void;
  isLCC?: boolean;
  availableServices?: any[];
  /** Number of passengers – drives the passenger selector. Defaults to 1. */
  passengerCount?: number;
}

export const MealSelectionPopup = ({
  isOpen,
  onClose,
  onConfirm,
  isLCC = false,
  availableServices,
  passengerCount = 1,
}: MealSelectionPopupProps) => {
  const [selectedPassenger, setSelectedPassenger] = useState(1);

  // Mock meals based on carrier type
  const fscMeals = [
    {
      id: "m1",
      name: "Vegetarian Hindu Meal (AVML)",
      price: 0,
      description: "Spicy vegetarian meal with no meat/eggs",
    },
    {
      id: "m2",
      name: "Muslim Meal (MOML)",
      price: 0,
      description: "Prepared according to Islamic dietary laws",
    },
    {
      id: "m3",
      name: "Gluten-Free Meal (GFML)",
      price: 0,
      description: "Eliminates all gluten proteins",
    },
    {
      id: "m4",
      name: "Fruit Platter (FPML)",
      price: 0,
      description: "Fresh seasonal fruits only",
    },
  ];

  const lccMeals = [
    {
      id: "l1",
      name: "Hot Chicken Biryani",
      price: 15,
      description: "Traditional spicy rice dish with chicken",
    },
    {
      id: "l2",
      name: "Club Sandwich & Soda",
      price: 10,
      description: "Fresh chicken club sandwich with a drink",
    },
    {
      id: "l3",
      name: "Pasta Primavera",
      price: 12,
      description: "Italian pasta with seasonal vegetables",
    },
    {
      id: "l4",
      name: "Breakfast Combo",
      price: 8,
      description: "Omelette, hash browns and coffee",
    },
  ];

  // Map real meals from availableServices
  const dynamicMeals = (availableServices || [])
    .filter((s: any) => s.type === "meal")
    .map((s: any) => ({
      id: s.id,
      name: s.metadata?.name || "In-Flight Meal",
      price: parseFloat(s.total_amount),
      description:
        s.metadata?.description || "Delicious meal option for your journey",
    }));

  // Fallback to defaults if no dynamic meals
  const meals =
    dynamicMeals.length > 0 ? dynamicMeals : isLCC ? lccMeals : fscMeals;
  const [selections, setSelections] = useState<{ [key: number]: string }>({});

  if (!isOpen) return null;

  // Generate passenger list from count – no hardcoded names
  const passengers = Array.from(
    { length: Math.max(1, passengerCount) },
    (_, i) => ({
      id: i + 1,
      label: `Passenger ${i + 1}`,
    }),
  );

  const handleSelectMeal = (mealId: string) => {
    setSelections((prev) => ({
      ...prev,
      [selectedPassenger]: mealId,
    }));
  };

  const currentSelection = selections[selectedPassenger];
  const totalAmount = Object.values(selections).reduce(
    (sum: number, mealId: string) => {
      const meal = meals.find((m: any) => m.id === mealId);
      return sum + (meal?.price || 0);
    },
    0,
  );

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 gap-2">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative bg-card w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-border flex flex-col max-h-[90vh]">
        <div className="p-8 text-center relative border-b border-muted">
          <h2 className="text-2xl font-black text-foreground">
            In-Flight Meals
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            {isLCC
              ? "Pre-book your favorite meal"
              : "Select your dietary preference"}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          {/* Passenger Selection – generic "Passenger N" labels */}
          <div className="flex justify-center gap-3 flex-wrap">
            {passengers.map((p) => (
              <Button
                variant="outline"
                size="default"
                key={p.id}
                onClick={() => setSelectedPassenger(p.id)}
                className={`px-6 h-12 rounded-[2rem] flex items-center gap-3 border transition-all ${
                  selectedPassenger === p.id
                    ? "bg-accent border-accent shadow-lg text-accent-foreground"
                    : "bg-card border-border text-muted-foreground hover:border-border"
                }`}
              >
                {/* Numbered avatar circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${selectedPassenger === p.id ? "bg-foreground text-background" : "bg-purple-100 text-purple-600"}`}
                >
                  {p.id}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {p.label}
                </span>
                {/* Tick if a meal was selected for this passenger */}
                {selections[p.id] && (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center gap-2">
                    <Check size={10} className="text-white stroke-[3px]" />
                  </div>
                )}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meals.map((meal) => {
              const isSelected = currentSelection === meal.id;
              return (
                <div
                  key={meal.id}
                  onClick={() => handleSelectMeal(meal.id)}
                  className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all flex items-center gap-6 group ${
                    isSelected
                      ? "border-primary bg-purple-50/50"
                      : "border-muted hover:border-border bg-card"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground"}`}
                  >
                    <Utensils size={20} />
                  </div>
                  <div className="flex-1 gap-4">
                    <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest">
                      {meal.name}
                    </h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight mt-1">
                      {meal.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-black ${meal.price === 0 ? "text-green-600" : "text-foreground"}`}
                    >
                      {meal.price === 0 ? "FREE" : formatCurrency(meal.price)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-muted/50 border-t border-border flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Selected Items
            </p>
            <p className="text-2xl font-black text-foreground">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <Button
            onClick={() => {
              const selectedMeals = Object.entries(selections)
                .map(([pId, mId]) => {
                  const meal = meals.find((m) => m.id === mId);
                  return { passengerId: pId, ...meal };
                })
                .filter((m) => !!m.id);
              onConfirm(selectedMeals);
            }}
            className="bg-foreground hover:bg-foreground/90 text-background px-10 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1"
          >
            Confirm Meals
          </Button>
        </div>
      </div>
    </div>
  );
};
