/**
 * Destination Content Card Component
 * Displays travel guide content from Wikivoyage
 */
import React, { useState } from "react";
import {
  MapPin,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { DestinationContent } from "../api/wikivoyageApi";

interface DestinationContentCardProps {
  destination: string;
  content: DestinationContent | null;
  isLoading?: boolean;
  error?: Error | null;
  variant?: "default" | "compact" | "featured";
  showSections?: boolean;
  onExplore?: () => void;
}

export function DestinationContentCard({
  destination,
  content,
  isLoading = false,
  error = null,
  variant = "default",
  showSections = true,
  onExplore,
}: DestinationContentCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 gap-4">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return null;
  }

  const truncatedDescription =
    content.description.length > 150
      ? content.description.slice(0, 150) + "..."
      : content.description;

  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1 gap-4">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              {content.title}
              <a
                href={`https://en.wikivoyage.org/wiki/${encodeURIComponent(content.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-600"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </h4>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {truncatedDescription}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div className="relative bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--accent))] rounded-2xl overflow-hidden shadow-xl">
        {content.imageUrl && (
          <div className="absolute inset-0">
            <img
              src={content.imageUrl}
              alt={content.title}
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}
        <div className="relative p-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-white" />
            <h3 className="text-2xl font-bold text-white text-xl font-semibold tracking-tight">
              {content.title}
            </h3>
            <a
              href={`https://en.wikivoyage.org/wiki/${encodeURIComponent(content.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white ml-2"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-white/90 text-sm leading-relaxed mb-6">
            {expanded ? content.extract : truncatedDescription}
          </p>

          {showSections &&
            (content.see || content.do || content.eat || content.sleep) && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {content.see && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-1">
                      See
                    </h5>
                    <p className="text-white/80 text-xs line-clamp-2">
                      {content.see}
                    </p>
                  </div>
                )}
                {content.do && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-1">
                      Do
                    </h5>
                    <p className="text-white/80 text-xs line-clamp-2">
                      {content.do}
                    </p>
                  </div>
                )}
                {content.eat && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-1">
                      Eat
                    </h5>
                    <p className="text-white/80 text-xs line-clamp-2">
                      {content.eat}
                    </p>
                  </div>
                )}
                {content.sleep && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-1">
                      Sleep
                    </h5>
                    <p className="text-white/80 text-xs line-clamp-2">
                      {content.sleep}
                    </p>
                  </div>
                )}
              </div>
            )}

          <div className="flex items-center gap-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
            {onExplore && (
              <button
                onClick={onExplore}
                className="bg-white text-[hsl(var(--secondary))] px-4 py-2 rounded-lg font-bold text-sm hover:bg-opacity-90 transition"
              >
                Explore
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{content.title}</h4>
              <span className="text-xs text-gray-500">From Wikivoyage</span>
            </div>
          </div>
          <a
            href={`https://en.wikivoyage.org/wiki/${encodeURIComponent(content.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-600"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">
          {expanded ? content.extract : truncatedDescription}
        </p>

        {showSections &&
          expanded &&
          (content.see || content.do || content.eat || content.sleep) && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              {content.see && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <span className="text-lg">👁️</span> See
                  </h5>
                  <p className="text-gray-600 text-xs">{content.see}</p>
                </div>
              )}
              {content.do && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <span className="text-lg">🎯</span> Do
                  </h5>
                  <p className="text-gray-600 text-xs">{content.do}</p>
                </div>
              )}
              {content.eat && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <span className="text-lg">🍽️</span> Eat
                  </h5>
                  <p className="text-gray-600 text-xs">{content.eat}</p>
                </div>
              )}
              {content.sleep && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <span className="text-lg">🛏️</span> Sleep
                  </h5>
                  <p className="text-gray-600 text-xs">{content.sleep}</p>
                </div>
              )}
            </div>
          )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Read more <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Destination Content Section - for use in homepage
 */
interface DestinationContentSectionProps {
  title: string;
  subtitle?: string;
  destinationGuides: Map<string, DestinationContent>;
  isLoading?: boolean;
  onDestinationClick?: (destination: string) => void;
}

export function DestinationContentSection({
  title,
  subtitle,
  destinationGuides,
  isLoading = false,
  onDestinationClick,
}: DestinationContentSectionProps) {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    null,
  );

  const guides = Array.from(destinationGuides.entries());
  const selectedGuide = selectedDestination
    ? destinationGuides.get(selectedDestination)
    : null;

  if (guides.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8 gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 text-xs text-indigo-600">
          <BookOpen className="w-4 h-4" />
          <span>Powered by Wikivoyage</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">
            Loading destination guides...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Destination list */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
              {guides.map(([name, guide]) => (
                <button
                  key={name}
                  onClick={() => setSelectedDestination(name)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedDestination === name
                      ? "bg-indigo-50 text-indigo-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="font-medium text-sm">{guide.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {guide.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected destination details */}
          <div className="lg:col-span-2">
            {selectedGuide ? (
              <DestinationContentCard
                destination={selectedDestination!}
                content={selectedGuide}
                variant="featured"
                onExplore={() => onDestinationClick?.(selectedDestination!)}
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center h-full flex items-center justify-center gap-2">
                <div>
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    Select a destination to explore
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
