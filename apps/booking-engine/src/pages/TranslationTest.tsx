import React from 'react';
import { useTranslation } from '../lib/translation';
import { Button } from '../components/ui/Button';

export default function TranslationTest() {
  const { t, currentLang, changeLanguage, isLoading } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'de', name: 'German', flag: '🇩🇪' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Translation System Test</h1>
              <p className="text-slate-600">Test automatic translation functionality with multiple APIs</p>
            </div>

            {/* Current Language Display */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Current Language</h3>
                  <p className="text-slate-600">Language: {currentLang}</p>
                  <p className="text-slate-600">Loading: {isLoading ? 'Yes' : 'No'}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl">{languages.find(l => l.code === currentLang)?.flag || '🌐'}</div>
                  <p className="text-sm text-slate-500">{languages.find(l => l.code === currentLang)?.name || 'Unknown'}</p>
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Language</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      currentLang === lang.code
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-2xl mb-2">{lang.flag}</div>
                    <div className="font-medium">{lang.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Translated Content */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Translated Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg">
                    <span className="text-sm text-slate-500">Header - Sign In</span>
                    <p className="text-lg font-semibold mt-1">{t('header.sign_in')}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <span className="text-sm text-slate-500">Header - Register</span>
                    <p className="text-lg font-semibold mt-1">{t('header.register')}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <span className="text-sm text-slate-500">Header - Notifications</span>
                    <p className="text-lg font-semibold mt-1">{t('header.notifications')}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <span className="text-sm text-slate-500">Header - View All</span>
                    <p className="text-lg font-semibold mt-1">{t('header.view_all')}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg">
                    <span className="text-sm text-slate-500">Header - Language & Currency</span>
                    <p className="text-lg font-semibold mt-1">{t('header.language_currency')}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <span className="text-sm text-slate-500">Flights Title</span>
                    <p className="text-lg font-semibold mt-1">{t('flights.title')}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <span className="text-sm text-slate-500">Hotels Title</span>
                    <p className="text-lg font-semibold mt-1">{t('hotels.title')}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <span className="text-sm text-slate-500">Search Button</span>
                    <p className="text-lg font-semibold mt-1">{t('search.button')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* API Information */}
            <div className="bg-slate-50 rounded-2xl p-6 mt-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Translation APIs Used</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">DeepL API</h4>
                  <p className="text-slate-600">Primary translation service with high-quality translations</p>
                  <p className="text-xs text-slate-400 mt-2">API Key: 1143d2d5-1af4-4884-a5b4-947f8e5ee424:fx</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">LibreTranslate</h4>
                  <p className="text-slate-600">Free fallback translation service</p>
                  <p className="text-xs text-slate-400 mt-2">URL: https://libretranslate.de/translate</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">Mock Translations</h4>
                  <p className="text-slate-600">Development fallback with pre-translated text</p>
                  <p className="text-xs text-slate-400 mt-2">Used when external APIs are unavailable</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">RTL Support</h4>
                  <p className="text-slate-600">Automatic right-to-left text direction for Arabic, Hebrew, etc.</p>
                  <p className="text-xs text-slate-400 mt-2">Updates document direction and CSS styles</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• Click on different language flags to switch languages</li>
                <li>• Watch the translated content update in real-time</li>
                <li>• Check the "Current Language" section for status</li>
                <li>• For Arabic (🇸🇦), the page should switch to RTL layout</li>
                <li>• The system will try DeepL API first, then LibreTranslate, then mock translations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}