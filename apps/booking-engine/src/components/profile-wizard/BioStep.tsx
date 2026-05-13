import React from "react";
import { cn } from "@tripalfa/ui-components";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface BioStepProps {
  bio: string;
  onBioChange: (value: string) => void;
  maxLength: number;
  errors: Record<string, string>;
}

const INTERESTING_FACTS = [
  "Share what makes your travels unique",
  "Mention your favorite destinations",
  "Tell us about your travel style",
  "Any special needs or preferences?",
];

export function BioStep({ bio, onBioChange, maxLength = 500, errors }: BioStepProps) {
  const charCount = bio.length;
  const remaining = maxLength - charCount;
  const isOverLimit = charCount > maxLength;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
          Tell us about yourself
        </Label>
        <p className="text-xs text-gray-400 mb-3">
          Share a brief bio to help other travelers connect with you.
        </p>
        <Textarea
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder={
            INTERESTING_FACTS[Math.floor(Math.random() * INTERESTING_FACTS.length)]
          }
          maxLength={maxLength}
          rows={4}
          className={cn(
            "resize-none",
            isOverLimit && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
          )}
          aria-describedby="bio-counter"
        />
        <div
          className="flex justify-between mt-2"
          id="bio-counter"
          role="status"
          aria-live="polite"
        >
          <span
            className={cn(
              "text-xs font-medium transition-colors duration-200",
              isOverLimit
                ? "text-red-500"
                : remaining <= 50
                  ? "text-amber-500"
                  : "text-gray-400"
            )}
          >
            {charCount} / {maxLength} characters
          </span>
          {isOverLimit && (
            <span className="text-xs text-red-500">
              Exceeded by {charCount - maxLength} characters
            </span>
          )}
        </div>
      </div>

      {errors.bio && (
        <p className="text-sm text-red-500">{errors.bio}</p>
      )}
    </div>
  );
}