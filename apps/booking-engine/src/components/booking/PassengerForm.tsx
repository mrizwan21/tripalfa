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

export const testPassengerSchema = passengerSchema.extend({
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
      <AlertCircle size={8} />
      <span className="text-[8px] font-black uppercase tracking-widest">
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

  return (
    <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 group hover:shadow-xl transition-all hover:border-primary/30">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-muted/50 px-10 py-6 border-b border-border/50 flex items-center justify-between backdrop-blur-sm gap-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner gap-2">
            <User size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest text-xl font-semibold tracking-tight">
              Passenger {index + 1}
            </h3>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              Personal Details
            </p>
          </div>
        </div>
        {index === 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <CheckCircle2 size={12} className="text-primary" />
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">
              Primary Traveler
            </span>
          </div>
        )}
      </div>

      <div className="p-10 space-y-8">
        {/* ── Name + Nationality ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* First Name */}
          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-primary transition-colors text-sm font-medium">
              First Name*
            </label>
            <input
              {...register(`passengers.${index}.firstName`)}
              data-testid={`passenger-first-name${index > 0 ? `-${index}` : ""}`}
              placeholder="As per Passport"
              className={`w-full h-11 px-4 bg-muted/50 border-2 hover:bg-muted/50 focus:bg-card focus:border-primary/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-muted-foreground ${passengerErrors?.firstName ? "border-red-500/50" : "border-transparent"}`}
            />
            <FieldError msg={passengerErrors?.firstName?.message} />
          </div>

          {/* Last Name */}
          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-primary transition-colors text-sm font-medium">
              Last Name*
            </label>
            <input
              {...register(`passengers.${index}.lastName`)}
              data-testid={`passenger-last-name${index > 0 ? `-${index}` : ""}`}
              placeholder="As per Passport"
              className={`w-full h-11 px-4 bg-muted/50 border-2 hover:bg-muted/50 focus:bg-card focus:border-primary/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-muted-foreground ${passengerErrors?.lastName ? "border-red-500/50" : "border-transparent"}`}
            />
            <FieldError msg={passengerErrors?.lastName?.message} />
          </div>

          {/* Nationality — from PostgreSQL Country table (243 records) */}
          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-primary transition-colors text-sm font-medium">
              Nationality*
              {(nationalitiesList as any[]).length > 0 && (
                <span className="ml-1 text-[7px] text-muted-foreground normal-case">
                  ({(nationalitiesList as any[]).length} from DB)
                </span>
              )}
            </label>
            <div className="relative">
              <select
                {...register(`passengers.${index}.nationality`)}
                data-testid={`passenger-nationality${index > 0 ? `-${index}` : ""}`}
                className={`w-full h-11 px-4 bg-muted/50 border-2 hover:bg-muted/50 focus:bg-card focus:border-primary/30 rounded-xl text-[11px] font-bold appearance-none outline-none transition-all cursor-pointer text-foreground ${passengerErrors?.nationality ? "border-red-500/50" : "border-transparent"}`}
              >
                <option value="">Select Nationality</option>
                {(nationalitiesList as any[]).map((n: any) => (
                  <option key={n.code} value={n.code}>
                    {n.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={14} className="text-muted-foreground" />
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

          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 text-sm font-medium">
              Gender*
            </label>
            <div
              className={`flex gap-3 p-1 bg-muted/50 rounded-xl h-11 border-2 border-transparent group-hover/field:border-primary/10 transition-all ${passengerErrors?.gender ? "ring-1 ring-red-500" : ""}`}
            >
              {["Male", "Female"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setValue(`passengers.${index}.gender`, g)}
                  className={`flex-1 h-9 rounded-lg border border-transparent text-[10px] font-black uppercase tracking-widest transition-all ${genderValue === g ? "bg-card text-primary shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {g}
                </button>
              ))}
            </div>
            <FieldError msg={passengerErrors?.gender?.message} />
          </div>
        </div>

        {/* ── Travel Documents ────────────────────────────────────────── */}
        <div className="pt-8 border-t border-dashed border-border space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-primary" />
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">
              Travel Documents
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Passport Number */}
            <div className="space-y-1.5 group/field">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-primary transition-colors text-sm font-medium">
                Passport Number*
              </label>
              <input
                {...register(`passengers.${index}.passportNumber`)}
                data-testid={`passenger-passport${index > 0 ? `-${index}` : ""}`}
                placeholder="Passport Number"
                className={`w-full h-11 px-4 bg-muted/50 border-2 hover:bg-muted/50 focus:bg-card focus:border-primary/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-muted-foreground ${passengerErrors?.passportNumber ? "border-red-500/50" : "border-transparent"}`}
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
            <div className="space-y-1.5 group/field">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-primary transition-colors text-sm font-medium">
                Residency Country*
                {(staticData.countries.data as any[]).length > 0 && (
                  <span className="ml-1 text-[7px] text-muted-foreground normal-case">
                    ({(staticData.countries.data as any[]).length} from DB)
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  {...register(`passengers.${index}.residencyCountry`)}
                  data-testid={`passenger-residency${index > 0 ? `-${index}` : ""}`}
                  className={`w-full h-11 px-4 bg-muted/50 border-2 hover:bg-muted/50 focus:bg-card focus:border-primary/30 rounded-xl text-[11px] font-bold appearance-none outline-none transition-all cursor-pointer text-foreground ${passengerErrors?.residencyCountry ? "border-red-500/50" : "border-transparent"}`}
                >
                  <option value="">Select Country</option>
                  {(staticData.countries.data as any[]).map((c: any) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={14} className="text-muted-foreground" />
                </div>
              </div>
              <FieldError msg={passengerErrors?.residencyCountry?.message} />
            </div>
          </div>
        </div>

        {/* ── Contact (primary passenger only) ────────────────────────── */}
        {index === 0 && (
          <div className="pt-8 border-t border-dashed border-border space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={14} className="text-primary" />
              <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">
                Contact Information
              </h4>
              <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">
                (Required)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="relative group/field space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 text-sm font-medium">
                  Email Address*
                </label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2">
                    <Mail
                      size={16}
                      className="text-muted-foreground group-focus-within/field:text-primary transition-colors"
                    />
                  </div>
                  <input
                    {...register(`passengers.${index}.email`)}
                    placeholder="Enter your email"
                    className={`w-full h-14 pl-14 pr-6 bg-muted/50 border-2 hover:bg-muted/50 focus:bg-card focus:border-primary/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-muted-foreground ${passengerErrors?.email ? "border-red-500/50" : "border-transparent"}`}
                  />
                </div>
                <FieldError msg={passengerErrors?.email?.message} />
              </div>

              {/* Phone — dial code from /static/countries (with phone_code field) */}
              <div className="relative group/field space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 text-sm font-medium">
                  Phone Number*
                  {(phoneCodesList as any[]).length > 0 && (
                    <span className="ml-1 text-[7px] text-muted-foreground normal-case">
                      ({(phoneCodesList as any[]).length} countries · Code from
                      DB)
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  {/* Phone country code — from country phone_code field */}
                  <div className="relative w-40">
                    <select
                      {...register(`passengers.${index}.phoneCountryCode`)}
                      className={`w-full h-14 px-3 bg-muted/50 border-2 hover:bg-muted/50 focus:bg-card focus:border-primary/30 rounded-2xl text-[10px] font-bold appearance-none outline-none transition-all cursor-pointer ${passengerErrors?.phoneCountryCode ? "border-red-500/50" : "border-transparent"}`}
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
                      <ChevronDown
                        size={12}
                        className="text-muted-foreground"
                      />
                    </div>
                  </div>
                  {/* Phone number */}
                  <div className="relative flex-1 gap-4">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Phone
                        size={16}
                        className="text-muted-foreground group-focus-within/field:text-primary transition-colors"
                      />
                    </div>
                    <input
                      {...register(`passengers.${index}.phone`)}
                      placeholder="Mobile Number"
                      className={`w-full h-14 pl-12 pr-6 bg-muted/50 border-2 hover:bg-muted/50 focus:bg-card focus:border-primary/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-muted-foreground ${passengerErrors?.phone ? "border-red-500/50" : "border-transparent"}`}
                    />
                  </div>
                </div>
                {(passengerErrors?.phoneCountryCode ||
                  passengerErrors?.phone) && (
                  <div className="flex items-center gap-1 text-red-500 pl-1">
                    <AlertCircle size={10} />
                    <span className="text-[9px] font-black uppercase tracking-widest">
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
        <div className="pt-8 border-t border-dashed border-border space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={14} className="text-primary" />
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">
              Frequent Flyer / Loyalty
            </h4>
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
              (Optional)
            </span>
            {(loyaltyPrograms as any[]).length > 0 && (
              <span className="text-[7px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                {(loyaltyPrograms as any[]).length} programs from DB
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loyalty Program Dropdown with search */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 text-sm font-medium">
                Loyalty Program
              </label>
              <div className="relative">
                {/* Searchable select: custom input + hidden select */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Star size={13} className="text-muted-foreground" />
                  </div>
                  {/* Show selected name or search */}
                  <select
                    {...register(`passengers.${index}.loyaltyProgram`)}
                    className="w-full h-11 pl-10 pr-8 bg-muted/50 border-2 border-transparent hover:bg-muted/50 focus:bg-card focus:border-primary/30 rounded-xl text-[11px] font-bold appearance-none outline-none transition-all cursor-pointer text-foreground"
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
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </div>
                </div>
              </div>
              {selectedLoyaltyName && (
                <p className="text-[9px] font-bold text-primary pl-1 flex items-center gap-1">
                  <CheckCircle2 size={9} /> {selectedLoyaltyName} selected
                </p>
              )}
            </div>

            {/* Loyalty Number */}
            <div className="space-y-1.5 group/field">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-primary transition-colors text-sm font-medium">
                Membership Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Star
                    size={13}
                    className="text-muted-foreground group-focus-within/field:text-primary transition-colors"
                  />
                </div>
                <input
                  {...register(`passengers.${index}.loyaltyNumber`)}
                  placeholder={
                    loyaltyProgram
                      ? "Enter your membership number"
                      : "Select a program first"
                  }
                  disabled={!loyaltyProgram}
                  className="w-full h-11 pl-10 pr-4 bg-muted/50 border-2 border-transparent hover:bg-muted/50 focus:bg-card focus:border-primary/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
