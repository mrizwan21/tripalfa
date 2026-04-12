/**
 * Translation utilities for the booking engine
 */

// Translation API Configuration
const TRANSLATION_API_CONFIG = {
  // Option 1: Google Translate API (requires API key)
  GOOGLE_TRANSLATE_API:
    "https://translation.googleapis.com/language/translate/v2",

  // Option 2: DeepL API (requires API key)
  DEEPL_API: "https://api.deepl.com/v2/translate",

  // Option 3: LibreTranslate (free, self-hosted or public instance)
  LIBRE_TRANSLATE_API: "https://libretranslate.de/translate",

  // Option 4: Microsoft Translator API
  MICROSOFT_TRANSLATOR_API:
    "https://api.cognitive.microsofttranslator.com/translate",

  // Option 5: Mock translation for development
  MOCK_TRANSLATE_API: "/api/mock-translate",
};

// Supported languages mapping
const SUPPORTED_LANGUAGES = {
  en: "English",
  ar: "Arabic",
  fr: "French",
  es: "Spanish",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  nl: "Dutch",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
};

// RTL languages
const RTL_LANGUAGES = ["ar", "he", "fa", "ur"];

// Common UI text keys that need translation
const TRANSLATION_KEYS = [
  "header.sign_in",
  "header.register",
  "header.notifications",
  "header.view_all",
  "header.language_currency",
  "header.welcome",
  "header.logout",
  "search.placeholder",
  "search.button",
  "flights.title",
  "hotels.title",
  "packages.title",
  "transfers.title",
  "booking.title",
  "profile.title",
  "wallet.title",
  "notifications.title",
  "help.title",
  "footer.copyright",
  "footer.about",
  "footer.contact",
  "footer.terms",
  "footer.privacy",
];

// Default English translations
const DEFAULT_TRANSLATIONS: Record<string, string> = {
  "header.sign_in": "Sign In",
  "header.register": "Register",
  "header.notifications": "Notifications",
  "header.view_all": "View All",
  "header.language_currency": "Language & Currency",
  "header.welcome": "Welcome",
  "header.logout": "Logout",
  "search.placeholder": "Search...",
  "search.button": "Search",
  "flights.title": "Flights",
  "hotels.title": "Hotels",
  "packages.title": "Packages",
  "transfers.title": "Transfers",
  "booking.title": "Bookings",
  "profile.title": "Profile",
  "wallet.title": "Wallet",
  "notifications.title": "Notifications",
  "help.title": "Help Center",
  "footer.copyright": "© 2024 Travel Kingdom. All rights reserved.",
  "footer.about": "About Us",
  "footer.contact": "Contact",
  "footer.terms": "Terms of Service",
  "footer.privacy": "Privacy Policy",
};

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, Record<string, string>>();

/**
 * Get translation for a specific key
 */
function t(
  key: string,
  translations: Record<string, string> = {},
): string {
  // First check if we have translations passed in
  if (translations && translations[key]) {
    return translations[key];
  }

  // Then check cache
  const currentLang = getCurrentLanguage();
  const cached = translationCache.get(currentLang);
  if (cached && cached[key]) {
    return cached[key];
  }

  // Return default English translation
  return DEFAULT_TRANSLATIONS[key] || key;
}

/**
 * Get current language from localStorage or default
 */
export function getCurrentLanguage(): string {
  if (typeof window === "undefined") return "en";

  return localStorage.getItem("language") || "en";
}

/**
 * Set current language and update document direction
 */
export function setCurrentLanguage(lang: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("language", lang);

  // Update document direction for RTL languages
  const isRTL = RTL_LANGUAGES.includes(lang);
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = lang;

  // Update CSS-in-JS styles for RTL if needed
  updateRTLStyles(isRTL);
}

/**
 * Update CSS styles for RTL languages
 */
function updateRTLStyles(isRTL: boolean): void {
  const styleId = "rtl-dynamic-overrides";
  const existing = document.getElementById(styleId);

  if (!isRTL) {
    if (existing) existing.remove();
    return;
  }

  if (existing) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .text-left { text-align: right !important; }
    .text-right { text-align: left !important; }
    .ml-2 { margin-right: 0.5rem !important; margin-left: 0 !important; }
    .mr-2 { margin-left: 0.5rem !important; margin-right: 0 !important; }
    .pl-4 { padding-right: 1rem !important; padding-left: 0 !important; }
    .pr-4 { padding-left: 1rem !important; padding-right: 0 !important; }
    .border-l { border-right: 1px solid currentColor !important; border-left: 0 !important; }
    .border-r { border-left: 1px solid currentColor !important; border-right: 0 !important; }
  `;
  document.head.appendChild(style);
}

/**
 * Fetch translations from API
 */
async function fetchTranslations(
  lang: string,
): Promise<Record<string, string>> {
  try {
    // Try to get from cache first
    if (translationCache.has(lang)) {
      return translationCache.get(lang)!;
    }

    // Try local API first (if available)
    try {
      const response = await fetch(`/api/translations?lang=${lang}`);
      if (response.ok) {
        const translations = await response.json();
        translationCache.set(lang, translations);
        return translations;
      }
    } catch (error) {
      console.warn("Local translation API not available:", error);
    }

    // Fallback to external translation API
    const translations = await translateTextBatch(DEFAULT_TRANSLATIONS, lang);
    translationCache.set(lang, translations);
    return translations;
  } catch (error) {
    console.error("Failed to fetch translations:", error);
    return DEFAULT_TRANSLATIONS;
  }
}

/**
 * Translate text using external API
 */
async function translateTextBatch(
  texts: Record<string, string>,
  targetLang: string,
): Promise<Record<string, string>> {
  // Option 1: Use LibreTranslate (free)
  try {
    const libreTranslateResponse = await fetch(
      TRANSLATION_API_CONFIG.LIBRE_TRANSLATE_API,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: Object.values(texts),
          source: "en",
          target: targetLang,
          format: "text",
        }),
      },
    );

    if (libreTranslateResponse.ok) {
      const result = await libreTranslateResponse.json();
      const translatedTexts = Object.keys(texts).reduce(
        (acc, key, index) => {
          acc[key] = result.translatedText[index] || texts[key];
          return acc;
        },
        {} as Record<string, string>,
      );
      return translatedTexts;
    }
  } catch (error) {
    console.warn("LibreTranslate failed:", error);
  }

  // Option 2: Use Google Translate API (requires API key)
  try {
    const googleApiKey =
      (globalThis as any).process?.env?.VITE_GOOGLE_TRANSLATE_API_KEY || "";
    if (googleApiKey) {
      const response = await fetch(
        `${TRANSLATION_API_CONFIG.GOOGLE_TRANSLATE_API}?key=${googleApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: Object.values(texts),
            source: "en",
            target: targetLang,
            format: "text",
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        const translatedTexts = Object.keys(texts).reduce(
          (acc, key, index) => {
            acc[key] = result.data.translations[index].translatedText;
            return acc;
          },
          {} as Record<string, string>,
        );
        return translatedTexts;
      }
    }
  } catch (error) {
    console.warn("Google Translate API failed:", error);
  }

  // Option 3: Use DeepL API (requires API key)
  try {
    const deeplApiKey = "1143d2d5-1af4-4884-a5b4-947f8e5ee424:fx";
    if (deeplApiKey) {
      const response = await fetch(TRANSLATION_API_CONFIG.DEEPL_API, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${deeplApiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          text: Object.values(texts).join("\n"),
          source_lang: "EN",
          target_lang: targetLang.toUpperCase(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const translatedTexts = Object.keys(texts).reduce(
          (acc, key, index) => {
            acc[key] = result.translations[index].text;
            return acc;
          },
          {} as Record<string, string>,
        );
        return translatedTexts;
      }
    }
  } catch (error) {
    console.warn("DeepL API failed:", error);
  }

  // Fallback to mock translations
  return createMockTranslations(targetLang);
}

/**
 * Create mock translations for development
 */
function createMockTranslations(lang: string): Record<string, string> {
  const mockTranslations: Record<string, string> = {};

  Object.keys(DEFAULT_TRANSLATIONS).forEach((key) => {
    const text = DEFAULT_TRANSLATIONS[key];

    // Simple mock translation logic
    switch (lang) {
      case "ar":
        // Arabic mock translations
        mockTranslations[key] = mockArabicTranslation(text);
        break;
      case "fr":
        // French mock translations
        mockTranslations[key] = mockFrenchTranslation(text);
        break;
      case "es":
        // Spanish mock translations
        mockTranslations[key] = mockSpanishTranslation(text);
        break;
      default:
        mockTranslations[key] = text;
    }
  });

  return mockTranslations;
}

/**
 * Mock Arabic translation (for development)
 */
function mockArabicTranslation(text: string): string {
  const arabicMap: Record<string, string> = {
    "Sign In": "تسجيل الدخول",
    Register: "تسجيل",
    Notifications: "إشعارات",
    "View All": "عرض الكل",
    "Language & Currency": "اللغة والعملة",
    Welcome: "أهلا وسهلا",
    Logout: "تسجيل الخروج",
    "Search...": "بحث...",
    Search: "بحث",
    Flights: "رحلات طيران",
    Hotels: "فنادق",
    Packages: "باقات",
    Transfers: "تنقلات",
    Bookings: "حجوزات",
    Profile: "الملف الشخصي",
    Wallet: "المحفظة",
    "Help Center": "مركز المساعدة",
    "© 2024 Travel Kingdom. All rights reserved.":
      "© 2024 مملكة السفر. جميع الحقوق محفوظة.",
    "About Us": "من نحن",
    Contact: "اتصل بنا",
    "Terms of Service": "شروط الخدمة",
    "Privacy Policy": "سياسة الخصوصية",
  };

  return arabicMap[text] || text;
}

/**
 * Mock French translation (for development)
 */
function mockFrenchTranslation(text: string): string {
  const frenchMap: Record<string, string> = {
    "Sign In": "Se Connecter",
    Register: "S'inscrire",
    Notifications: "Notifications",
    "View All": "Voir Tout",
    "Language & Currency": "Langue et Devise",
    Welcome: "Bienvenue",
    Logout: "Se Déconnecter",
    "Search...": "Rechercher...",
    Search: "Rechercher",
    Flights: "Vols",
    Hotels: "Hôtels",
    Packages: "Forfaits",
    Transfers: "Transferts",
    Bookings: "Réservations",
    Profile: "Profil",
    Wallet: "Portefeuille",
    "Help Center": "Centre d'aide",
    "© 2024 Travel Kingdom. All rights reserved.":
      "© 2024 Royaume du Voyage. Tous droits réservés.",
    "About Us": "À Propos",
    Contact: "Contact",
    "Terms of Service": "Conditions d'utilisation",
    "Privacy Policy": "Politique de Confidentialité",
  };

  return frenchMap[text] || text;
}

/**
 * Mock Spanish translation (for development)
 */
function mockSpanishTranslation(text: string): string {
  const spanishMap: Record<string, string> = {
    "Sign In": "Iniciar Sesión",
    Register: "Registrarse",
    Notifications: "Notificaciones",
    "View All": "Ver Todo",
    "Language & Currency": "Idioma y Moneda",
    Welcome: "Bienvenido",
    Logout: "Cerrar Sesión",
    "Search...": "Buscar...",
    Search: "Buscar",
    Flights: "Vuelos",
    Hotels: "Hoteles",
    Packages: "Paquetes",
    Transfers: "Traslados",
    Bookings: "Reservas",
    Profile: "Perfil",
    Wallet: "Cartera",
    "Help Center": "Centro de Ayuda",
    "© 2024 Travel Kingdom. All rights reserved.":
      "© 2024 Reino de Viajes. Todos los derechos reservados.",
    "About Us": "Sobre Nosotros",
    Contact: "Contacto",
    "Terms of Service": "Términos de Servicio",
    "Privacy Policy": "Política de Privacidad",
  };

  return spanishMap[text] || text;
}

/**
 * Translation hook for React components
 */
export function useTranslation() {
  const [translations, setTranslations] =
    React.useState<Record<string, string>>(DEFAULT_TRANSLATIONS);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentLang, setCurrentLangState] =
    React.useState(getCurrentLanguage());

  React.useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const trans = await fetchTranslations(currentLang);
        setTranslations(trans);
      } catch (error) {
        console.error("Failed to load translations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [currentLang]);

  const changeLanguage = React.useCallback(async (lang: string) => {
    setCurrentLanguage(lang);
    setCurrentLangState(lang);

    try {
      const trans = await fetchTranslations(lang);
      setTranslations(trans);
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  }, []);

  return {
    t: (key: string) => t(key, translations),
    translations,
    currentLang,
    changeLanguage,
    isLoading,
  };
}

// Make React available for the hook
import React from "react";
