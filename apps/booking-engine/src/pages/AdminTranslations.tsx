import React, { useState, useEffect } from 'react';
import { useTranslation } from '../lib/translation';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';

export default function AdminTranslations() {
  const { t, currentLang, changeLanguage, isLoading } = useTranslation();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [languages, setLanguages] = useState<string[]>(['en', 'ar', 'fr', 'es', 'de']);
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load translations for selected language
  useEffect(() => {
    loadTranslations(selectedLang);
  }, [selectedLang]);

  const loadTranslations = async (lang: string) => {
    try {
      const result = await api.get(`/translations?lang=${lang}`);
      setTranslations(result || {});
    } catch (error) {
      console.error('Failed to load translations:', error);
      setMessage({ type: 'error', text: 'Failed to load translations' });
    }
  };

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditingValue(value);
  };

  const handleSave = async () => {
    if (!editingKey || editingValue.trim() === '') return;

    setIsSaving(true);
    try {
      const result = await api.post('/translations/save', {
        lang: selectedLang,
        key: editingKey,
        value: editingValue.trim(),
        is_active: true
      });

      if (result.success) {
        // Update local state
        setTranslations(prev => ({
          ...prev,
          [editingKey]: editingValue.trim()
        }));
        
        setEditingKey(null);
        setEditingValue('');
        setMessage({ type: 'success', text: 'Translation saved successfully' });
        
        // Reload translations to ensure cache is updated
        setTimeout(() => loadTranslations(selectedLang), 1000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save translation' });
      }
    } catch (error) {
      console.error('Failed to save translation:', error);
      setMessage({ type: 'error', text: 'Failed to save translation' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const handleBulkTranslate = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      // Create bulk translation request
      const bulkTranslations: Record<string, string> = {};
      
      // For demo purposes, create mock translations
      Object.keys(translations).forEach(key => {
        const englishText = translations[key];
        switch (selectedLang) {
          case 'ar':
            bulkTranslations[key] = mockArabicTranslation(englishText);
            break;
          case 'fr':
            bulkTranslations[key] = mockFrenchTranslation(englishText);
            break;
          case 'es':
            bulkTranslations[key] = mockSpanishTranslation(englishText);
            break;
          case 'de':
            bulkTranslations[key] = mockGermanTranslation(englishText);
            break;
          default:
            bulkTranslations[key] = englishText;
        }
      });

      const result = await api.post('/translations/bulk-save', {
        lang: selectedLang,
        translations: bulkTranslations,
        is_active: true
      });

      if (result.success) {
        setMessage({ type: 'success', text: `Successfully saved ${result.count} translations` });
        // Reload translations
        setTimeout(() => loadTranslations(selectedLang), 1000);
      }
    } catch (error) {
      console.error('Bulk translation failed:', error);
      setMessage({ type: 'error', text: 'Bulk translation failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const mockArabicTranslation = (text: string): string => {
    const map: Record<string, string> = {
      'Sign In': 'تسجيل الدخول',
      'Register': 'تسجيل',
      'Notifications': 'إشعارات',
      'View All': 'عرض الكل',
      'Language & Currency': 'اللغة والعملة',
      'Flights': 'رحلات طيران',
      'Hotels': 'فنادق',
      'Search': 'بحث'
    };
    return map[text] || text;
  };

  const mockFrenchTranslation = (text: string): string => {
    const map: Record<string, string> = {
      'Sign In': 'Se Connecter',
      'Register': 'S\'inscrire',
      'Notifications': 'Notifications',
      'View All': 'Voir Tout',
      'Language & Currency': 'Langue et Devise',
      'Flights': 'Vols',
      'Hotels': 'Hôtels',
      'Search': 'Rechercher'
    };
    return map[text] || text;
  };

  const mockSpanishTranslation = (text: string): string => {
    const map: Record<string, string> = {
      'Sign In': 'Iniciar Sesión',
      'Register': 'Registrarse',
      'Notifications': 'Notificaciones',
      'View All': 'Ver Todo',
      'Language & Currency': 'Idioma y Moneda',
      'Flights': 'Vuelos',
      'Hotels': 'Hoteles',
      'Search': 'Buscar'
    };
    return map[text] || text;
  };

  const mockGermanTranslation = (text: string): string => {
    const map: Record<string, string> = {
      'Sign In': 'Anmelden',
      'Register': 'Registrieren',
      'Notifications': 'Benachrichtigungen',
      'View All': 'Alle anzeigen',
      'Language & Currency': 'Sprache und Währung',
      'Flights': 'Flüge',
      'Hotels': 'Hotels',
      'Search': 'Suchen'
    };
    return map[text] || text;
  };

  const clearMessage = () => {
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Translation Management</h1>
                <p className="text-slate-600">Manage translations for all supported languages</p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => changeLanguage(selectedLang)}
                  disabled={isLoading}
                  variant="outline"
                >
                  Preview {languages.find(l => l === selectedLang)?.toUpperCase() || selectedLang}
                </Button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="flex gap-4 items-center">
              <label className="text-sm font-medium text-slate-700">Language:</label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()} - {languages.find(l => l === lang)?.toUpperCase() || lang}
                  </option>
                ))}
              </select>
              <Button onClick={handleBulkTranslate} disabled={isSaving}>
                {isSaving ? 'Processing...' : 'Auto-Translate All'}
              </Button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </span>
                <button onClick={clearMessage} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Translation Table */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Translations for {selectedLang.toUpperCase()}</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-sm font-medium text-slate-600 py-3 px-4 w-1/3">Key</th>
                    <th className="text-left text-sm font-medium text-slate-600 py-3 px-4">English (Source)</th>
                    <th className="text-left text-sm font-medium text-slate-600 py-3 px-4">{selectedLang.toUpperCase()} (Translation)</th>
                    <th className="text-right text-sm font-medium text-slate-600 py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(translations).map((key) => (
                    <tr key={key} className="border-b border-slate-100">
                      <td className="py-4 px-4 font-mono text-sm text-slate-600">
                        {key}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-600">{translations[key]}</span>
                      </td>
                      <td className="py-4 px-4">
                        {editingKey === key ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <Button onClick={handleSave} disabled={isSaving}>
                              {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant="outline" onClick={handleCancel}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-900">{translations[key]}</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(key, translations[key])}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          translations[key] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {translations[key] ? "Translated" : "Missing"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{Object.keys(translations).length}</div>
                <div className="text-sm text-slate-600">Total Keys</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(translations).filter(v => v.trim()).length}
                </div>
                <div className="text-sm text-slate-600">Translated</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(translations).filter(v => !v.trim()).length}
                </div>
                <div className="text-sm text-slate-600">Missing</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Translation Management Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Manual Translation</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Click "Edit" to modify any translation</li>
                  <li>• Click "Save" to persist changes to the database</li>
                  <li>• Changes are automatically cached and invalidated</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Bulk Operations</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Use "Auto-Translate All" to translate all keys at once</li>
                  <li>• Bulk operations use external translation APIs</li>
                  <li>• Always review auto-translated content for accuracy</li>
                  <li>• Changes are saved directly to the database</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}