import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Plane,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { formatCurrency } from "@tripalfa/ui-components";
import {
  Passenger,
  FlightSegmentInfo,
  SelectedMeal,
  MealOption,
  DEFAULT_FSC_MEALS,
  DEFAULT_LCC_MEALS,
  getPassengerAvatar,
} from "../../lib/ancillary-types";

interface MealSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (meals: SelectedMeal[]) => void;
  isLCC?: boolean;
  passengers: Passenger[];
  segments: FlightSegmentInfo[];
  availableMeals?: MealOption[];
  existingSelections?: SelectedMeal[];
}

export const MealSelectionPopup = ({
  isOpen,
  onClose,
  onConfirm,
  isLCC = false,
  passengers,
  segments,
  availableMeals,
  existingSelections = [],
}: MealSelectionPopupProps) => {
  const [selectedPassengerIdx, setSelectedPassengerIdx] = useState(0);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedMeals, setSelectedMeals] =
    useState<SelectedMeal[]>(existingSelections);

  // Use provided meals or defaults based on carrier type
  const mealOptions: MealOption[] =
    availableMeals && availableMeals.length > 0
      ? availableMeals
      : isLCC
        ? DEFAULT_LCC_MEALS
        : DEFAULT_FSC_MEALS;

  const currentPassenger = passengers[selectedPassengerIdx];
  const currentSegment = segments[selectedSegmentIdx];

  // Get meal for current passenger/segment
  const currentMeal = selectedMeals.find(
    (m) =>
      m.passengerId === currentPassenger?.id &&
      m.segmentId === currentSegment?.id,
  );

  const handleMealSelect = (meal: MealOption) => {
    if (!currentPassenger || !currentSegment) return;

    const newMeal: SelectedMeal = {
      passengerId: currentPassenger.id,
      passengerName:
        `${currentPassenger.firstName} ${currentPassenger.lastName}`.trim(),
      segmentId: currentSegment.id,
      flightNumber: currentSegment.flightNumber,
      mealId: meal.id,
      mealName: meal.name,
      mealType: meal.type,
      description: meal.description,
      price: meal.price,
      currency: meal.currency,
    };

    // Replace existing meal for this passenger/segment or add new
    setSelectedMeals((prev) => {
      const filtered = prev.filter(
        (m) =>
          !(
            m.passengerId === currentPassenger.id &&
            m.segmentId === currentSegment.id
          ),
      );
      return [...filtered, newMeal];
    });
  };

  const handleRemoveMeal = () => {
    if (!currentPassenger || !currentSegment) return;
    setSelectedMeals((prev) =>
      prev.filter(
        (m) =>
          !(
            m.passengerId === currentPassenger.id &&
            m.segmentId === currentSegment.id
          ),
      ),
    );
  };

  const totalAmount = selectedMeals.reduce((sum, m) => sum + m.price, 0);

  // Get meal type icon/color
  const getMealTypeStyle = (type: MealOption["type"]) => {
    switch (type) {
      case "vegetarian":
        return { bg: "bg-green-100", text: "text-green-600", label: "Veg" };
      case "vegan":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-600",
          label: "Vegan",
        };
      case "non-vegetarian":
        return { bg: "bg-red-100", text: "text-red-600", label: "Non-Veg" };
      case "special":
        return {
          bg: "bg-purple-100",
          text: "text-purple-600",
          label: "Special",
        };
      default:
        return { bg: "bg-gray-100", text: "text-gray-600", label: "" };
    }
  };

  if (!isOpen) return null;

  if (isConfirming) {
    return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 gap-2">
        <div
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={() => setIsConfirming(false)}
        />
        <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20 relative gap-2">
            <Utensils className="w-8 h-8 text-white" />
            <div className="absolute inset-0 bg-primary blur-2xl opacity-40 scale-150 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-gray-900 text-center leading-relaxed text-2xl font-semibold tracking-tight">
            Confirm Meal Selections
          </h2>

          <div className="w-full space-y-3 max-h-48 overflow-y-auto">
            {selectedMeals.map((meal, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-2"
              >
                <div>
                  <p className="text-[10px] font-black text-gray-900">
                    {meal.passengerName}
                  </p>
                  <p className="text-[8px] font-bold text-gray-400">
                    {meal.flightNumber} - {meal.mealName}
                  </p>
                </div>
                <span className="text-sm font-black text-primary">
                  {meal.price === 0 ? "Included" : formatCurrency(meal.price)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center w-full pt-4 border-t border-gray-100 gap-4">
            <span className="text-sm font-black text-gray-900">Total</span>
            <span className="text-xl font-black text-primary">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="flex gap-4 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsConfirming(false)}
              className="flex-1 h-12 rounded-xl border border-primary text-primary font-black text-xs uppercase tracking-widest transition-colors hover:bg-primary/10 gap-4"
            >
              Go Back
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => onConfirm(selectedMeals)}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95 gap-4"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 gap-2">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100 flex flex-col max-h-[95vh]"
        data-testid="meal-selection-modal"
      >
        {/* Header */}
        <div className="p-8 text-center relative border-b border-gray-50">
          <h2 className="text-2xl font-black text-gray-900">In-Flight Meals</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            {isLCC
              ? "Pre-order meals for your journey"
              : "Select your preferred meal options"}
          </p>
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12">
          {/* Passenger Selection */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                setSelectedPassengerIdx((prev) => Math.max(0, prev - 1))
              }
              disabled={selectedPassengerIdx === 0}
              className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-primary hover:bg-primary/10 transition-all disabled:opacity-30 gap-2"
            >
              <ChevronLeft size={20} />
            </Button>
            <div className="flex gap-4 flex-wrap justify-center">
              {passengers.map((p, idx) => (
                <Button
                  variant="outline"
                  size="md"
                  key={p.id}
                  onClick={() => setSelectedPassengerIdx(idx)}
                  className={`px-6 h-14 rounded-[2rem] flex items-center gap-4 border transition-all ${
                    selectedPassengerIdx === idx
                      ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20"
                      : "border-yellow-200 text-gray-400 bg-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 border-2 border-white">
                    <img
                      src={p.avatar || getPassengerAvatar(p.firstName)}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-black uppercase tracking-widest block">
                      {`${p.firstName} ${p.lastName}`.trim()}
                    </span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase">
                      {p.type}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                setSelectedPassengerIdx((prev) =>
                  Math.min(passengers.length - 1, prev + 1),
                )
              }
              disabled={selectedPassengerIdx === passengers.length - 1}
              className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-primary hover:bg-primary/10 transition-all disabled:opacity-30 gap-2"
            >
              <ChevronRight size={20} />
            </Button>
          </div>

          {/* Main Selection Area */}
          <div className="bg-gray-100/50 p-10 rounded-[3rem] space-y-8">
            {/* Flight Tabs */}
            <div className="flex justify-center gap-4">
              <div className="bg-white p-2 rounded-2xl flex gap-4 flex-wrap justify-center">
                {segments.map((seg, idx) => (
                  <Button
                    variant="outline"
                    size="md"
                    key={seg.id}
                    onClick={() => setSelectedSegmentIdx(idx)}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                      selectedSegmentIdx === idx
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "border border-primary text-primary"
                    }`}
                  >
                    {seg.origin}
                    <Plane
                      size={14}
                      className={`transform rotate-90 ${selectedSegmentIdx === idx ? "text-white/70" : ""}`}
                    />
                    {seg.destination}
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Selection Info */}
            {currentMeal && (
              <div className="flex justify-center gap-4">
                <div className="bg-green-50 px-6 py-3 rounded-full flex items-center gap-3 border border-green-200">
                  <Check size={16} className="text-green-600" />
                  <span className="text-[10px] font-black text-green-700">
                    Selected: {currentMeal.mealName}
                  </span>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleRemoveMeal}
                    className="ml-2 text-[10px] font-bold underline"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {/* Meal Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mealOptions.map((meal) => {
                const typeStyle = getMealTypeStyle(meal.type);
                const isSelected = currentMeal?.mealId === meal.id;

                return (
                  <Button
                    variant="outline"
                    size="md"
                    key={meal.id}
                    onClick={() => handleMealSelect(meal)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-gray-100 bg-white hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      {meal.image ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                          <img
                            src={meal.image}
                            alt={meal.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center gap-2">
                          <Utensils className="w-6 h-6 text-orange-400" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center gap-2">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>

                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-wide mb-1 text-xl font-semibold tracking-tight">
                      {meal.name}
                    </h3>
                    {meal.description && (
                      <p className="text-[9px] font-medium text-gray-400 mb-3 line-clamp-2">
                        {meal.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      {typeStyle.label && (
                        <span
                          className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${typeStyle.bg} ${typeStyle.text}`}
                        >
                          {typeStyle.label}
                        </span>
                      )}
                      <span
                        className={`text-sm font-black ${meal.price === 0 ? "text-green-600" : "text-primary"}`}
                      >
                        {meal.price === 0
                          ? "Included"
                          : formatCurrency(meal.price)}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Total Bar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-50 flex items-center justify-between gap-2">
              <span className="text-sm font-black text-gray-900 uppercase tracking-[2px]">
                Total Meal Cost
              </span>
              <span className="text-xl font-black text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* All Selections Summary */}
          {selectedMeals.length > 0 && (
            <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-4 text-xl font-semibold tracking-tight">
                All Meal Selections
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedMeals.map((meal, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-3 flex items-center justify-between border border-gray-100 gap-2"
                  >
                    <div>
                      <p className="text-[9px] font-black text-gray-700">
                        {meal.passengerName}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400">
                        {meal.flightNumber} - {meal.mealName}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-primary">
                      {meal.price === 0 ? "Free" : formatCurrency(meal.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="flex justify-center pt-4 gap-4">
            <Button
              onClick={() => selectedMeals.length > 0 && setIsConfirming(true)}
              disabled={selectedMeals.length === 0}
              className="w-full max-w-xl h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-[4px] shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            >
              Confirm Meals{" "}
              {totalAmount > 0 && ` - ${formatCurrency(totalAmount)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
