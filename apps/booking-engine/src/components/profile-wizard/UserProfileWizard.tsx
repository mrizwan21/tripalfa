import React, { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@tripalfa/ui-components";
import { AvatarStep } from "./AvatarStep";
import { BioStep } from "./BioStep";
import { InterestsStep, INTEREST_OPTIONS } from "./InterestsStep";

// Types
export type StepId = "avatar" | "bio" | "interests";

export interface WizardFormData {
  avatarFile: File | null;
  avatarPreview: string | null;
  bio: string;
  interests: string[];
}

export interface WizardStep {
  id: StepId;
  label: string;
  description: string;
}

const STEPS: WizardStep[] = [
  {
    id: "avatar",
    label: "Avatar",
    description: "Upload your profile photo",
  },
  {
    id: "bio",
    label: "Bio",
    description: "Tell us about yourself",
  },
  {
    id: "interests",
    label: "Interests",
    description: "Select your travel interests",
  },
];

const MAX_BIO_LENGTH = 500;

export interface UserProfileWizardProps {
  className?: string;
  onComplete?: (data: WizardFormData) => Promise<boolean>;
  initialData?: Partial<WizardFormData>;
}

export function UserProfileWizard({
  className,
  onComplete,
  initialData,
}: UserProfileWizardProps) {
  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>({
    avatarFile: initialData?.avatarFile ?? null,
    avatarPreview: initialData?.avatarPreview ?? null,
    bio: initialData?.bio ?? "",
    interests: initialData?.interests ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const currentStep = STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isComplete = submitSuccess;

  // Focus trap management
  const wizardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wizardRef.current) {
      wizardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentStepIndex]);

  // ── Step Navigation ──────────────────────────────────────────

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setErrors({});
    }
  }, [currentStepIndex]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setErrors({});
    }
  }, [currentStepIndex]);

  // ── Step-specific update helpers ─────────────────────────────

  const handleAvatarChange = useCallback((file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      avatarFile: file,
      avatarPreview: file
        ? URL.createObjectURL(file)
        : null,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.avatar;
      return next;
    });
  }, []);

  const handleRemoveAvatar = useCallback(() => {
    // Revoke old URL to prevent memory leaks
    if (formData.avatarPreview) {
      URL.revokeObjectURL(formData.avatarPreview);
    }
    setFormData((prev) => ({
      ...prev,
      avatarFile: null,
      avatarPreview: null,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.avatar;
      return next;
    });
  }, [formData.avatarPreview]);

  const handleBioChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, bio: value }));
    // Clear bio error when user types
    if (errors.bio) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.bio;
        return next;
      });
    }
  }, [errors.bio]);

  const handleToggleInterest = useCallback((id: string) => {
    setFormData((prev) => {
      const next = prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id];
      return { ...prev, interests: next };
    });
    // Clear interests error when user toggles
    if (errors.interests) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.interests;
        return next;
      });
    }
  }, [errors.interests]);

  // ── Validation per step ──────────────────────────────────────

  const validateCurrentStep = useCallback((): boolean => {
    const stepErrors: Record<string, string> = {};

    switch (currentStep.id) {
      case "bio":
        if (!formData.bio.trim()) {
          stepErrors.bio = "Bio is required";
        } else if (formData.bio.length > MAX_BIO_LENGTH) {
          stepErrors.bio = `Bio exceeds ${MAX_BIO_LENGTH} characters`;
        } else if (formData.bio.trim().length < 10) {
          stepErrors.bio = "Bio must be at least 10 characters";
        }
        break;

      case "interests":
        if (formData.interests.length === 0) {
          stepErrors.interests = "Select at least 1 interest";
        }
        break;

      // Avatar step has no hard validation (optional)
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [currentStep.id, formData]);

  // ── Submit ───────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    // Validate current (last) step before submitting
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      if (onComplete) {
        const success = await onComplete(formData);
        if (success) {
          setSubmitSuccess(true);
        }
      } else {
        // Default: just mark as success (useful for demo/preview)
        setSubmitSuccess(true);
      }
    } catch (err) {
      console.error("[UserProfileWizard] Submit error:", err);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to save profile. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onComplete, validateCurrentStep]);

  // ── Auto-advance on last step of "Next" click ────────────────

  const handleNextClick = useCallback(() => {
    if (!validateCurrentStep()) return;
    if (isLastStep) {
      handleSubmit();
    } else {
      goToNextStep();
    }
  }, [isLastStep, validateCurrentStep, goToNextStep, handleSubmit]);

  // ── Render step content ──────────────────────────────────────

  const renderStepContent = () => {
    switch (currentStep.id) {
      case "avatar":
        return (
          <AvatarStep
            avatarPreview={formData.avatarPreview}
            onAvatarChange={handleAvatarChange}
            onRemoveAvatar={handleRemoveAvatar}
            errors={errors}
          />
        );
      case "bio":
        return (
          <BioStep
            bio={formData.bio}
            onBioChange={handleBioChange}
            maxLength={MAX_BIO_LENGTH}
            errors={errors}
          />
        );
      case "interests":
        return (
          <InterestsStep
            selectedInterests={formData.interests}
            onToggleInterest={handleToggleInterest}
            maxSelections={8}
            minSelections={1}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  // ── Completion view ──────────────────────────────────────────

  if (isComplete) {
    return (
      <div
        ref={wizardRef}
        className={cn(
          "w-full max-w-2xl mx-auto",
          className
        )}
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Profile Complete!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Your profile has been set up successfully. You can update it anytime
            from your account settings.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => setSubmitSuccess(false)}
            >
              Edit Profile
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCurrentStepIndex(0);
                setSubmitSuccess(false);
              }}
            >
              Start Over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main wizard view ─────────────────────────────────────────

  return (
    <div
      ref={wizardRef}
      className={cn("w-full max-w-2xl mx-auto", className)}
      role="form"
      aria-label="User profile setup wizard"
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-2"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  index === currentStepIndex
                    ? "bg-[#0071e3] text-white shadow-sm scale-110"
                    : index < currentStepIndex
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400"
                )}
                aria-current={index === currentStepIndex ? "step" : undefined}
              >
                {index < currentStepIndex ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-[2px] transition-all duration-300 rounded-full",
                    index < currentStepIndex
                      ? "bg-green-500"
                      : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
          <span className="text-sm text-gray-400 mx-2">·</span>
          <span className="text-sm text-gray-500">{currentStep.label}</span>
        </div>
      </div>

      {/* Step Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-semibold text-gray-900">
            {currentStep.label}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {currentStep.description}
          </p>
        </div>

        <div className="px-6 py-6">
          {renderStepContent()}

          {/* Global submit error */}
          {errors.submit && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.submit}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <div>
            {!isFirstStep && (
              <Button
                variant="ghost"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {errors.submit && (
              <span className="text-xs text-red-500 hidden sm:inline">
                Fix errors above to continue
              </span>
            )}
            <Button
              variant="primary"
              onClick={handleNextClick}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              rightIcon={
                !isLastStep ? (
                  <ArrowRight className="h-4 w-4" />
                ) : undefined
              }
            >
              {isSubmitting
                ? "Saving..."
                : isLastStep
                  ? "Complete Setup"
                  : "Next Step"}
            </Button>
          </div>
        </div>
      </div>

      {/* Step hints */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          All fields marked with * are required. Your data is encrypted and
          securely stored.
        </p>
      </div>
    </div>
  );
}