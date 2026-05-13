import React, { useRef, useCallback } from "react";
import { Upload, X, Camera } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@tripalfa/ui-components";

interface AvatarStepProps {
  avatarPreview: string | null;
  onAvatarChange: (file: File | null) => void;
  onRemoveAvatar: () => void;
  errors: Record<string, string>;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

export function AvatarStep({
  avatarPreview,
  onAvatarChange,
  onRemoveAvatar,
  errors,
}: AvatarStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        onAvatarChange(null);
        return;
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`Please upload an image file (JPEG, PNG, WebP, or GIF)`);
        return;
      }

      // Validate file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_SIZE_MB) {
        alert(`File size must be less than ${MAX_SIZE_MB}MB`);
        return;
      }

      onAvatarChange(file);
    },
    [onAvatarChange]
  );

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Avatar Preview Area */}
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "relative w-32 h-32 rounded-full overflow-hidden border-2 transition-all duration-200",
            avatarPreview
              ? "border-blue-100"
              : "border-dashed border-gray-300 bg-gray-50 hover:border-gray-400"
          )}
          onClick={avatarPreview ? undefined : triggerFileInput}
          role="button"
          tabIndex={avatarPreview ? -1 : 0}
          onKeyDown={
            avatarPreview
              ? undefined
              : (e) => e.key === "Enter" && triggerFileInput()
          }
          aria-label={avatarPreview ? "Current avatar" : "Upload avatar"}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
            aria-hidden="true"
          />

          {avatarPreview ? (
            <>
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
              {/* Overlay with change/remove options */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                  aria-label="Change avatar"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-full h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAvatar();
                  }}
                  aria-label="Remove avatar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
              onClick={triggerFileInput}
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-xs text-gray-400 font-medium">
                Upload photo
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          JPG, PNG, or WebP. Max {MAX_SIZE_MB}MB.
        </p>
      </div>

      {errors.avatar && (
        <p className="text-sm text-red-500 text-center">{errors.avatar}</p>
      )}
    </div>
  );
}