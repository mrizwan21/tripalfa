import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  LogOut,
  Plane,
  Upload,
  Trash2,
  Download,
  TrendingUp,
  Gift,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { formatCurrency } from '@tripalfa/ui-components';
import { useNavigate } from 'react-router-dom';
import { api, setAccessToken, listDocuments, uploadDocument, deleteDocument } from '../lib/api';
import PageHeader from '../components/layout/PageHeader';
import { useLoyaltyBalance } from '../hooks/useLoyaltyBalance';
import { LoyaltyTierBadge } from '../components/loyalty/LoyaltyTierBadge';
import { TierProgressBar } from '../components/loyalty/TierProgressBar';
import type { TierBenefits } from '../types/loyalty';
import { DEFAULT_CONTENT_CONFIG, loadTenantContentConfig } from '../lib/tenantContentConfig';
import { Label } from '@/components/ui/label';

type Booking = {
  id: string;
  type: 'flight' | 'hotel';
  date: string;
  status: string;
  amount: number;
  details?: any;
};

// Initial mock removed, empty array applied below for strict data representation

// Default tier for fallback
const defaultTier: TierBenefits = {
  id: 'bronze',
  name: 'Bronze',
  level: 1,
  minPoints: 0,
  maxPoints: 999,
  discountPercentage: 5,
  pointsMultiplier: 1,
  benefits: ['5% discount'],
};

function createLocationPrefs(
  tags: string[],
  seed?: Record<string, boolean>
): Record<string, boolean> {
  return tags.reduce<Record<string, boolean>>((acc, tag) => {
    acc[tag] = seed?.[tag] ?? false;
    return acc;
  }, {});
}

function Profile(): React.JSX.Element {
  const navigate = useNavigate();
  const [profileOptions, setProfileOptions] = useState(DEFAULT_CONTENT_CONFIG.profile.options);
  const countryCodes = profileOptions.countryCodes;
  const countries = profileOptions.countries;
  const currencies = profileOptions.currencies;
  const hotelCategories = profileOptions.hotelCategories;
  const locationPreferenceTags = profileOptions.locationPreferenceTags;

  // Tabs
  const [tab, setTab] = useState<'personal' | 'preferences' | 'documents'>('personal');

  // Loyalty hook for real-time balance and tier updates
  const { balance, isLoading: loyaltyLoading } = useLoyaltyBalance();

  // Extract tier from balance or use default
  const currentTier = balance?.tier || defaultTier;

  // Profile state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountry, setPhoneCountry] = useState(countryCodes[0] || '+1');
  const [mobileNumber, setMobileNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState(countries[0] || 'United States');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [points, setPoints] = useState(0);

  // Passport & Residency
  const [passportNo, setPassportNo] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [passportIssuingCountry, setPassportIssuingCountry] = useState(
    countries[0] || 'United States'
  );
  const [residencyNo, setResidencyNo] = useState('');
  const [residencyExpiry, setResidencyExpiry] = useState('');
  const [residencyIssuingCountry, setResidencyIssuingCountry] = useState(
    countries[0] || 'United States'
  );

  // Preferences
  const [airlinePref, setAirlinePref] = useState('');
  const [seatPref, setSeatPref] = useState('');
  const [mealPref, setMealPref] = useState('');
  const [cabinPref, setCabinPref] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [languageOptions, setLanguageOptions] = useState<
    Array<{ code: string; name: string; flag?: string }>
  >([]);
  const [languagePref, setLanguagePref] = useState('en');
  const [currencyPref, setCurrencyPref] = useState(currencies[0] || 'USD');
  const [hotelCategoryPref, setHotelCategoryPref] = useState(hotelCategories[0] || 'Any');
  const [locationPrefs, setLocationPrefs] = useState<Record<string, boolean>>(
    createLocationPrefs(locationPreferenceTags)
  );

  // Loyalty program
  const [loyaltyModule, setLoyaltyModule] = useState<'flight' | 'hotel' | 'car' | ''>('');
  const [loyaltyNumber, setLoyaltyNumber] = useState('');

  // Bookings & login history
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Documents module state
  const [documents, setDocuments] = useState<any[]>([]);
  const [docUploading, setDocUploading] = useState(false);
  const [docType, setDocType] = useState<string>('passport');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docMaskedCard, setDocMaskedCard] = useState('');
  const [docCardHolder, setDocCardHolder] = useState('');

  useEffect(() => {
    (async () => {
      let contentOptions = DEFAULT_CONTENT_CONFIG.profile.options;
      try {
        const contentConfig = await loadTenantContentConfig();
        contentOptions = contentConfig.profile.options;
        setProfileOptions(contentOptions);
      } catch {
        // ignore
      }

      try {
        const user: any = await api.get('/user/profile');
        if (user) {
          setFirstName(user.firstName || '');
          setLastName(user.lastName || '');
          setEmail(user.email || '');
          setPhoneCountry(user.phoneCountry || contentOptions.countryCodes[0] || '+1');
          setMobileNumber(user.mobileNumber || '');
          setAddressLine1(user.addressLine1 || '');
          setAddressLine2(user.addressLine2 || '');
          setPostalCode(user.postalCode || '');
          setCity(user.city || '');
          setCountry(user.country || contentOptions.countries[0] || 'United States');
          setNationality(user.nationality || '');
          setDob(user.dob || '');
          setGender(user.gender || '');
          setMemberSince(user.memberSince || 'Jan 2024');
          setPoints(user.points || balance?.currentPoints || 0);

          setPassportNo(user.passportNo || '');
          setPassportExpiry(user.passportExpiry || '');
          setPassportIssuingCountry(
            user.passportIssuingCountry || contentOptions.countries[0] || 'United States'
          );
          setResidencyNo(user.residencyNo || '');
          setResidencyExpiry(user.residencyExpiry || '');
          setResidencyIssuingCountry(
            user.residencyIssuingCountry || contentOptions.countries[0] || 'United States'
          );

          setAirlinePref(user.airlinePref || '');
          setSeatPref(user.seatPref || '');
          setMealPref(user.mealPref || '');
          setCabinPref(user.cabinPref || '');
          setSpecialRequest(user.specialRequest || '');
          setLanguagePref(user.languagePref || 'en');
          setCurrencyPref(user.currencyPref || contentOptions.currencies[0] || 'USD');
          setHotelCategoryPref(
            user.hotelCategoryPref || contentOptions.hotelCategories[0] || 'Any'
          );
          setLocationPrefs(
            createLocationPrefs(contentOptions.locationPreferenceTags, user.locationPrefs)
          );
          setLoyaltyModule(user.loyaltyModule || '');
          setLoyaltyNumber(user.loyaltyNumber || '');
          if (user.avatar) setAvatarPreview(user.avatar);
        } else {
          setFirstName('John');
          setLastName('Doe');
          setEmail('john.doe@example.com');
          setMemberSince('Jan 2023');
          setPoints(balance?.currentPoints || 12500);
        }
      } catch {
        setFirstName('John');
        setLastName('Doe');
        setEmail('john.doe@example.com');
        setMemberSince('Jan 2023');
        setPoints(balance?.currentPoints || 12500);
      }

      try {
        const langs: any = await api.get('/api/liteapi/languages');
        if (Array.isArray(langs) && langs.length) {
          if (typeof langs[0] === 'object') {
            setLanguageOptions(
              langs
                .map((l: any) => ({
                  code: String(l.code || l.name || '').toLowerCase(),
                  name: String(l.name || l.code || ''),
                  flag: typeof l.flag === 'string' ? l.flag : '🌐',
                }))
                .filter((l: any) => l.code && l.name)
            );
          } else {
            setLanguageOptions(
              langs.filter(Boolean).map((l: any) => ({
                code: String(l).toLowerCase(),
                name: String(l),
                flag: '🌐',
              }))
            );
          }
        }
      } catch {
        // ignore
      }

      try {
        const lh: any = await api.get('/auth/login-history');
        if (Array.isArray(lh)) setLoginHistory(lh);
        else
          setLoginHistory([
            {
              id: 'L-1',
              when: new Date().toISOString(),
              ip: '203.0.113.45',
              device: 'Chrome on macOS',
              action: 'Signed in',
            },
          ]);
      } catch {
        setLoginHistory([
          {
            id: 'L-1',
            when: new Date().toISOString(),
            ip: '203.0.113.45',
            device: 'Chrome on macOS',
            action: 'Signed in',
          },
        ]);
      }

      try {
        const b: any = await api.get('/user/bookings');
        if (b && Array.isArray(b.items))
          setBookings(
            b.items.map((it: any) => ({
              id: it.bookingId || it.id,
              type: it.product || 'hotel',
              date: it.createdAt || '',
              status: it.status || '',
              amount: it.total?.amount || 0,
              details: it.details,
            }))
          );
      } catch {
        // no fallback to mock, leave as empty array
        setBookings([]);
      }

      // load documents
      try {
        const docs: any = await listDocuments();
        if (Array.isArray(docs)) setDocuments(docs);
        else if (docs?.length) setDocuments(docs);
      } catch {
        // ignore
      }
    })();
  }, [balance]);

  useEffect(() => {
    setPhoneCountry(prev => (countryCodes.includes(prev) ? prev : countryCodes[0] || '+1'));
    setCountry(prev => (countries.includes(prev) ? prev : countries[0] || 'United States'));
    setPassportIssuingCountry(prev =>
      countries.includes(prev) ? prev : countries[0] || 'United States'
    );
    setResidencyIssuingCountry(prev =>
      countries.includes(prev) ? prev : countries[0] || 'United States'
    );
    setCurrencyPref(prev => (currencies.includes(prev) ? prev : currencies[0] || 'USD'));
    setHotelCategoryPref(prev =>
      hotelCategories.includes(prev) ? prev : hotelCategories[0] || 'Any'
    );
    setLocationPrefs(prev => createLocationPrefs(locationPreferenceTags, prev));
  }, [countryCodes, countries, currencies, hotelCategories, locationPreferenceTags]);

  function handleAvatarChange(file?: File | null) {
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  function validateAll() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Valid email is required';
    if (!mobileNumber.trim() || !/^[0-9]{6,15}$/.test(mobileNumber.replace(/\s+/g, '')))
      e.mobileNumber = 'Valid mobile number is required (6-15 digits)';
    if (!addressLine1.trim()) e.addressLine1 = 'Address is required';
    if (!postalCode.trim()) e.postalCode = 'Postal code is required';
    if (!city.trim()) e.city = 'City is required';
    if (!country.trim()) e.country = 'Country is required';
    if (passportNo.trim()) {
      if (!passportExpiry) e.passportExpiry = 'Passport expiry required';
      if (!passportIssuingCountry) e.passportIssuingCountry = 'Passport issuing country required';
    }
    if (residencyNo.trim()) {
      if (!residencyExpiry) e.residencyExpiry = 'Residency expiry required';
      if (!residencyIssuingCountry)
        e.residencyIssuingCountry = 'Residency issuing country required';
    }
    if (!languagePref) e.languagePref = 'Language required';
    if (!currencyPref) e.currencyPref = 'Currency required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSaveProfile() {
    setMessage(null);
    if (!validateAll()) {
      setMessage('Please fix validation errors');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = avatarPreview;
      if (avatarFile) avatarUrl = avatarPreview;
      const payload = {
        firstName,
        lastName,
        email,
        phoneCountry,
        mobileNumber,
        addressLine1,
        addressLine2,
        postalCode,
        city,
        country,
        nationality,
        dob,
        gender,
        avatar: avatarUrl,
        passportNo,
        passportExpiry,
        passportIssuingCountry,
        residencyNo,
        residencyExpiry,
        residencyIssuingCountry,
        airlinePref,
        seatPref,
        mealPref,
        cabinPref,
        specialRequest,
        languagePref,
        currencyPref,
        hotelCategoryPref,
        locationPrefs,
        loyaltyModule,
        loyaltyNumber,
      };
      const res = await api.post('/user/profile', payload);
      if (res?.accessToken) setAccessToken(res.accessToken);
      setMessage('Profile saved');
    } catch (err: any) {
      setMessage(err?.message || 'Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  function toggleLocationPref(k: string) {
    setLocationPrefs(prev => ({ ...prev, [k]: !prev[k] }));
  }

  async function handleDocFileChange(f?: File | null) {
    setDocFile(f || null);
  }

  async function handleUploadDocument(e?: React.FormEvent) {
    e?.preventDefault();
    if (!docFile) {
      setMessage('Select a file to upload');
      setTimeout(() => setMessage(null), 2000);
      return;
    }
    // require masked card info when type is credit-card
    if (docType === 'credit-card' && (!docMaskedCard.trim() || !docCardHolder.trim())) {
      setMessage('Provide masked card and cardholder name for card uploads');
      setTimeout(() => setMessage(null), 2000);
      return;
    }
    setDocUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const content = String(reader.result || '');
        const meta: any = {};
        if (docType === 'credit-card')
          ((meta.maskedCard = docMaskedCard), (meta.cardHolder = docCardHolder));
        const payload = {
          type: docType,
          fileName: docFile.name,
          size: docFile.size,
          mime: docFile.type,
          content,
          meta,
        };
        const saved = await uploadDocument(payload);
        setDocuments(prev => [saved, ...prev]);
        setDocFile(null);
        setDocMaskedCard('');
        setDocCardHolder('');
        setMessage('Document uploaded');
      };
      reader.readAsDataURL(docFile);
    } catch (err: any) {
      setMessage(err?.message || 'Upload failed');
    } finally {
      setDocUploading(false);
      setTimeout(() => setMessage(null), 2000);
    }
  }

  async function handleDeleteDocument(id: string) {
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      setMessage('Document deleted');
    } catch {
      setMessage('Delete failed');
    } finally {
      setTimeout(() => setMessage(null), 2000);
    }
  }

  // Get current points from balance or fallback to state
  const currentPoints = balance?.currentPoints ?? points;
  const nextTierThreshold = balance?.nextTierThreshold ?? 1000;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="My Account"
        subtitle="Manage profile, bookings, security, preferences and documents."
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/wallet')}>
              <CreditCard className="mr-2" />
              Wallet
            </Button>
            <Button onClick={() => navigate('/account-settings')}>
              <User className="mr-2" />
              Settings
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <Card className="p-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-full bg-background/60 overflow-hidden border">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-muted-foreground bg-background/30 gap-2">
                    {firstName ? firstName.charAt(0) : 'U'}
                  </div>
                )}
              </div>
              <Label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer font-medium">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleAvatarChange(e.target.files?.[0] || null)}
                />
                <Upload className="h-4 w-4" /> Change avatar
              </Label>

              <div className="w-full mt-3 text-center">
                <div className="text-sm font-semibold">
                  {firstName} {lastName}
                </div>
                <div className="text-xs text-muted-foreground">Member since {memberSince}</div>

                {/* Loyalty Tier Badge */}
                <div className="mt-3 flex justify-center gap-4">
                  <LoyaltyTierBadge tier={currentTier} />
                </div>

                {/* Points Display */}
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-background/80 border">
                  <Gift className="h-3 w-3" />
                  <div className="text-sm">
                    Points: <span className="font-medium">{currentPoints.toLocaleString()}</span>
                  </div>
                </div>

                {/* Tier Progress */}
                <div className="mt-4">
                  <TierProgressBar
                    currentPoints={currentPoints}
                    nextTierThreshold={nextTierThreshold}
                    tierName={currentTier.name}
                  />
                </div>
              </div>
            </div>
          </Card>
        </aside>

        <div className="lg:col-span-3 space-y-6">
          {/* local tabs - Attractive Style */}
          <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
            <Button
              variant="primary"
              size="md"
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${tab === 'personal' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              onClick={() => setTab('personal')}
            >
              Personal Information
            </Button>
            <Button
              variant="primary"
              size="md"
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${tab === 'preferences' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              onClick={() => setTab('preferences')}
            >
              Preferences & Loyalty
            </Button>
            <Button
              variant="primary"
              size="md"
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${tab === 'documents' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              onClick={() => setTab('documents')}
            >
              Documents
            </Button>
          </div>

          {tab === 'personal' && (
            <>
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4 gap-4">
                  <h2 className="text-lg font-medium text-2xl font-semibold tracking-tight">
                    Personal information
                  </h2>
                  <div className="text-sm text-muted-foreground">Keep your profile up to date</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">First name*</Label>
                    <input
                      id="profile-first-name"
                      name="profile-first-name"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                    {errors.firstName && (
                      <div className="text-xs text-blue-600">{errors.firstName}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">Last name*</Label>
                    <input
                      id="profile-last-name"
                      name="profile-last-name"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                    {errors.lastName && (
                      <div className="text-xs text-blue-600">{errors.lastName}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">Email*</Label>
                    <input
                      id="profile-email"
                      name="profile-email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                    {errors.email && <div className="text-xs text-blue-600">{errors.email}</div>}
                  </div>

                  {/* Phone split */}
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">
                      Phone / Mobile*
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <select
                        id="profile-phone-country"
                        name="profile-phone-country"
                        value={phoneCountry}
                        onChange={e => setPhoneCountry(e.target.value)}
                        className="p-3 border rounded w-28"
                      >
                        {countryCodes.map(c => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <input
                        id="profile-mobile-number"
                        name="profile-mobile-number"
                        value={mobileNumber}
                        onChange={e => setMobileNumber(e.target.value)}
                        placeholder="Mobile number"
                        className="flex-1 p-3 border rounded-lg gap-4"
                      />
                    </div>
                    {errors.mobileNumber && (
                      <div className="text-xs text-blue-600">{errors.mobileNumber}</div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground font-medium">
                      Address line 1*
                    </Label>
                    <input
                      id="profile-address-line1"
                      name="profile-address-line1"
                      value={addressLine1}
                      onChange={e => setAddressLine1(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                    {errors.addressLine1 && (
                      <div className="text-xs text-blue-600">{errors.addressLine1}</div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground font-medium">
                      Address line 2
                    </Label>
                    <input
                      id="profile-address-line2"
                      name="profile-address-line2"
                      value={addressLine2}
                      onChange={e => setAddressLine2(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">
                      Postal code*
                    </Label>
                    <input
                      id="profile-postal-code"
                      name="profile-postal-code"
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                    {errors.postalCode && (
                      <div className="text-xs text-blue-600">{errors.postalCode}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">City*</Label>
                    <input
                      id="profile-city"
                      name="profile-city"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                    {errors.city && <div className="text-xs text-blue-600">{errors.city}</div>}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">Country*</Label>
                    <select
                      id="profile-country"
                      name="profile-country"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    >
                      {countries.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <div className="text-xs text-blue-600">{errors.country}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">Nationality</Label>
                    <input
                      id="profile-nationality"
                      name="profile-nationality"
                      value={nationality}
                      onChange={e => setNationality(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">
                      Date of birth
                    </Label>
                    <input
                      id="profile-dob"
                      name="profile-dob"
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-medium">Gender</Label>
                    <select
                      id="profile-gender"
                      name="profile-gender"
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Passport & Residency */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-xl font-semibold tracking-tight">
                      Passport details
                    </h3>
                    <Label className="text-xs text-muted-foreground font-medium">Passport No</Label>
                    <input
                      id="profile-passport-no"
                      name="profile-passport-no"
                      value={passportNo}
                      onChange={e => setPassportNo(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                    <Label className="text-xs text-muted-foreground mt-2 font-medium">Expiry</Label>
                    <input
                      id="profile-passport-expiry"
                      name="profile-passport-expiry"
                      type="date"
                      value={passportExpiry}
                      onChange={e => setPassportExpiry(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                    <Label className="text-xs text-muted-foreground mt-2 font-medium">
                      Issuing country
                    </Label>
                    <select
                      id="profile-passport-issuing-country"
                      name="profile-passport-issuing-country"
                      value={passportIssuingCountry}
                      onChange={e => setPassportIssuingCountry(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    >
                      {countries.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.passportExpiry && (
                      <div className="text-xs text-blue-600">{errors.passportExpiry}</div>
                    )}
                    {errors.passportIssuingCountry && (
                      <div className="text-xs text-blue-600">{errors.passportIssuingCountry}</div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2 text-xl font-semibold tracking-tight">
                      Residency details
                    </h3>
                    <Label className="text-xs text-muted-foreground font-medium">
                      Residency No
                    </Label>
                    <input
                      id="profile-residency-no"
                      name="profile-residency-no"
                      value={residencyNo}
                      onChange={e => setResidencyNo(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                    <Label className="text-xs text-muted-foreground mt-2 font-medium">Expiry</Label>
                    <input
                      id="profile-residency-expiry"
                      name="profile-residency-expiry"
                      type="date"
                      value={residencyExpiry}
                      onChange={e => setResidencyExpiry(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    />
                    <Label className="text-xs text-muted-foreground mt-2 font-medium">
                      Issuing country
                    </Label>
                    <select
                      id="profile-residency-issuing-country"
                      name="profile-residency-issuing-country"
                      value={residencyIssuingCountry}
                      onChange={e => setResidencyIssuingCountry(e.target.value)}
                      className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    >
                      {countries.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.residencyExpiry && (
                      <div className="text-xs text-blue-600">{errors.residencyExpiry}</div>
                    )}
                    {errors.residencyIssuingCountry && (
                      <div className="text-xs text-blue-600">{errors.residencyIssuingCountry}</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button onClick={handleSaveProfile} isLoading={saving}>
                    Save changes
                  </Button>
                  <Button variant="ghost" onClick={() => window.location.reload()}>
                    Cancel
                  </Button>
                  {message && <div className="ml-4 text-sm text-blue-600">{message}</div>}
                </div>
              </Card>

              {/* bookings & security remain unchanged below */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h2 className="text-lg font-medium text-2xl font-semibold tracking-tight">
                    Recent bookings
                  </h2>
                  <div className="text-sm text-muted-foreground">Manage and act on bookings</div>
                </div>
                <div className="space-y-3">
                  {bookings.map(b => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 border rounded gap-2"
                    >
                      <div>
                        <div className="font-semibold">
                          {b.type === 'flight' ? 'Flight booking' : 'Hotel booking'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Booking ID: {b.id} • {new Date(b.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <div className="font-semibold">{formatCurrency(b.amount)}</div>
                          <div className="text-xs text-muted-foreground">{b.status}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/bookings/${b.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h2 className="text-lg font-medium text-2xl font-semibold tracking-tight">
                    Security & login history
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-2 text-xl font-semibold tracking-tight">
                      Change password
                    </h3>
                    <input
                      id="profile-current-password"
                      name="profile-current-password"
                      placeholder="Current password"
                      type="password"
                      className="w-full p-3 border rounded mb-2"
                    />
                    <input
                      id="profile-new-password"
                      name="profile-new-password"
                      placeholder="New password"
                      type="password"
                      className="w-full p-3 border rounded mb-2"
                    />
                    <input
                      id="profile-confirm-password"
                      name="profile-confirm-password"
                      placeholder="Confirm new password"
                      type="password"
                      className="w-full p-3 border rounded mb-2"
                    />
                    <div className="mt-2">
                      <Button>Update password</Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-2 text-xl font-semibold tracking-tight">
                      Login history
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {loginHistory.map((l: any) => (
                        <div
                          key={l.id}
                          className="p-2 border rounded bg-background/70 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-sm">{l.device}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(l.when).toLocaleString()} • {l.ip}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{l.action}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-sm">
                      <Button
                        variant="ghost"
                        size="md"
                        className="px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted"
                        onClick={() => alert('Sign out of other sessions (mock)')}
                      >
                        Sign out of other sessions
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {tab === 'preferences' && (
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4 text-2xl font-semibold tracking-tight">
                Preferences & Loyalty
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground font-medium">
                    Airline preference
                  </Label>
                  <input
                    id="profile-airline-pref"
                    name="profile-airline-pref"
                    value={airlinePref}
                    onChange={e => setAirlinePref(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-medium">
                    Preferred seat
                  </Label>
                  <input
                    id="profile-seat-pref"
                    name="profile-seat-pref"
                    value={seatPref}
                    onChange={e => setSeatPref(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-medium">
                    Preferred meal
                  </Label>
                  <input
                    id="profile-meal-pref"
                    name="profile-meal-pref"
                    value={mealPref}
                    onChange={e => setMealPref(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-medium">
                    Preferred cabin
                  </Label>
                  <input
                    id="profile-cabin-pref"
                    name="profile-cabin-pref"
                    value={cabinPref}
                    onChange={e => setCabinPref(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground font-medium">
                    Special requests
                  </Label>
                  <textarea
                    id="profile-special-request"
                    name="profile-special-request"
                    value={specialRequest}
                    onChange={e => setSpecialRequest(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground font-medium">Language*</Label>
                  <select
                    id="profile-language-pref"
                    name="profile-language-pref"
                    value={languagePref}
                    onChange={e => setLanguagePref(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                  >
                    {(languageOptions.length
                      ? languageOptions
                      : [
                          {
                            code: languagePref || 'en',
                            name: languagePref || 'en',
                            flag: '🌐',
                          },
                        ]
                    ).map(l => (
                      <option key={l.code} value={l.code}>{`${l.flag || '🌐'} ${l.name}`}</option>
                    ))}
                  </select>
                  {errors.languagePref && (
                    <div className="text-xs text-blue-600">{errors.languagePref}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-medium">
                    Preferred currency*
                  </Label>
                  <select
                    id="profile-currency-pref"
                    name="profile-currency-pref"
                    value={currencyPref}
                    onChange={e => setCurrencyPref(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                  >
                    {currencies.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.currencyPref && (
                    <div className="text-xs text-blue-600">{errors.currencyPref}</div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground font-medium">
                    Hotel category
                  </Label>
                  <select
                    id="profile-hotel-category-pref"
                    name="profile-hotel-category-pref"
                    value={hotelCategoryPref}
                    onChange={e => setHotelCategoryPref(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                  >
                    {hotelCategories.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground font-medium">
                    Location preferences
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {Object.keys(locationPrefs).map(k => (
                      <Label
                        key={k}
                        className="inline-flex items-center gap-2 p-2 border rounded text-sm font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={locationPrefs[k]}
                          onChange={() => toggleLocationPref(k)}
                        />
                        <span className="text-sm">{k}</span>
                      </Label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground font-medium">
                    Loyalty program (module)
                  </Label>
                  <select
                    id="profile-loyalty-module"
                    name="profile-loyalty-module"
                    value={loyaltyModule}
                    onChange={e => setLoyaltyModule(e.target.value as any)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                  >
                    <option value="">None</option>
                    <option value="flight">Flight</option>
                    <option value="hotel">Hotel</option>
                    <option value="car">Car</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-medium">Membership No</Label>
                  <input
                    id="profile-loyalty-number"
                    name="profile-loyalty-number"
                    value={loyaltyNumber}
                    onChange={e => setLoyaltyNumber(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={handleSaveProfile} isLoading={saving}>
                  Save preferences
                </Button>
                <Button variant="ghost" onClick={() => window.location.reload()}>
                  Reset
                </Button>
                {message && <div className="ml-4 text-sm text-blue-600">{message}</div>}
              </div>
            </Card>
          )}

          {tab === 'documents' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="text-lg font-medium text-2xl font-semibold tracking-tight">
                  Documents
                </h2>
                <div className="text-sm text-muted-foreground">
                  Upload and manage passport, visa, residency and card images.
                </div>
              </div>

              <form
                onSubmit={handleUploadDocument}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
              >
                <div>
                  <Label className="text-xs text-muted-foreground font-medium">Document type</Label>
                  <select
                    id="profile-doc-type"
                    name="profile-doc-type"
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                  >
                    <option value="passport">Passport</option>
                    <option value="visa">Visa</option>
                    <option value="residency">Residency card</option>
                    <option value="credit-card">Credit card (image/masked)</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground font-medium">File</Label>
                  <input
                    id="profile-doc-file"
                    name="profile-doc-file"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => handleDocFileChange(e.target.files?.[0] || null)}
                    className="mt-1 w-full"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground font-medium">
                    Card info (card type)
                  </Label>
                  {docType === 'credit-card' ? (
                    <>
                      <input
                        id="profile-doc-masked-card"
                        name="profile-doc-masked-card"
                        placeholder="Masked number (e.g. **** **** **** 4242)"
                        value={docMaskedCard}
                        onChange={e => setDocMaskedCard(e.target.value)}
                        className="mt-1 w-full p-3 border rounded-lg bg-background/70"
                      />
                      <input
                        id="profile-doc-card-holder"
                        name="profile-doc-card-holder"
                        placeholder="Cardholder name"
                        value={docCardHolder}
                        onChange={e => setDocCardHolder(e.target.value)}
                        className="mt-1 w-full p-3 border rounded-lg bg-background/70 mt-2"
                      />
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">N/A</div>
                  )}
                </div>

                <div className="md:col-span-3 flex gap-2">
                  <Button type="submit" isLoading={docUploading}>
                    Upload
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDocFile(null);
                      setDocMaskedCard('');
                      setDocCardHolder('');
                    }}
                  >
                    Reset
                  </Button>
                  {message && <div className="ml-4 text-sm text-blue-600">{message}</div>}
                </div>
              </form>

              <div className="mt-6">
                <h3 className="text-sm text-muted-foreground mb-2 text-xl font-semibold tracking-tight">
                  Uploaded documents
                </h3>
                {documents.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No documents uploaded</div>
                ) : (
                  <div className="space-y-2">
                    {documents.map(d => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-3 border rounded gap-2"
                      >
                        <div>
                          <div className="font-medium">
                            {d.filename}{' '}
                            <span className="text-xs text-muted-foreground">({d.type})</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(d.uploadedAt).toLocaleString()}
                          </div>
                          {d.meta?.maskedCard && (
                            <div className="text-xs text-muted-foreground">
                              Card: {d.meta.maskedCard} • {d.meta.cardHolder}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-indigo-600"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                          <Button
                            variant="ghost"
                            size="md"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted"
                            onClick={() => handleDeleteDocument(d.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
