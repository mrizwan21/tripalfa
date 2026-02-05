import React, { useState, useEffect } from 'react';
import { useCurrency, detectUserCurrency, convertCurrency, formatCurrency } from '../lib/currency';
import { useTranslation, setCurrentLanguage, getCurrentLanguage } from '../lib/translation';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Globe, DollarSign, RefreshCw, TestTube, Wifi, WifiOff, MapPin, Languages, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function CurrencyTranslationTesting() {
  const { currency, setCurrency, rates, isLoading: currencyLoading } = useCurrency();
  const { t, translations, currentLang, changeLanguage, isLoading: translationLoading } = useTranslation();
  
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [manualCurrency, setManualCurrency] = useState('USD');
  const [testAmount, setTestAmount] = useState('100');
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{ gateway: boolean; static: boolean; user: boolean }>({
    gateway: false, static: false, user: false
  });

  // Test utilities
  const addTestResult = (test: string, passed: boolean, details: string, error?: string) => {
    setTestResults(prev => [...prev, {
      test,
      passed,
      details,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTest = async (testName: string, testFn: () => Promise<{ passed: boolean; details: string; error?: string }>) => {
    try {
      const result = await testFn();
      addTestResult(testName, result.passed, result.details, result.error);
    } catch (error) {
      addTestResult(testName, false, 'Test execution failed', error instanceof Error ? error.message : String(error));
    }
  };

  // API Connectivity Tests
  const testApiConnectivity = async () => {
    const results: { gateway: boolean; static: boolean; user: boolean } = { gateway: false, static: false, user: false };

    // Test API Gateway
    try {
      const response = await fetch('/api/translations?lang=en', { method: 'GET' });
      results.gateway = response.ok;
      setApiStatus(prev => ({ ...prev, gateway: results.gateway }));
    } catch (error) {
      console.error('API Gateway test failed:', error);
    }

    // Test Static Database
    try {
      const response = await fetch('/api/static/languages', { method: 'GET' });
      results.static = response.ok;
      setApiStatus(prev => ({ ...prev, static: results.static }));
    } catch (error) {
      console.error('Static Database test failed:', error);
    }

    // Test User Service
    try {
      const response = await fetch('/api/user/preferences', { method: 'GET' });
      results.user = response.ok || response.status === 401; // 401 is expected for unauthenticated requests
      setApiStatus(prev => ({ ...prev, user: results.user }));
    } catch (error) {
      console.error('User Service test failed:', error);
    }

    return results;
  };

  // Currency Detection Tests
  const testCurrencyDetection = async () => {
    try {
      const detected = await detectUserCurrency();
      setDetectedCurrency(detected);
      
      // Test if detection returns a valid currency
      const validCurrencies = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'AUD', 'CAD', 'CHF'];
      const isValid = validCurrencies.includes(detected);
      
      return {
        passed: !!isValid,
        details: `Detected currency: ${detected}. Valid: ${isValid}`,
        error: isValid ? undefined : `Invalid currency detected: ${detected}`
      };
    } catch (error) {
      return {
        passed: false,
        details: 'Currency detection failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Currency Conversion Tests
  const testCurrencyConversion = async () => {
    try {
      const amount = 100;
      const fromCurrency = 'USD';
      const toCurrency = 'EUR';
      
      const converted = convertCurrency(amount, fromCurrency, toCurrency);
      const formatted = formatCurrency(converted, toCurrency);
      
      // Basic validation: converted amount should be reasonable
      const isValid = converted > 0 && converted < 200; // EUR typically 0.5-2.0 times USD
      
      return {
        passed: isValid,
        details: `Converted ${amount} ${fromCurrency} to ${converted} ${toCurrency} (${formatted})`,
        error: isValid ? undefined : `Invalid conversion result: ${converted}`
      };
    } catch (error) {
      return {
        passed: false,
        details: 'Currency conversion failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Translation System Tests
  const testTranslationSystem = async () => {
    try {
      // Test if translations are loaded
      const hasTranslations = translations && Object.keys(translations).length > 0;
      
      // Test translation function
      const testKey = 'header.sign_in';
      const translated = t(testKey);
      const hasTranslation = translated && translated !== testKey;
      
      return {
        passed: hasTranslations && hasTranslation,
        details: `Translations loaded: ${hasTranslations}, Translation available: ${hasTranslation}`,
        error: hasTranslations && hasTranslation ? undefined : 'Translation system not working properly'
      };
    } catch (error) {
      return {
        passed: false,
        details: 'Translation system test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Language Switching Tests
  const testLanguageSwitching = async () => {
    try {
      // Test switching to Arabic
      await changeLanguage('Arabic');
      const arabicLang = getCurrentLanguage();
      
      // Test switching back to English
      await changeLanguage('English');
      const englishLang = getCurrentLanguage();
      
      const switchedCorrectly = arabicLang === 'Arabic' && englishLang === 'English';
      
      return {
        passed: switchedCorrectly,
        details: `Language switching: Arabic (${arabicLang}), English (${englishLang})`,
        error: switchedCorrectly ? undefined : 'Language switching failed'
      };
    } catch (error) {
      return {
        passed: false,
        details: 'Language switching test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Currency Switching Tests
  const testCurrencySwitching = async () => {
    try {
      // Test switching currencies
      await setCurrency('EUR');
      const eurCurrency = currency;
      
      await setCurrency('USD');
      const usdCurrency = currency;
      
      const switchedCorrectly = eurCurrency === 'EUR' && usdCurrency === 'USD';
      
      return {
        passed: switchedCorrectly,
        details: `Currency switching: EUR (${eurCurrency}), USD (${usdCurrency})`,
        error: switchedCorrectly ? undefined : 'Currency switching failed'
      };
    } catch (error) {
      return {
        passed: false,
        details: 'Currency switching test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Database Integration Tests
  const testDatabaseIntegration = async () => {
    try {
      // Test fetching currencies from database
      const currenciesResponse = await api.get('/currencies');
      const hasCurrencies = Array.isArray(currenciesResponse) && currenciesResponse.length > 0;
      
      // Test fetching exchange rates
      const ratesResponse = await api.get('/exchange-rates/latest');
      const hasRates = ratesResponse && ratesResponse.rates && Object.keys(ratesResponse.rates).length > 0;
      
      return {
        passed: hasCurrencies && hasRates,
        details: `Currencies: ${hasCurrencies ? currenciesResponse.length : 0}, Rates: ${hasRates ? Object.keys(ratesResponse.rates).length : 0}`,
        error: hasCurrencies && hasRates ? undefined : 'Database integration issues'
      };
    } catch (error) {
      return {
        passed: false,
        details: 'Database integration test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // RTL Support Tests
  const testRTLSupport = async () => {
    try {
      // Test Arabic language direction
      await changeLanguage('Arabic');
      
      // Check if document direction is set to RTL
      const dir = document.documentElement.dir;
      const isRTL = dir === 'rtl';
      
      // Switch back to English
      await changeLanguage('English');
      
      return {
        passed: isRTL,
        details: `RTL direction set: ${isRTL} (dir="${dir}")`,
        error: isRTL ? undefined : 'RTL support not working'
      };
    } catch (error) {
      return {
        passed: false,
        details: 'RTL support test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Performance Tests
  const testPerformance = async () => {
    try {
      const startTime = Date.now();
      
      // Test multiple currency conversions
      for (let i = 0; i < 100; i++) {
        convertCurrency(100, 'USD', 'EUR');
      }
      
      const conversionTime = Date.now() - startTime;
      
      // Test multiple translations
      const translationStart = Date.now();
      for (let i = 0; i < 100; i++) {
        t('header.sign_in');
      }
      const translationTime = Date.now() - translationStart;
      
      const isPerformanceGood = conversionTime < 1000 && translationTime < 500; // Under 1s for conversions, 0.5s for translations
      
      return {
        passed: isPerformanceGood,
        details: `Performance: Conversions ${conversionTime}ms, Translations ${translationTime}ms`,
        error: isPerformanceGood ? undefined : 'Performance issues detected'
      };
    } catch (error) {
      return {
        passed: false,
        details: 'Performance test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Run All Tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    // Test API connectivity first
    await testApiConnectivity();
    
    // Run individual tests
    await runTest('Currency Detection', testCurrencyDetection);
    await runTest('Currency Conversion', testCurrencyConversion);
    await runTest('Translation System', testTranslationSystem);
    await runTest('Language Switching', testLanguageSwitching);
    await runTest('Currency Switching', testCurrencySwitching);
    await runTest('Database Integration', testDatabaseIntegration);
    await runTest('RTL Support', testRTLSupport);
    await runTest('Performance', testPerformance);
    
    setIsRunningTests(false);
    alert('All tests completed!');
  };

  // Manual Testing Functions
  const testManualConversion = () => {
    try {
      const amount = parseFloat(testAmount);
      const converted = convertCurrency(amount, 'USD', manualCurrency);
      const formatted = formatCurrency(converted, manualCurrency);
      alert(`Manual test: ${amount} USD = ${formatted}`);
    } catch (error) {
      alert(`Manual test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testManualTranslation = () => {
    try {
      const translated = t('header.sign_in');
      alert(`Translation test: "${translated}"`);
    } catch (error) {
      alert(`Translation test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Calculate test statistics
  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <TestTube className="h-8 w-8 text-blue-600" />
            Currency & Translation Testing Suite
          </h1>
          <p className="text-slate-600">Comprehensive testing for currency detection, conversion, and translation systems</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            Status: {isRunningTests ? 'Running tests...' : totalTests > 0 ? `${passedTests}/${totalTests} passed (${successRate}%)` : 'Ready to test'}
          </div>
          <Button onClick={runAllTests} disabled={isRunningTests} className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            {isRunningTests ? 'Running...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {/* API Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className={`h-5 w-5 ${apiStatus.gateway ? 'text-green-600' : 'text-red-600'}`} />
            <span className="font-semibold">API Gateway</span>
          </div>
          <div className="text-sm text-slate-600">{apiStatus.gateway ? 'Connected' : 'Disconnected'}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className={`h-5 w-5 ${apiStatus.static ? 'text-green-600' : 'text-red-600'}`} />
            <span className="font-semibold">Static Database</span>
          </div>
          <div className="text-sm text-slate-600">{apiStatus.static ? 'Connected' : 'Disconnected'}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className={`h-5 w-5 ${apiStatus.user ? 'text-green-600' : 'text-red-600'}`} />
            <span className="font-semibold">User Service</span>
          </div>
          <div className="text-sm text-slate-600">{apiStatus.user ? 'Connected' : 'Disconnected'}</div>
        </div>
      </div>

      {/* Current System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Currency System Status</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Current Currency:</span>
              <span className="font-semibold">{currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Detected Currency:</span>
              <span className="font-semibold">{detectedCurrency || 'Not detected'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Exchange Rates Loaded:</span>
              <span className={`font-semibold ${Object.keys(rates).length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Object.keys(rates).length > 0 ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Rates Count:</span>
              <span className="font-semibold">{Object.keys(rates).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">System Loading:</span>
              <span className={`font-semibold ${currencyLoading ? 'text-yellow-600' : 'text-green-600'}`}>
                {currencyLoading ? 'Loading...' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded">
          <div className="flex items-center gap-2 mb-4">
            <Languages className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Translation System Status</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Current Language:</span>
              <span className="font-semibold">{currentLang}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Translations Loaded:</span>
              <span className={`font-semibold ${translations && Object.keys(translations).length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {translations && Object.keys(translations).length > 0 ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Translation Keys:</span>
              <span className="font-semibold">{translations ? Object.keys(translations).length : 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">System Loading:</span>
              <span className={`font-semibold ${translationLoading ? 'text-yellow-600' : 'text-green-600'}`}>
                {translationLoading ? 'Loading...' : 'Ready'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Document Direction:</span>
              <span className="font-semibold">{document.documentElement.dir}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Testing */}
      <div className="p-4 border rounded">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Manual Testing</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Test Amount (USD)</label>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Currency</label>
            <select
              value={manualCurrency}
              onChange={(e) => setManualCurrency(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {['USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'AUD', 'CAD', 'CHF'].map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={testManualConversion} className="w-full">
              Test Conversion
            </Button>
          </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={testManualTranslation} variant="outline">
            Test Translation
          </Button>
          <Button onClick={() => changeLanguage('Arabic')} variant="outline">
            Test Arabic RTL
          </Button>
          <Button onClick={() => changeLanguage('English')} variant="outline">
            Reset to English
          </Button>
        </div>
      </div>

      {/* Test Results */}
      <div className="p-4 border rounded">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Test Results</h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600">Passed: {passedTests}</span>
            <span className="text-red-600">Failed: {totalTests - passedTests}</span>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </div>
        </div>
        {testResults.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No test results yet. Click "Run All Tests" to start testing.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 p-2">Status</th>
                  <th className="border border-slate-300 p-2">Test</th>
                  <th className="border border-slate-300 p-2">Details</th>
                  <th className="border border-slate-300 p-2">Error</th>
                  <th className="border border-slate-300 p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index} className={result.passed ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="border border-slate-300 p-2">
                      {result.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </td>
                    <td className="border border-slate-300 p-2 font-semibold">{result.test}</td>
                    <td className="border border-slate-300 p-2">{result.details}</td>
                    <td className="border border-slate-300 p-2">
                      {result.error && (
                        <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-sm">{result.error}</span>
                      )}
                    </td>
                    <td className="border border-slate-300 p-2 text-xs text-slate-500">{result.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Test Summary */}
      {totalTests > 0 && (
        <div className="p-4 border rounded">
          <h3 className="text-lg font-semibold mb-4">Test Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
              <div className="text-sm text-slate-600">Success Rate</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              <div className="text-sm text-slate-600">Passed Tests</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-red-600">{totalTests - passedTests}</div>
              <div className="text-sm text-slate-600">Failed Tests</div>
            </div>
          </div>
          {successRate < 100 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Some tests failed. Please check the results above and verify the system configuration.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}