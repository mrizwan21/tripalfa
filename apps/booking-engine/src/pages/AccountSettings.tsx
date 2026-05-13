import React, { useState, useEffect } from 'react';
import { Key, CreditCard, ShieldCheck, Bell, User, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import PageHeader from '../components/layout/PageHeader';
import { Card } from '../components/ui/card';
import { formatCurrency } from '@tripalfa/ui-components';
import { DEFAULT_CONTENT_CONFIG, loadTenantContentConfig } from '../lib/tenantContentConfig';
import { Globe, LogOut, Trash2 } from 'lucide-react';

type CardItem = {
  id: string;
  brand: string;
  last4: string;
  exp: string;
  currency: string;
  balance?: number;
};

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

function AccountSettings(): React.JSX.Element {
  const [tab, setTab] = useState<
    'profile' | 'security' | 'payments' | 'notifications' | 'documents' | 'api'
  >('profile');

  const [accountContent, setAccountContent] = useState(DEFAULT_CONTENT_CONFIG.accountSettings);

  const [firstName, setFirstName] = useState(
    DEFAULT_CONTENT_CONFIG.accountSettings.profileDefaults.firstName
  );
  const [lastName, setLastName] = useState(
    DEFAULT_CONTENT_CONFIG.accountSettings.profileDefaults.lastName
  );
  const [email, setEmail] = useState(DEFAULT_CONTENT_CONFIG.accountSettings.profileDefaults.email);
  const [phone, setPhone] = useState(DEFAULT_CONTENT_CONFIG.accountSettings.profileDefaults.phone);
  const [cards, setCards] = useState<CardItem[]>(
    DEFAULT_CONTENT_CONFIG.accountSettings.paymentsDefaults.savedCards
  );
  const [notifications, setNotifications] = useState(
    DEFAULT_CONTENT_CONFIG.accountSettings.notificationsDefaults
  );
  const [apiKeys, setApiKeys] = useState(DEFAULT_CONTENT_CONFIG.accountSettings.apiDefaults);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadAccountContent = async () => {
      try {
        const contentConfig = await loadTenantContentConfig();
        const loadedAccountContent = contentConfig.accountSettings;
        setAccountContent(loadedAccountContent);
        setFirstName(loadedAccountContent.profileDefaults.firstName);
        setLastName(loadedAccountContent.profileDefaults.lastName);
        setEmail(loadedAccountContent.profileDefaults.email);
        setPhone(loadedAccountContent.profileDefaults.phone);
        setCards(loadedAccountContent.paymentsDefaults.savedCards);
        setNotifications(loadedAccountContent.notificationsDefaults);
        setApiKeys(loadedAccountContent.apiDefaults);
      } catch {
        setAccountContent(DEFAULT_CONTENT_CONFIG.accountSettings);
      }
    };

    try {
      const h = (window.location.hash || '').replace('#', '');
      if (
        h &&
        ['profile', 'security', 'payments', 'notifications', 'documents', 'api'].includes(h)
      ) {
        setTab(h as any);
      }
    } catch {
      // ignore
    }

    void loadAccountContent();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle switch component
  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-[#003b95]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <PageHeader title={accountContent.title} subtitle={accountContent.subtitle} />

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 hidden lg:block">
          <div className="sticky top-28 bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2 h-fit">
            <button
              onClick={() => setTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'profile'
                  ? 'bg-[#003b95] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User className="h-4 w-4" />
              {accountContent.tabs.profile}
            </button>
            <button
              onClick={() => setTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'security'
                  ? 'bg-[#003b95] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {accountContent.tabs.security}
            </button>
            <button
              onClick={() => setTab('payments')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'payments'
                  ? 'bg-[#003b95] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              {accountContent.tabs.payments}
            </button>
            <button
              onClick={() => setTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'notifications'
                  ? 'bg-[#003b95] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bell className="h-4 w-4" />
              {accountContent.tabs.notifications}
            </button>
            <button
              onClick={() => setTab('documents')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'documents'
                  ? 'bg-[#003b95] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download className="h-4 w-4" />
              {accountContent.tabs.documents}
            </button>
            <button
              onClick={() => setTab('api')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'api'
                  ? 'bg-[#003b95] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Key className="h-4 w-4" />
              {accountContent.tabs.api}
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Profile */}
          {tab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6">
              <h2 className="text-sm font-bold text-[#003b95] uppercase tracking-wider mb-6">
                Profile
              </h2>

              {/* Profile Photo */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="cursor-pointer inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <span className="border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors inline-block">
                      Upload Photo
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    First name
                  </label>
                  <input
                    id="account-first-name"
                    name="account-first-name"
                    className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-full"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Last name
                  </label>
                  <input
                    id="account-last-name"
                    name="account-last-name"
                    className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-full"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Email
                  </label>
                  <input
                    id="account-email"
                    name="account-email"
                    type="email"
                    className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-full"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Phone
                  </label>
                  <input
                    id="account-phone"
                    name="account-phone"
                    type="tel"
                    className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-full"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200">
                  Save profile
                </button>
                <button className="border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Security */}
          {tab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6">
                <h2 className="text-sm font-bold text-[#003b95] uppercase tracking-wider mb-6">
                  Security
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Change password</h3>
                    <div className="space-y-3">
                      <input
                        id="account-current-password"
                        name="account-current-password"
                        type="password"
                        placeholder="Current password"
                        className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-full"
                      />
                      <input
                        id="account-new-password"
                        name="account-new-password"
                        type="password"
                        placeholder="New password"
                        className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-full"
                      />
                      <input
                        id="account-confirm-password"
                        name="account-confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-full"
                      />
                    </div>
                    <div className="mt-4">
                      <button className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200">
                        Update password
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Two-factor authentication
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <p className="text-sm text-gray-600 mb-3">
                        Protect your account with 2FA via SMS or authenticator app.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <button className="border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors">
                          Enable SMS 2FA
                        </button>
                        <button className="border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors">
                          Enable Authenticator
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Active sessions</h4>
                      <div className="text-sm text-gray-600">
                        You are signed in on 2 devices.
                      </div>
                      <button className="mt-2 border border-red-200 text-red-600 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-red-50 transition-colors">
                        Sign out of other sessions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6">
              <h2 className="text-sm font-bold text-[#003b95] uppercase tracking-wider mb-6">
                Payment Methods & Billing
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Saved cards</h3>
                  <div className="space-y-3">
                    {cards.map(c => (
                      <div
                        key={c.id}
                        className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-2 hover:shadow-md transition-all duration-300"
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {c.brand} •••• {c.last4}
                          </div>
                          <div className="text-xs text-gray-500">Expires {c.exp}</div>
                          {typeof c.balance === 'number' && (
                            <div className="text-xs text-gray-500 mt-1">
                              Available: {formatCurrency(c.balance)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button className="border border-gray-200 text-gray-700 rounded-lg px-4 py-1.5 font-semibold text-xs hover:bg-gray-50 transition-colors">
                            Make default
                          </button>
                          <button className="border border-red-200 text-red-600 rounded-lg px-4 py-1.5 font-semibold text-xs hover:bg-red-50 transition-colors">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Add payment method</h3>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                    <input
                      id="account-card-number"
                      name="account-card-number"
                      placeholder="Card number"
                      className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-full"
                    />
                    <div className="flex gap-2">
                      <input
                        id="account-card-expiry"
                        name="account-card-expiry"
                        placeholder="MM/YY"
                        className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-1/3"
                      />
                      <input
                        id="account-card-cvc"
                        name="account-card-cvc"
                        placeholder="CVC"
                        className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-1/3"
                      />
                      <input
                        id="account-card-name"
                        name="account-card-name"
                        placeholder="Name on card"
                        className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 flex-1"
                      />
                    </div>
                    <button className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200 w-full">
                      Add card
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Billing address</h3>
                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                  <input
                    id="account-address-line1"
                    name="account-address-line1"
                    placeholder="Address line 1"
                    className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-full"
                  />
                  <input
                    id="account-city"
                    name="account-city"
                    placeholder="City"
                    className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-full"
                  />
                  <div className="flex gap-2">
                    <input
                      id="account-postal-code"
                      name="account-postal-code"
                      placeholder="Postal code"
                      className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 w-1/3"
                    />
                    <input
                      id="account-country"
                      name="account-country"
                      placeholder="Country"
                      className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6">
              <h2 className="text-sm font-bold text-[#003b95] uppercase tracking-wider mb-6">
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Marketing emails</div>
                    <div className="text-xs text-gray-500">Receive offers and product news</div>
                  </div>
                  <ToggleSwitch
                    checked={notifications.marketing}
                    onChange={() =>
                      setNotifications(s => ({ ...s, marketing: !s.marketing }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Booking updates</div>
                    <div className="text-xs text-gray-500">
                      Important messages about your trips
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={notifications.bookingUpdates}
                    onChange={() =>
                      setNotifications(s => ({ ...s, bookingUpdates: !s.bookingUpdates }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Promotional SMS</div>
                    <div className="text-xs text-gray-500">Occasional SMS about promotions</div>
                  </div>
                  <ToggleSwitch
                    checked={notifications.promoSms}
                    onChange={() => setNotifications(s => ({ ...s, promoSms: !s.promoSms }))}
                  />
                </div>

                <div className="mt-6">
                  <button className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200">
                    Save notification preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {tab === 'documents' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6">
              <h2 className="text-sm font-bold text-[#003b95] uppercase tracking-wider mb-6">
                Documents
              </h2>
              <div className="space-y-3">
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-2 hover:shadow-md transition-all duration-300">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Invoice - March 2025
                    </div>
                    <div className="text-xs text-gray-500">PDF • 120KB</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="border border-gray-200 text-gray-700 rounded-lg px-4 py-1.5 font-semibold text-xs hover:bg-gray-50 transition-colors">
                      Download
                    </button>
                    <button className="bg-[#003b95] text-white rounded-lg px-4 py-1.5 font-semibold text-xs shadow-md hover:bg-[#002a6e] transition-all duration-200">
                      Request copy
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  You can download invoices and booking confirmations here.
                </p>
              </div>
            </div>
          )}

          {/* API Keys */}
          {tab === 'api' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6">
              <h2 className="text-sm font-bold text-[#003b95] uppercase tracking-wider mb-6">
                API Keys
              </h2>
              <div className="space-y-3">
                {apiKeys.map(k => (
                  <div
                    key={k.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-2 hover:shadow-md transition-all duration-300"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{k.label}</div>
                      <div className="text-xs text-gray-500">{k.created}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-900 font-mono px-3 py-1 bg-gray-100 rounded-lg">
                        {k.key}
                      </div>
                      <button className="border border-gray-200 text-gray-700 rounded-lg px-4 py-1.5 font-semibold text-xs hover:bg-gray-50 transition-colors">
                        Regenerate
                      </button>
                      <button className="border border-red-200 text-red-600 rounded-lg px-4 py-1.5 font-semibold text-xs hover:bg-red-50 transition-colors">
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-4">
                  <button className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200">
                    Create new API key
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 bg-white rounded-xl border border-red-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4">
          Danger Zone
        </h3>
        <div className="flex flex-wrap gap-3">
          <button className="border border-red-200 text-red-600 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-red-50 transition-colors flex items-center gap-2">
            <LogOut size={16} />
            Sign out of all devices
          </button>
          <button className="border border-red-200 text-red-600 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-red-50 transition-colors flex items-center gap-2">
            <Trash2 size={16} />
            Delete account
          </button>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="lg:hidden fixed bottom-4 left-0 right-0 flex justify-center px-4 z-50">
        <div className="w-full max-w-3xl bg-white rounded-xl border border-gray-100 shadow-md p-2 flex justify-between items-center gap-1">
          <button
            onClick={() => setTab('profile')}
            className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'profile' ? 'bg-[#003b95] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User className="mx-auto h-5 w-5" />
          </button>
          <button
            onClick={() => setTab('security')}
            className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'security' ? 'bg-[#003b95] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ShieldCheck className="mx-auto h-5 w-5" />
          </button>
          <button
            onClick={() => setTab('payments')}
            className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'payments' ? 'bg-[#003b95] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="mx-auto h-5 w-5" />
          </button>
          <button
            onClick={() => setTab('notifications')}
            className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'notifications'
                ? 'bg-[#003b95] text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bell className="mx-auto h-5 w-5" />
          </button>
          <button
            onClick={() => setTab('api')}
            className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'api' ? 'bg-[#003b95] text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Key className="mx-auto h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;
