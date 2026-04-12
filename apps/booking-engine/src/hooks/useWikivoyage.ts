/**
 * React hooks for fetching Wikivoyage travel content
 */
import { useState, useEffect, useCallback } from "react";
import {
  wikivoyageApi,
  type DestinationContent,
  type WikivoyageSearchResult,
} from "../api/wikivoyageApi";

/**
 * Hook to fetch a single destination guide from Wikivoyage
 */
export function useWikivoyageGuide(destination: string | null) {
  const [data, setData] = useState<DestinationContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!destination) {
      setData(null);
      return;
    }

    let cancelled = false;

    const fetchGuide = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const guide = await wikivoyageApi.getGuide(destination);
        if (!cancelled) {
          setData(guide);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error("Failed to fetch guide"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchGuide();

    return () => {
      cancelled = true;
    };
  }, [destination]);

  return { data, isLoading, error };
}

/**
 * Hook to fetch multiple destination guides
 */
function useWikivoyageGuides(destinations: string[]) {
  const [data, setData] = useState<Map<string, DestinationContent>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!destinations.length) {
      setData(new Map());
      return;
    }

    let cancelled = false;

    const fetchGuides = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const guides = await wikivoyageApi.getGuides(destinations);
        if (!cancelled) {
          setData(guides);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error("Failed to fetch guides"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchGuides();

    return () => {
      cancelled = true;
    };
  }, [destinations.join(",")]);

  return { data, isLoading, error };
}

/**
 * Hook to search Wikivoyage for destinations
 */
function useWikivoyageSearch(query: string, limit: number = 5) {
  const [data, setData] = useState<WikivoyageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setData([]);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await wikivoyageApi.search(query, limit);
        if (!cancelled) {
          setData(results);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Search failed"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 300); // Debounce 300ms

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query, limit]);

  return { data, isLoading, error };
}

/**
 * Hook to fetch a specific section of a destination guide
 */
function useWikivoyageSection(
  destination: string | null,
  section: string,
) {
  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!destination || !section) {
      setData(null);
      return;
    }

    let cancelled = false;

    const fetchSection = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const content = await wikivoyageApi.getSection(destination, section);
        if (!cancelled) {
          setData(content);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error("Failed to fetch section"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchSection();

    return () => {
      cancelled = true;
    };
  }, [destination, section]);

  return { data, isLoading, error };
}

/**
 * Hook for popular destination content - fetches guides for a list of popular destinations
 */
function usePopularDestinationGuides(destinationNames: string[]) {
  const [guides, setGuides] = useState<Map<string, DestinationContent>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGuides = useCallback(async () => {
    if (!destinationNames.length) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch guides in batches of 3 to avoid rate limiting
      const batchSize = 3;
      const results = new Map<string, DestinationContent>();

      for (let i = 0; i < destinationNames.length; i += batchSize) {
        const batch = destinationNames.slice(i, i + batchSize);
        const batchResults = await wikivoyageApi.getGuides(batch);
        batchResults.forEach((value, key) => results.set(key, value));
      }

      setGuides(results);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch guides"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [destinationNames.join(",")]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  return { guides, isLoading, error, refetch: fetchGuides };
}
