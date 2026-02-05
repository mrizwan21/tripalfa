import React, { useState, useEffect } from 'react';
import { Key, CreditCard, ShieldCheck, Bell, User, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import PageHeader from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';

type CardItem = { id: string; brand: string; last4: string; exp: string; currency: string; balance?: number };

export default function AccountSettings(): React.JSX.Element {
  const [tab, setTab] = useState<'profile' | 'security' | 'payments' | 'notifications' | 'documents' | 'api'>('profile');

  // Mocked state (replace with hooks/api integration)
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [email, setEmail] = useState('user@example.com');
  const [phone, setPhone] = useState('+1 555 123 4567');
  const [cards, setCards] = useState<CardItem[]>([
    { id: 'c1', brand: 'Visa', last4: '4242', exp: '12/26', currency: 'USD', balance: 120.5 },
    { id: 'c2', brand: 'Mastercard', last4: '8888', exp: '08/25', currency: 'USD' },
  ]);
  const [notifications, setNotifications] = useState({
    marketing: true,
    bookingUpdates: true,
    promoSms: false,
  });
  const [apiKeys] = useState([{ id: 'k1', label: 'Default key', key: 'sk_live_xxx...xyz', created: '2024-12-01' }]);

  // respect hash navigation (e.g. /account-settings#security)
  useEffect(() => {
    try {
      const h = (window.location.hash || '').replace('#', '');
      if (h && ['profile', 'security', 'payments', 'notifications', 'documents', 'api'].includes(h)) {
        setTab(h as any);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Account settings" subtitle="Manage profile, security, wallet and developer keys." />

      <div className="flex gap-6">
        {/* Local page sidebar */}
        <aside className="w-64 hidden lg:block">
          <div className="sticky top-28 bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/40 shadow">
            <nav className="space-y-2">
              <button onClick={() => setTab('profile')} className={`w-full text-left px-3 py-2 rounded-md ${tab === 'profile' ? 'bg-white/80 ring-1 ring-indigo-200' : 'hover:bg-white/30'}`}>
                <User className="inline-block mr-2 h-4 w-4 align-middle" /> Profile
              </button>
              <button onClick={() => setTab('security')} className={`w-full text-left px-3 py-2 rounded-md ${tab === 'security' ? 'bg-white/80 ring-1 ring-indigo-200' : 'hover:bg-white/30'}`}>
                <ShieldCheck className="inline-block mr-2 h-4 w-4 align-middle" /> Security
              </button>
              <button onClick={() => setTab('payments')} className={`w-full text-left px-3 py-2 rounded-md ${tab === 'payments' ? 'bg-white/80 ring-1 ring-indigo-200' : 'hover:bg-white/30'}`}>
                <CreditCard className="inline-block mr-2 h-4 w-4 align-middle" /> Payment Methods
              </button>
              <button onClick={() => setTab('notifications')} className={`w-full text-left px-3 py-2 rounded-md ${tab === 'notifications' ? 'bg-white/80 ring-1 ring-indigo-200' : 'hover:bg-white/30'}`}>
                <Bell className="inline-block mr-2 h-4 w-4 align-middle" /> Notifications
              </button>
              <button onClick={() => setTab('documents')} className={`w-full text-left px-3 py-2 rounded-md ${tab === 'documents' ? 'bg-white/80 ring-1 ring-indigo-200' : 'hover:bg-white/30'}`}>
                <Download className="inline-block mr-2 h-4 w-4 align-middle" /> Documents
              </button>
              <button onClick={() => setTab('api')} className={`w-full text-left px-3 py-2 rounded-md ${tab === 'api' ? 'bg-white/80 ring-1 ring-indigo-200' : 'hover:bg-white/30'}`}>
                <Key className="inline-block mr-2 h-4 w-4 align-middle" /> API Keys
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Profile */}
          {tab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-xs text-gray-500">First name</div>
                  <input id="account-first-name" name="account-first-name" className="mt-1 w-full p-3 border rounded-lg bg-white/70" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </label>
                <label className="block">
                  <div className="text-xs text-gray-500">Last name</div>
                  <input id="account-last-name" name="account-last-name" className="mt-1 w-full p-3 border rounded-lg bg-white/70" value={lastName} onChange={e => setLastName(e.target.value)} />
                </label>
                <label className="block sm:col-span-2">
                  <div className="text-xs text-gray-500">Email</div>
                  <input id="account-email" name="account-email" className="mt-1 w-full p-3 border rounded-lg bg-white/70" value={email} onChange={e => setEmail(e.target.value)} />
                </label>
                <label className="block sm:col-span-2">
                  <div className="text-xs text-gray-500">Phone</div>
                  <input id="account-phone" name="account-phone" className="mt-1 w-full p-3 border rounded-lg bg-white/70" value={phone} onChange={e => setPhone(e.target.value)} />
                </label>
              </div>

              <div className="mt-4 flex gap-2">
                <Button className="px-4 py-2">Save profile</Button>
                <Button variant="ghost" className="px-4 py-2">Cancel</Button>
              </div>
            </Card>
          )}

          {/* Security */}
          {tab === 'security' && (
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Security</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Change password</label>
                  <input id="account-current-password" name="account-current-password" type="password" placeholder="Current password" className="mt-1 w-full p-3 border rounded-lg bg-white/70" />
                  <input id="account-new-password" name="account-new-password" type="password" placeholder="New password" className="mt-2 w-full p-3 border rounded-lg bg-white/70" />
                  <input id="account-confirm-password" name="account-confirm-password" type="password" placeholder="Confirm new password" className="mt-2 w-full p-3 border rounded-lg bg-white/70" />
                  <div className="mt-3">
                    <Button>Update password</Button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500">Two-factor authentication</label>
                  <div className="mt-2 bg-white/70 p-3 rounded-lg border">
                    <p className="text-sm text-gray-700 mb-2">Protect your account with 2FA via SMS or authenticator app.</p>
                    <div className="flex gap-2">
                      <Button variant="outline">Enable SMS 2FA</Button>
                      <Button variant="outline">Enable Authenticator</Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs text-gray-500">Active sessions</label>
                    <div className="mt-2 text-sm text-gray-600">You are signed in on 2 devices. <button className="ml-2 text-indigo-600">Sign out of other sessions</button></div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Payment Methods & Billing</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-1">
                  <h3 className="text-sm text-gray-500 mb-2">Saved cards</h3>
                  <div className="space-y-3">
                    {cards.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-white/70">
                        <div>
                          <div className="text-sm font-medium">{c.brand} •••• {c.last4}</div>
                          <div className="text-xs text-gray-500">Expires {c.exp}</div>
                          {typeof c.balance === 'number' && <div className="text-xs text-gray-500 mt-1">Available: {formatCurrency(c.balance)}</div>}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost">Make default</Button>
                          <Button variant="outline">Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-1">
                  <h3 className="text-sm text-gray-500 mb-2">Add payment method</h3>
                  <div className="p-3 border rounded-lg bg-white/70">
                    <input id="account-card-number" name="account-card-number" placeholder="Card number" className="w-full p-3 border rounded-lg mb-2" />
                    <div className="flex gap-2">
                      <input id="account-card-expiry" name="account-card-expiry" placeholder="MM/YY" className="w-1/3 p-3 border rounded-lg" />
                      <input id="account-card-cvc" name="account-card-cvc" placeholder="CVC" className="w-1/3 p-3 border rounded-lg" />
                      <input id="account-card-name" name="account-card-name" placeholder="Name on card" className="flex-1 p-3 border rounded-lg" />
                    </div>
                    <div className="mt-3">
                      <Button>Add card</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm text-gray-500 mb-2">Billing address</h3>
                <div className="p-3 border rounded-lg bg-white/70">
                  <input id="account-address-line1" name="account-address-line1" placeholder="Address line 1" className="w-full p-3 border rounded-lg mb-2" />
                  <input id="account-city" name="account-city" placeholder="City" className="w-full p-3 border rounded-lg mb-2" />
                  <div className="flex gap-2">
                    <input id="account-postal-code" name="account-postal-code" placeholder="Postal code" className="w-1/3 p-3 border rounded-lg" />
                    <input id="account-country" name="account-country" placeholder="Country" className="flex-1 p-3 border rounded-lg" />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Notifications</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Marketing emails</div>
                    <div className="text-xs text-gray-500">Receive offers and product news</div>
                  </div>
                  <input type="checkbox" checked={notifications.marketing} onChange={() => setNotifications(s => ({ ...s, marketing: !s.marketing }))} />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Booking updates</div>
                    <div className="text-xs text-gray-500">Important messages about your trips</div>
                  </div>
                  <input type="checkbox" checked={notifications.bookingUpdates} onChange={() => setNotifications(s => ({ ...s, bookingUpdates: !s.bookingUpdates }))} />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Promotional SMS</div>
                    <div className="text-xs text-gray-500">Occasional SMS about promotions</div>
                  </div>
                  <input type="checkbox" checked={notifications.promoSms} onChange={() => setNotifications(s => ({ ...s, promoSms: !s.promoSms }))} />
                </label>

                <div className="mt-4">
                  <Button>Save notification preferences</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Documents */}
          {tab === 'documents' && (
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Documents</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-white/70">
                  <div>
                    <div className="text-sm font-medium">Invoice - March 2025</div>
                    <div className="text-xs text-gray-500">PDF • 120KB</div>
                  </div>
                  <div>
                    <Button variant="ghost">Download</Button>
                    <Button variant="outline" className="ml-2">Request copy</Button>
                  </div>
                </div>

                <div className="text-sm text-gray-500">You can download invoices and booking confirmations here.</div>
              </div>
            </Card>
          )}

          {/* API Keys */}
          {tab === 'api' && (
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">API Keys</h2>
              <div className="space-y-3">
                {apiKeys.map(k => (
                  <div key={k.id} className="flex items-center justify-between p-3 border rounded-lg bg-white/70">
                    <div>
                      <div className="text-sm font-medium">{k.label}</div>
                      <div className="text-xs text-gray-500">{k.created}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-700 font-mono px-3 py-1 bg-slate-100 rounded">{k.key}</div>
                      <Button variant="ghost">Regenerate</Button>
                      <Button variant="outline">Revoke</Button>
                    </div>
                  </div>
                ))}

                <div className="mt-3">
                  <Button>Create new API key</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="lg:hidden fixed bottom-4 left-0 right-0 flex justify-center px-4">
        <div className="w-full max-w-3xl bg-white/70 backdrop-blur rounded-full p-2 flex justify-between items-center px-3 border border-white/30 shadow-md">
          <button onClick={() => setTab('profile')} className={`flex-1 text-center py-2 ${tab === 'profile' ? 'text-indigo-700' : 'text-slate-600'}`}><User className="mx-auto" /></button>
          <button onClick={() => setTab('payments')} className={`flex-1 text-center py-2 ${tab === 'payments' ? 'text-indigo-700' : 'text-slate-600'}`}><CreditCard className="mx-auto" /></button>
          <button onClick={() => setTab('bookings' as any)} className={`flex-1 text-center py-2 text-slate-600`}><ShieldCheck className="mx-auto" /></button>
          <button onClick={() => setTab('notifications')} className={`flex-1 text-center py-2 ${tab === 'notifications' ? 'text-indigo-700' : 'text-slate-600'}`}><Bell className="mx-auto" /></button>
          <button onClick={() => setTab('api')} className={`flex-1 text-center py-2 ${tab === 'api' ? 'text-indigo-700' : 'text-slate-600'}`}><Key className="mx-auto" /></button>
        </div>
      </div>
    </div>
  );
}