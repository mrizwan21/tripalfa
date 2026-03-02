import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPreferences } from "@/components/Notifications";

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background gap-4">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

export default function NotificationPreferencesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="p-4 sm:p-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <Suspense fallback={<LoadingFallback />}>
          <NotificationPreferences />
        </Suspense>
      </div>
    </div>
  );
}
