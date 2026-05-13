import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { UserProfileWizard, type WizardFormData } from "../components/profile-wizard";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

function ProfileWizardPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleComplete = async (data: WizardFormData): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Build the payload for the profile completion API
      const payload: Record<string, any> = {
        bio: data.bio,
        interests: data.interests,
      };

      // If there's an avatar file, upload it first
      if (data.avatarFile) {
        // Note: In production, this would be a proper file upload to your backend
        // For now, we simulate by sending the avatar as part of the profile payload
        // The backend should handle multipart/form-data for actual file uploads
        const reader = new FileReader();
        const avatarBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(data.avatarFile!);
        });
        payload.avatar = avatarBase64;
      }

      // Submit profile data
      await api.post("/users/profile", payload);
      setIsSubmitting(false);
      return true;
    } catch (err: any) {
      console.error("[ProfileWizardPage] Submit error:", err);
      setSubmitError(err?.message || "Failed to save profile. Please try again.");
      setIsSubmitting(false);
      return false;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Complete Your Profile"
        subtitle="Set up your avatar, bio, and interests to personalize your travel experience."
      />

      <Card className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {submitError}
          </div>
        )}

        <UserProfileWizard
          onComplete={handleComplete}
          className="w-full"
        />

        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            disabled={isSubmitting}
          >
            Skip for now
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ProfileWizardPage;