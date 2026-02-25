import React from 'react';
import { Check } from 'lucide-react';

interface Step {
    id: number;
    label: string;
}

interface BookingStepperProps {
    currentStep: number;
}

const STEPS: Step[] = [
    { id: 1, label: 'Hotel Selected' },
    { id: 2, label: 'Select Room' },
    { id: 3, label: 'Add-ons' },
    { id: 4, label: 'Passenger Info' },
    { id: 5, label: 'Payment' },
];

export function BookingStepper({ currentStep }: BookingStepperProps) {
    return (
        <div className="w-full bg-white border-b py-6 mb-8 shadow-sm relative z-10">
            <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center justify-between min-w-[600px] max-w-6xl mx-auto relative pt-8 pb-4">
                    {/* Line Background - Perfectly Centered Vertically */}
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2 -z-0 rounded-full" />

                    {STEPS.map((step, index) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;

                        return (
                            <React.Fragment key={step.id}>
                                <div className="relative z-10 flex flex-col items-center flex-1 group cursor-default">
                                    <div
                                        className={`
                                            px-4 py-2 rounded-full border-2 font-black text-[9px] uppercase tracking-[0.15em] transition-all duration-300 shadow-sm whitespace-nowrap bg-white
                                            ${isActive ? 'bg-[#EC5C4C] border-[#EC5C4C] text-black scale-110 shadow-lg ring-4 ring-yellow-50' :
                                                isCompleted ? 'bg-[#6366F1] border-[#6366F1] text-white' :
                                                    'bg-white border-gray-200 text-gray-300'}
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isCompleted && <Check size={10} strokeWidth={4} />}
                                            <span className={isActive ? 'opacity-100' : 'opacity-80'}>{step.id}. {step.label}</span>
                                        </div>
                                    </div>

                                    {isActive && (
                                        <div className="absolute -bottom-6 flex flex-col items-center">
                                            <div className="w-1.5 h-1.5 bg-[#EC5C4C] rounded-full animate-bounce" />
                                        </div>
                                    )}
                                </div>
                                {index < STEPS.length - 1 && (
                                    // Active Line Progress - Perfectly Centered
                                    <div
                                        className={`absolute h-[2px] transition-all duration-1000 top-1/2 -translate-y-1/2 z-0
                                        ${isCompleted ? 'bg-[#6366F1]' : 'bg-transparent'}`}
                                        style={{
                                            left: `${(index * 100) / (STEPS.length - 1)}%`,
                                            width: `${100 / (STEPS.length - 1)}%`
                                        }}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
