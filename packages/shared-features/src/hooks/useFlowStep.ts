import { useState } from 'react';

export function useFlowStep<T extends string>(initialStep: T) {
  const [currentStep, setCurrentStep] = useState<T>(initialStep);
  const [history, setHistory] = useState<T[]>([initialStep]);

  const goToStep = (step: T) => {
    setCurrentStep(step);
    setHistory((prev) => [...prev, step]);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentStep(newHistory[newHistory.length - 1]);
    }
  };

  return {
    currentStep,
    setCurrentStep: goToStep,
    goBack,
    canGoBack: history.length > 1,
  };
}
