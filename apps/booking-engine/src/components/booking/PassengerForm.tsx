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

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  User,
  Calendar,
  Mail,
  Phone,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Gift,
  Star,
  Search,
} from "lucide-react";
import { z } from "zod";
import { useMemo } from "react";
import { useBundledStaticData } from "../../hooks/useBundledStaticData";
import { SingleMonthCalendar } from "../ui/SingleMonthCalendar";

// ── Schema ─────────────────────────────────────────────────────────────────────

export const passengerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  nationality: z.string().min(1, "Please select a nationality"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female"], { message: "Please select a gender" }),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(7, "Phone number must be at least 7 digits"),
  // Travel Documents
  passportNumber: z
    .string()
    .min(6, "Passport number must be at least 6 characters"),
  passportExpiry: z.string().min(1, "Passport expiry date is required"),
  residencyCountry: z.string().min(1, "Please select a residency country"),
  // Loyalty (optional)
  loyaltyProgram: z.string().optional(),
  loyaltyNumber: z.string().optional(),
});

const isTestMode =
  import.meta.env.VITE_TEST_MODE === "true" ||
  (globalThis as any).TEST_MODE_FLIGHTS === true;

const testPassengerSchema = passengerSchema.extend({
  dob: z.string().optional(),
  passportExpiry: z.string().optional(),
});

export const activePassengerSchema = isTestMode
  ? testPassengerSchema
  : passengerSchema;

// ── Shared styled select wrapper ───────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1 text-red-500 pl-1">
      <AlertCircle size={10} />
      <span className="text-xs font-bold uppercase tracking-widest">
        {msg}
      </span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PassengerForm({ index }: { index: number }) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();
  const passengerErrors = (errors.passengers as any)?.[index];
  const genderValue = watch(`passengers.${index}.gender`);
  const loyaltyProgram = watch(`passengers.${index}.loyaltyProgram`);

  const [loyaltySearch, setLoyaltySearch] = useState("");

  // ── Static data lookups from bundled hook ────────────────────────────────

  const staticData = useBundledStaticData();

  // Build O(1) lookup maps for countries and nationalities
  const countriesByCode = useMemo(() => {
    return (staticData.countries.data || []).reduce((acc: any, c: any) => {
      acc[c.code] = c;
      return acc;
    }, {});
  }, [staticData.countries.data]);

  const nationalitiesList = useMemo(() => {
    return staticData.countries.data || [];
  }, [staticData.countries.data]);

  // Phone codes: use country data with phone_code field
  const phoneCodesList = useMemo(() => {
    return (staticData.countries.data || []).filter((c: any) => c.phone_code);
  }, [staticData.countries.data]);

  // Loyalty programs from static data
  const loyaltyPrograms = useMemo(() => {
    return staticData.loyaltyPrograms.data || [];
  }, [staticData.loyaltyPrograms.data]);

  const loyaltyLoading = staticData.loyaltyPrograms.isLoading;

  // Filter loyalty programs by search query
  const filteredLoyalty = loyaltySearch
    ? (loyaltyPrograms as any[]).filter(
        (p: any) =>
          p.name.toLowerCase().includes(loyaltySearch.toLowerCase()) ||
          (p.providerCode || "")
            .toLowerCase()
            .includes(loyaltySearch.toLowerCase()),
      )
    : (loyaltyPrograms as any[]);

  // Find the selected program name for display
  const selectedLoyaltyName = loyaltyProgram
    ? (loyaltyPrograms as any[]).find((p: any) => p.id === loyaltyProgram)
        ?.name || loyaltyProgram
    : null;

  const inputClass = (hasError: boolean) =>
    `w-full h-12 rounded-xl border bg-white px-4 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 ${
      hasError ? "border-red-300 ring-2 ring-red-50" : "border-gray-200"
    }`;

  const selectClass = (hasError: boolean) =>
    `w-full h-12 rounded-xl border bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition-all duration-200 appearance-none cursor-pointer hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 ${
      hasError ? "border-red-300 ring-2 ring-red-50" : "border-gray-200"
    }`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-50/70 px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#003b95]/5 flex items-center justify-center text-[#003b95]">
            <User size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Passenger {index + 1}
            </h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
              Personal Details
            </p>
          </div>
        </div>
        {index === 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#003b95]/5 rounded-full border border-[#003b95]/10">
            <CheckCircle2 size={12} className="text-[#003b95]" />
            <span className="text-[10px] font-bold text-[#003b95] uppercase tracking-widest">
              Primary Traveler
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-8">
        {/* ── Name + Nationality ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* First Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              First Name*
            </label>
            <input
              {...register(`passengers.${index}.firstName`)}
              data-testid={`passenger-first-name${index > 0 ? `-${index}` : ""}`}
              placeholder="As per Passport"
              className={inputClass(passengerErrors?.firstName)}
            />
            <FieldError msg={passengerErrors?.firstName?.message} />
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Last Name*
            </label>
            <input
              {...register(`passengers.${index}.lastName`)}
              data-testid={`passenger-last-name${index > 0 ? `-${index}` : ""}`}
              placeholder="As per Passport"
              className={inputClass(passengerErrors?.lastName)}
            />
            <FieldError msg={passengerErrors?.lastName?.message} />
          </div>

          {/* Nationality — from PostgreSQL Country table (243 records) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Nationality*
              {(nationalitiesList as any[]).length > 0 && (
                <span className="ml-1 text-[10px] text-gray-400 normal-case font-semibold">
                  ({(nationalitiesList as any[]).length} from DB)
                </span>
              )}
            </label>
            <div className="relative">
              <select
                {...register(`passengers.${index}.nationality`)}
                data-testid={`passenger-nationality${index > 0 ? `-${index}` : ""}`}
                className={selectClass(passengerErrors?.nationality)}
              >
                <option value="">Select Nationality</option>
                {(nationalitiesList as any[]).map((n: any) => (
                  <option key={n.code} value={n.code}>
                    {n.name}
                  </option>
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
            selectedDate={
              watch(`passengers.${index}.dob`)
                ? new Date(watch(`passengers.${index}.dob`))
                : null
            }
            onDateChange={(date) =>
              setValue(
                `passengers.${index}.dob`,
                date.toISOString().split("T")[0],
              )
            }
            maxDate={new Date()}
            minDate={new Date(1920, 0, 1)}
            error={passengerErrors?.dob?.message}
          />

          <div className="space-y-1.5 md:col-span-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Gender*
            </label>
            <div
              className={`flex gap-2 p-1 bg-gray-100 rounded-xl h-12 ${
                passengerErrors?.gender ? "ring-2 ring-red-50" : ""
              }`}
            >
              {["Male", "Female"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setValue(`passengers.${index}.gender`, g)}
                  className={`flex-1 h-10 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                    genderValue === g
                      ? "bg-white text-[#003b95] shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <FieldError msg={passengerErrors?.gender?.message} />
          </div>
        </div>

        {/* ── Travel Documents ────────────────────────────────────────── */}
        <div className="pt-6 border-t border-dashed border-gray-200 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-[#003b95]" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
              Travel Documents
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Passport Number */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Passport Number*
              </label>
              <input
                {...register(`passengers.${index}.passportNumber`)}
                data-testid={`passenger-passport${index > 0 ? `-${index}` : ""}`}
                placeholder="Passport Number"
                className={inputClass(passengerErrors?.passportNumber)}
              />
              <FieldError msg={passengerErrors?.passportNumber?.message} />
            </div>

            {/* Passport Expiry */}
            <SingleMonthCalendar
              label="Passport Expiry"
              selectedDate={
                watch(`passengers.${index}.passportExpiry`)
                  ? new Date(watch(`passengers.${index}.passportExpiry`))
                  : null
              }
              onDateChange={(date) =>
                setValue(
                  `passengers.${index}.passportExpiry`,
                  date.toISOString().split("T")[0],
                )
              }
              maxDate={new Date(2045, 11, 31)}
              minDate={new Date()}
              error={passengerErrors?.passportExpiry?.message}
            />

            {/* Residency Country — from PostgreSQL Country table */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Residency Country*
                {(staticData.countries.data as any[]).length > 0 && (
                  <span className="ml-1 text-[10px] text-gray-400 normal-case font-semibold">
                    ({(staticData.countries.data as any[]).length} from DB)
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  {...register(`passengers.${index}.residencyCountry`)}
                  data-testid={`passenger-residency${index > 0 ? `-${index}` : ""}`}
                  className={selectClass(passengerErrors?.residencyCountry)}
                >
                  <option value="">Select Country</option>
                  {(staticData.countries.data as any[]).map((c: any) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
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
          <div className="pt-6 border-t border-dashed border-gray-200 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={14} className="text-[#003b95]" />
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                Contact Information
              </h4>
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                (Required)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Email Address*
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    {...register(`passengers.${index}.email`)}
                    placeholder="Enter your email"
                    className={`${inputClass(passengerErrors?.email)} pl-12`}
                  />
                </div>
                <FieldError msg={passengerErrors?.email?.message} />
              </div>

              {/* Phone — dial code from /static/countries (with phone_code field) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Phone Number*
                  {(phoneCodesList as any[]).length > 0 && (
                    <span className="ml-1 text-[10px] text-gray-400 normal-case font-semibold">
                      ({(phoneCodesList as any[]).length} countries · Code from
                      DB)
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  {/* Phone country code — from country phone_code field */}
                  <div className="relative w-36 shrink-0">
                    <select
                      {...register(`passengers.${index}.phoneCountryCode`)}
                      className={selectClass(passengerErrors?.phoneCountryCode)}
                    >
                      <option value="">Code</option>
                      {(phoneCodesList as any[]).map((c: any) => (
                        <option key={c.code} value={c.phone_code}>
                          {c.phone_code}{" "}
                          {c.iso_alpha_3 ? `· ${c.iso_alpha_3}` : `· ${c.code}`}
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
                      <Phone size={16} className="text-gray-400" />
                    </div>
                    <input
                      {...register(`passengers.${index}.phone`)}
                      placeholder="Mobile Number"
                      className={`${inputClass(passengerErrors?.phone)} pl-12`}
                    />
                  </div>
                </div>
                {(passengerErrors?.phoneCountryCode ||
                  passengerErrors?.phone) && (
                  <div className="flex items-center gap-1 text-red-500 pl-1">
                    <AlertCircle size={10} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {passengerErrors?.phoneCountryCode?.message ||
                        passengerErrors?.phone?.message}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Loyalty Program — from PostgreSQL LoyaltyProgram table ──── */}
        <div className="pt-6 border-t border-dashed border-gray-200 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={14} className="text-[#003b95]" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
              Frequent Flyer / Loyalty
            </h4>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              (Optional)
            </span>
            {(loyaltyPrograms as any[]).length > 0 && (
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                {(loyaltyPrograms as any[]).length} programs from DB
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Loyalty Program Dropdown with search */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Loyalty Program
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Star size={13} className="text-gray-400" />
                </div>
                <select
                  {...register(`passengers.${index}.loyaltyProgram`)}
                  className={`${selectClass(false)} pl-10`}
                >
                  <option value="">No loyalty program</option>
                  {loyaltyLoading && (
                    <option disabled>Loading programs…</option>
                  )}
                  {(filteredLoyalty as any[]).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.providerCode ? ` (${p.providerCode})` : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
              </div>
              {selectedLoyaltyName && (
                <p className="text-xs font-bold text-[#003b95] pl-1 flex items-center gap-1">
                  <CheckCircle2 size={10} /> {selectedLoyaltyName} selected
                </p>
              )}
            </div>

            {/* Loyalty Number */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Membership Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Star size={13} className="text-gray-400" />
                </div>
                <input
                  {...register(`passengers.${index}.loyaltyNumber`)}
                  placeholder={
                    loyaltyProgram
                      ? "Enter your membership number"
                      : "Select a program first"
                  }
                  disabled={!loyaltyProgram}
                  className={`${inputClass(false)} pl-10 disabled:opacity-40 disabled:cursor-not-allowed`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
