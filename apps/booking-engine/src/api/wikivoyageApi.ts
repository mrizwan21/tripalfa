/**
 * Wikivoyage API Service
 * Fetches travel guide content from Wikivoyage via MediaWiki API
 * Based on mcp-wikivoyage implementation
 */

const BASE_URL = "https://en.wikivoyage.org/w/api.php";
const USER_AGENT = "TripAlfa-BookingEngine/1.0 (travel planning app)";

export interface WikivoyageSearchResult {
  title: string;
  snippet: string;
  pageid: number;
  wordcount: number;
}

export interface WikivoyageGuide {
  title: string;
  pageid: number;
  extract: string;
  sections: WikivoyageSection[];
}

export interface WikivoyageSection {
  index: number;
  name: string;
  level: number;
}

export interface DestinationContent {
  title: string;
  description: string;
  extract: string;
  see?: string;
  do?: string;
  eat?: string;
  sleep?: string;
  getIn?: string;
  getAround?: string;
  imageUrl?: string;
}

class WikivoyageApi {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (Wikivoyage content doesn't change often)

  /**
   * Make a request to the Wikivoyage MediaWiki API
   */
  private async wikiRequest<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(BASE_URL);
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const cacheKey = `${params.action}:${params.titles || params.srsearch || ""}:${params.prop || ""}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(
        `Wikivoyage API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /**
   * Search for travel destinations
   */
  async search(
    query: string,
    limit: number = 5,
  ): Promise<WikivoyageSearchResult[]> {
    const data = await this.wikiRequest<any>({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: String(limit),
      srnamespace: "0", // Main namespace only
    });

    const results = data.query?.search ?? [];

    return results.map((r: any) => ({
      title: r.title,
      snippet: this.stripHtml(r.snippet),
      pageid: r.pageid,
      wordcount: r.wordcount,
    }));
  }

  /**
   * Get a travel guide for a destination
   */
  async getGuide(
    destination: string,
    maxChars: number = 3000,
  ): Promise<DestinationContent | null> {
    try {
      // Get the main extract
      const data = await this.wikiRequest<any>({
        action: "query",
        titles: destination,
        prop: "extracts|pageimages",
        explaintext: "true",
        exintro: "true", // Get intro section
        piprop: "thumbnail",
        pithumbsize: "800",
      });

      const pages = data.query?.pages ?? {};
      const page = Object.values(pages)[0] as any;

      if (!page || page.missing !== undefined) {
        return null;
      }

      let extract: string = page.extract ?? "";

      // Truncate if needed
      if (extract.length > maxChars) {
        extract =
          extract.slice(0, maxChars).lastIndexOf(".") !== -1
            ? extract.slice(0, extract.slice(0, maxChars).lastIndexOf(".") + 1)
            : extract.slice(0, maxChars) + "...";
      }

      const result: DestinationContent = {
        title: page.title,
        description: extract.split("\n")[0] || "",
        extract: extract,
        imageUrl: page.thumbnail?.source,
      };

      // Get sections for the page
      const sectionsData = await this.wikiRequest<any>({
        action: "parse",
        page: destination,
        prop: "sections",
      });

      if (sectionsData.parse?.sections) {
        const sections = sectionsData.parse.sections;

        // Fetch key sections asynchronously
        const sectionPromises = [
          "See",
          "Do",
          "Eat",
          "Sleep",
          "Get in",
          "Get around",
        ].map(async (sectionName) => {
          const match = sections.find(
            (s: any) => s.line.toLowerCase() === sectionName.toLowerCase(),
          );
          if (!match) return null;

          try {
            const sectionContent = await this.wikiRequest<any>({
              action: "parse",
              page: destination,
              section: match.index,
              prop: "text",
            });

            const html = sectionContent.parse?.text?.["*"] ?? "";
            const plainText = this.stripHtml(html);

            // Limit section content
            const limitedText =
              plainText.length > 500
                ? plainText.slice(0, 500) + "..."
                : plainText;

            return { section: sectionName, content: limitedText };
          } catch {
            return null;
          }
        });

        const sectionResults = await Promise.all(sectionPromises);

        sectionResults.forEach((sectionResult) => {
          if (sectionResult) {
            // Assign section content to the appropriate property on result
            switch (sectionResult.section) {
              case "See":
                result.see = sectionResult.content;
                break;
              case "Do":
                result.do = sectionResult.content;
                break;
              case "Eat":
                result.eat = sectionResult.content;
                break;
              case "Sleep":
                result.sleep = sectionResult.content;
                break;
              case "Get in":
                result.getIn = sectionResult.content;
                break;
              case "Get around":
                result.getAround = sectionResult.content;
                break;
            }
          }
        });
      }

      return result;
    } catch (error) {
      console.error("Failed to fetch Wikivoyage guide:", error);
      return null;
    }
  }

  /**
   * Get multiple destination guides
   */
  async getGuides(
    destinations: string[],
  ): Promise<Map<string, DestinationContent>> {
    const results = new Map<string, DestinationContent>();

    await Promise.all(
      destinations.map(async (dest) => {
        const guide = await this.getGuide(dest);
        if (guide) {
          results.set(dest, guide);
        }
      }),
    );

    return results;
  }

  /**
   * Get a specific section of a guide
   */
  async getSection(
    destination: string,
    section: string,
  ): Promise<string | null> {
    try {
      const sectionsData = await this.wikiRequest<any>({
        action: "parse",
        page: destination,
        prop: "sections",
      });

      if (sectionsData.error) {
        return null;
      }

      const sections = sectionsData.parse?.sections ?? [];
      const sectionLower = section.toLowerCase();

      const match = sections.find(
        (s: any) => s.line.toLowerCase() === sectionLower,
      );

      if (!match) {
        return null;
      }

      const sectionContent = await this.wikiRequest<any>({
        action: "parse",
        page: destination,
        section: match.index,
        prop: "text",
      });

      const html = sectionContent.parse?.text?.["*"] ?? "";
      return this.stripHtml(html);
    } catch (error) {
      console.error("Failed to fetch section:", error);
      return null;
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const wikivoyageApi = new WikivoyageApi();
