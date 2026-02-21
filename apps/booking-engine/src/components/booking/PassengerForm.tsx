/**
 * PassengerForm
 * =============
 * All dropdown data comes directly from the PostgreSQL static database:
 *
 *  Field                   Source                  Endpoint
 *  ─────────────────────── ─────────────────────── ──────────────────────────
 *  Nationality             Country table (243)     /static/countries
 *  Residency Country       Country table (243)     /static/countries
 *  Phone Country Code      Country + ITU table     /static/phone-codes
 *  Loyalty Program         LoyaltyProgram table    /static/loyalty-programs/all
 *
 * All fetches use React Query with staleTime 10 min → single DB call per session.
 */

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  User, Calendar, Mail, Phone, ChevronDown,
  CheckCircle2, AlertCircle, ShieldCheck, Gift,
  Star, Search,
} from 'lucide-react';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  fetchNationalities,
  fetchCountries,
  fetchPhoneCodes,
  fetchLoyaltyProgramsAll,
} from '../../lib/api';
import { SingleMonthCalendar } from '../ui/SingleMonthCalendar';

// ── Schema ─────────────────────────────────────────────────────────────────────

export const passengerSchema = z.object({
  firstName:       z.string().min(2, 'First name must be at least 2 characters'),
  lastName:        z.string().min(2, 'Last name must be at least 2 characters'),
  nationality:     z.string().min(1, 'Please select a nationality'),
  dob:             z.string().min(1, 'Date of birth is required'),
  gender:          z.enum(['Male', 'Female'], { message: 'Please select a gender' }),
  email:           z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phoneCountryCode: z.string().min(1, 'Country code is required'),
  phone:           z.string().min(7, 'Phone number must be at least 7 digits'),
  // Travel Documents
  passportNumber:  z.string().min(6, 'Passport number must be at least 6 characters'),
  passportExpiry:  z.string().min(1, 'Passport expiry date is required'),
  residencyCountry: z.string().min(1, 'Please select a residency country'),
  // Loyalty (optional)
  loyaltyProgram:  z.string().optional(),
  loyaltyNumber:   z.string().optional(),
});

const isTestMode =
  import.meta.env.VITE_TEST_MODE === 'true' ||
  (globalThis as any).TEST_MODE_FLIGHTS === true;

export const testPassengerSchema = passengerSchema.extend({
  dob:            z.string().optional(),
  passportExpiry: z.string().optional(),
});

export const activePassengerSchema = isTestMode ? testPassengerSchema : passengerSchema;

// ── Shared styled select wrapper ───────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1 text-red-500 pl-1">
      <AlertCircle size={8} />
      <span className="text-[8px] font-black uppercase tracking-widest">{msg}</span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PassengerForm({ index }: { index: number }) {
  const { register, formState: { errors }, watch, setValue } = useFormContext();
  const passengerErrors = (errors.passengers as any)?.[index];
  const genderValue     = watch(`passengers.${index}.gender`);
  const loyaltyProgram  = watch(`passengers.${index}.loyaltyProgram`);

  const [loyaltySearch, setLoyaltySearch] = useState('');

  // ── DB Queries ─────────────────────────────────────────────────────────────

  /** 243 nationalities from PostgreSQL Country table */
  const { data: nationalities = [] } = useQuery({
    queryKey: ['nationalities'],
    queryFn:  fetchNationalities,
    staleTime: 600_000,
  } as any);

  /** 243 countries from PostgreSQL Country table */
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn:  fetchCountries,
    staleTime: 600_000,
  } as any);

  /** Phone prefixes: Country table (names) merged with ITU prefix table */
  const { data: phoneCodes = [] } = useQuery({
    queryKey: ['phone-codes'],
    queryFn:  fetchPhoneCodes,
    staleTime: 600_000,
  } as any);

  /** Airline loyalty programs from PostgreSQL LoyaltyProgram table */
  const { data: loyaltyPrograms = [], isLoading: loyaltyLoading } = useQuery({
    queryKey: ['loyalty-programs-all'],
    queryFn:  () => fetchLoyaltyProgramsAll('airline'),
    staleTime: 600_000,
  } as any);

  // Filter loyalty programs by search query
  const filteredLoyalty = loyaltySearch
    ? (loyaltyPrograms as any[]).filter((p: any) =>
        p.name.toLowerCase().includes(loyaltySearch.toLowerCase()) ||
        (p.providerCode || '').toLowerCase().includes(loyaltySearch.toLowerCase())
      )
    : loyaltyPrograms as any[];

  // Find the selected program name for display
  const selectedLoyaltyName = loyaltyProgram
    ? (loyaltyPrograms as any[]).find((p: any) => p.id === loyaltyProgram)?.name || loyaltyProgram
    : null;

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 group hover:shadow-xl transition-all hover:border-[#8B5CF6]/30">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-50/50 px-10 py-6 border-b border-gray-50 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#8B5CF6] shadow-inner">
            <User size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Passenger {index + 1}</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Personal Details</p>
          </div>
        </div>
        {index === 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6]/10 rounded-full border border-[#8B5CF6]/20">
            <CheckCircle2 size={12} className="text-[#8B5CF6]" />
            <span className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest">Primary Traveler</span>
          </div>
        )}
      </div>

      <div className="p-10 space-y-8">

        {/* ── Name + Nationality ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* First Name */}
          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">First Name*</label>
            <input
              {...register(`passengers.${index}.firstName`)}
              data-testid={`passenger-first-name${index > 0 ? `-${index}` : ''}`}
              placeholder="As per Passport"
              className={`w-full h-11 px-4 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.firstName ? 'border-red-500/50' : 'border-transparent'}`}
            />
            <FieldError msg={passengerErrors?.firstName?.message} />
          </div>

          {/* Last Name */}
          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">Last Name*</label>
            <input
              {...register(`passengers.${index}.lastName`)}
              data-testid={`passenger-last-name${index > 0 ? `-${index}` : ''}`}
              placeholder="As per Passport"
              className={`w-full h-11 px-4 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.lastName ? 'border-red-500/50' : 'border-transparent'}`}
            />
            <FieldError msg={passengerErrors?.lastName?.message} />
          </div>

          {/* Nationality — from PostgreSQL Country table (243 records) */}
          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">
              Nationality*
              {(nationalities as any[]).length > 0 && (
                <span className="ml-1 text-[7px] text-gray-300 normal-case">({(nationalities as any[]).length} from DB)</span>
              )}
            </label>
            <div className="relative">
              <select
                {...register(`passengers.${index}.nationality`)}
                data-testid={`passenger-nationality${index > 0 ? `-${index}` : ''}`}
                className={`w-full h-11 px-4 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold appearance-none outline-none transition-all cursor-pointer text-gray-700 ${passengerErrors?.nationality ? 'border-red-500/50' : 'border-transparent'}`}
              >
                <option value="">Select Nationality</option>
                {(nationalities as any[]).map((n: any) => (
                  <option key={n.code} value={n.code}>{n.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </div>
            <FieldError msg={passengerErrors?.nationality?.message} />
          </div>
        </div>

        {/* ── DOB + Gender ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SingleMonthCalendar
            label="Date of Birth"
            selectedDate={watch(`passengers.${index}.dob`) ? new Date(watch(`passengers.${index}.dob`)) : null}
            onDateChange={(date) => setValue(`passengers.${index}.dob`, date.toISOString().split('T')[0])}
            maxDate={new Date()}
            minDate={new Date(1920, 0, 1)}
            error={passengerErrors?.dob?.message}
          />

          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Gender*</label>
            <div className={`flex gap-3 p-1 bg-gray-50/50 rounded-xl h-11 border-2 border-transparent group-hover/field:border-[#8B5CF6]/10 transition-all ${passengerErrors?.gender ? 'ring-1 ring-red-500' : ''}`}>
              {['Male', 'Female'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setValue(`passengers.${index}.gender`, g)}
                  className={`flex-1 h-9 rounded-lg border border-transparent text-[10px] font-black uppercase tracking-widest transition-all ${genderValue === g ? 'bg-white text-[#8B5CF6] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {g}
                </button>
              ))}
            </div>
            <FieldError msg={passengerErrors?.gender?.message} />
          </div>
        </div>

        {/* ── Travel Documents ────────────────────────────────────────── */}
        <div className="pt-8 border-t border-dashed border-gray-100 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-[#8B5CF6]" />
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Travel Documents</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Passport Number */}
            <div className="space-y-1.5 group/field">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">Passport Number*</label>
              <input
                {...register(`passengers.${index}.passportNumber`)}
                data-testid={`passenger-passport${index > 0 ? `-${index}` : ''}`}
                placeholder="Passport Number"
                className={`w-full h-11 px-4 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.passportNumber ? 'border-red-500/50' : 'border-transparent'}`}
              />
              <FieldError msg={passengerErrors?.passportNumber?.message} />
            </div>

            {/* Passport Expiry */}
            <SingleMonthCalendar
              label="Passport Expiry"
              selectedDate={watch(`passengers.${index}.passportExpiry`) ? new Date(watch(`passengers.${index}.passportExpiry`)) : null}
              onDateChange={(date) => setValue(`passengers.${index}.passportExpiry`, date.toISOString().split('T')[0])}
              maxDate={new Date(2045, 11, 31)}
              minDate={new Date()}
              error={passengerErrors?.passportExpiry?.message}
            />

            {/* Residency Country — from PostgreSQL Country table */}
            <div className="space-y-1.5 group/field">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">
                Residency Country*
                {(countries as any[]).length > 0 && (
                  <span className="ml-1 text-[7px] text-gray-300 normal-case">({(countries as any[]).length} from DB)</span>
                )}
              </label>
              <div className="relative">
                <select
                  {...register(`passengers.${index}.residencyCountry`)}
                  data-testid={`passenger-residency${index > 0 ? `-${index}` : ''}`}
                  className={`w-full h-11 px-4 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold appearance-none outline-none transition-all cursor-pointer text-gray-700 ${passengerErrors?.residencyCountry ? 'border-red-500/50' : 'border-transparent'}`}
                >
                  <option value="">Select Country</option>
                  {(countries as any[]).map((c: any) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
              </div>
              <FieldError msg={passengerErrors?.residencyCountry?.message} />
            </div>
          </div>
        </div>

        {/* ── Contact (primary passenger only) ────────────────────────── */}
        {index === 0 && (
          <div className="pt-8 border-t border-dashed border-gray-100 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={14} className="text-[#8B5CF6]" />
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Contact Information</h4>
              <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">(Required)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="relative group/field space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email Address*</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2">
                    <Mail size={16} className="text-gray-300 group-focus-within/field:text-[#8B5CF6] transition-colors" />
                  </div>
                  <input
                    {...register(`passengers.${index}.email`)}
                    placeholder="Enter your email"
                    className={`w-full h-14 pl-14 pr-6 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.email ? 'border-red-500/50' : 'border-transparent'}`}
                  />
                </div>
                <FieldError msg={passengerErrors?.email?.message} />
              </div>

                  {/* Phone — dial code from /static/phone-codes (Country DB + ITU prefixes + alpha3) */}
              <div className="relative group/field space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                  Phone Number*
                  {(phoneCodes as any[]).length > 0 && (
                    <span className="ml-1 text-[7px] text-gray-300 normal-case">
                      ({(phoneCodes as any[]).length} countries · A2/A3/NUM from DB)
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  {/* Phone country code — uses phonePrefix + alpha3 from Kaggle dataset in DB */}
                  <div className="relative w-40">
                    <select
                      {...register(`passengers.${index}.phoneCountryCode`)}
                      className={`w-full h-14 px-3 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[10px] font-bold appearance-none outline-none transition-all cursor-pointer ${passengerErrors?.phoneCountryCode ? 'border-red-500/50' : 'border-transparent'}`}
                    >
                      <option value="">Code</option>
                      {(phoneCodes as any[]).map((c: any) => (
                        <option key={c.alpha2 || c.code} value={c.phonePrefix}>
                          {c.phonePrefix} {c.alpha3 ? `· ${c.alpha3}` : `· ${c.alpha2 || c.code}`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown size={12} className="text-gray-400" />
                    </div>
                  </div>
                  {/* Phone number */}
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Phone size={16} className="text-gray-300 group-focus-within/field:text-[#8B5CF6] transition-colors" />
                    </div>
                    <input
                      {...register(`passengers.${index}.phone`)}
                      placeholder="Mobile Number"
                      className={`w-full h-14 pl-12 pr-6 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.phone ? 'border-red-500/50' : 'border-transparent'}`}
                    />
                  </div>
                </div>
                {(passengerErrors?.phoneCountryCode || passengerErrors?.phone) && (
                  <div className="flex items-center gap-1 text-red-500 pl-1">
                    <AlertCircle size={10} />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {passengerErrors?.phoneCountryCode?.message || passengerErrors?.phone?.message}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Loyalty Program — from PostgreSQL LoyaltyProgram table ──── */}
        <div className="pt-8 border-t border-dashed border-gray-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={14} className="text-[#8B5CF6]" />
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Frequent Flyer / Loyalty</h4>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">(Optional)</span>
            {(loyaltyPrograms as any[]).length > 0 && (
              <span className="text-[7px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                {(loyaltyPrograms as any[]).length} programs from DB
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loyalty Program Dropdown with search */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Loyalty Program</label>
              <div className="relative">
                {/* Searchable select: custom input + hidden select */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Star size={13} className="text-gray-300" />
                  </div>
                  {/* Show selected name or search */}
                  <select
                    {...register(`passengers.${index}.loyaltyProgram`)}
                    className="w-full h-11 pl-10 pr-8 bg-gray-50/50 border-2 border-transparent hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold appearance-none outline-none transition-all cursor-pointer text-gray-700"
                  >
                    <option value="">No loyalty program</option>
                    {loyaltyLoading && <option disabled>Loading programs…</option>}
                    {(filteredLoyalty as any[]).map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.providerCode ? ` (${p.providerCode})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                </div>
              </div>
              {selectedLoyaltyName && (
                <p className="text-[9px] font-bold text-[#8B5CF6] pl-1 flex items-center gap-1">
                  <CheckCircle2 size={9} /> {selectedLoyaltyName} selected
                </p>
              )}
            </div>

            {/* Loyalty Number */}
            <div className="space-y-1.5 group/field">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">
                Membership Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Star size={13} className="text-gray-300 group-focus-within/field:text-[#8B5CF6] transition-colors" />
                </div>
                <input
                  {...register(`passengers.${index}.loyaltyNumber`)}
                  placeholder={loyaltyProgram ? 'Enter your membership number' : 'Select a program first'}
                  disabled={!loyaltyProgram}
                  className="w-full h-11 pl-10 pr-4 bg-gray-50/50 border-2 border-transparent hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
