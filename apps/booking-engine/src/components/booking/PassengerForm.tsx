import React from 'react';
// @ts-ignore
import { useFormContext } from 'react-hook-form';
import { User, Calendar, Mail, Phone, ChevronDown, CheckCircle2, AlertCircle, ShieldCheck, Star } from 'lucide-react';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { fetchLoyaltyPrograms, fetchNationalities, fetchCountries } from '../../lib/api';
import { SingleMonthCalendar } from '../ui/SingleMonthCalendar';

// Schema Definition (exported for use in parent)
export const passengerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  nationality: z.string().min(1, "Country is required"),
  dob: z.string().min(1, "Date of birth is required"), // Simplified for HTML date input
  gender: z.enum(["Male", "Female"], { required_error: "Gender is required" }),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().min(10, "Invalid phone").optional().or(z.literal('')),
  // Travel Documents
  passportNumber: z.string().min(6, "Passport number is required"),
  passportExpiry: z.string().min(1, "Passport expiry is required"),
  residencyCountry: z.string().min(1, "Residency country is required"),
  // Optional Programs
  frequentFlyerProgram: z.string().optional(),
  frequentFlyerNumber: z.string().optional()
});

// Test mode schema with optional date fields
const isTestMode = import.meta.env.VITE_TEST_MODE === 'true' || (globalThis as any).TEST_MODE_FLIGHTS === true;
export const testPassengerSchema = passengerSchema.extend({
  dob: z.string().optional(),
  passportExpiry: z.string().optional(),
});

export const activePassengerSchema = isTestMode ? testPassengerSchema : passengerSchema;

export function PassengerForm({ index }: { index: number }) {
  const { register, formState: { errors }, watch, setValue } = useFormContext();

  const passengerErrors = (errors.passengers as any)?.[index];
  const genderValue = watch(`passengers.${index}.gender`);

  const { data: programs = [] } = useQuery({
    queryKey: ['loyalty-programs'],
    queryFn: fetchLoyaltyPrograms,
    staleTime: 600000
  });

  const { data: nationalities = [] } = useQuery({
    queryKey: ['nationalities'],
    queryFn: fetchNationalities,
    staleTime: 600000
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: 600000
  });

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 group hover:shadow-xl transition-all hover:border-[#8B5CF6]/30">

      {/* Elite Header */}
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
        {/* Name Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">First Name*</label>
            <input
              {...register(`passengers.${index}.firstName`)}
              data-testid={`passenger-first-name${index > 0 ? `-${index}` : ''}`}
              placeholder="As per Passport"
              className={`w-full h-11 px-4 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.firstName ? 'border-red-500/50 focus:border-red-500' : 'border-transparent'}`}
            />
            {passengerErrors?.firstName && <div className="flex items-center gap-1 text-red-500 pl-1"><AlertCircle size={8} /><span className="text-[8px] font-black uppercase tracking-widest">{passengerErrors.firstName.message}</span></div>}
          </div>
          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">Last Name*</label>
            <input
              {...register(`passengers.${index}.lastName`)}
              data-testid={`passenger-last-name${index > 0 ? `-${index}` : ''}`}
              placeholder="As per Passport"
              className={`w-full h-11 px-4 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.lastName ? 'border-red-500/50 focus:border-red-500' : 'border-transparent'}`}
            />
            {passengerErrors?.lastName && <div className="flex items-center gap-1 text-red-500 pl-1"><AlertCircle size={8} /><span className="text-[8px] font-black uppercase tracking-widest">{passengerErrors.lastName.message}</span></div>}
          </div>
          <div className="space-y-1.5 group/field">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">Nationality*</label>
            <div className="relative">
              <select
                {...register(`passengers.${index}.nationality`)}
                data-testid={`passenger-nationality${index > 0 ? `-${index}` : ''}`}
                className={`w-full h-11 px-4 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold appearance-none outline-none transition-all cursor-pointer text-gray-700 ${passengerErrors?.nationality ? 'border-red-500/50 focus:border-red-500' : 'border-transparent'}`}
              >
                <option value="">Select Nationality</option>
                {nationalities.map((n: any) => (
                  <option key={n.code} value={n.code}>{n.name}</option>
                ))}
                {nationalities.length === 0 && (
                  <>
                    <option value="US">United States</option>
                    <option value="AE">United Arab Emirates</option>
                  </>
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </div>
            {passengerErrors?.nationality && <div className="flex items-center gap-1 text-red-500 pl-1"><AlertCircle size={8} /><span className="text-[8px] font-black uppercase tracking-widest">{passengerErrors.nationality.message}</span></div>}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SingleMonthCalendar
            label="Date of Birth"
            selectedDate={watch(`passengers.${index}.dob`) ? new Date(watch(`passengers.${index}.dob`)) : null}
            onDateChange={(date) => setValue(`passengers.${index}.dob`, date.toISOString().split('T')[0])}
            // @ts-ignore
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
            {passengerErrors?.gender && <div className="flex items-center gap-1 text-red-500 pl-1"><AlertCircle size={8} /><span className="text-[8px] font-black uppercase tracking-widest">{passengerErrors.gender.message}</span></div>}
          </div>
        </div>

        {/* Travel Documents Section */}
        <div className="pt-8 border-t border-dashed border-gray-100 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-[#8B5CF6]" />
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Travel Documents</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 group/field">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">Passport Number*</label>
              <input
                {...register(`passengers.${index}.passportNumber`)}
                data-testid={`passenger-passport${index > 0 ? `-${index}` : ''}`}
                placeholder="Passport Number"
                className={`w-full h-11 px-4 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.passportNumber ? 'border-red-500/50 focus:border-red-500' : 'border-transparent'}`}
              />
              {passengerErrors?.passportNumber && <div className="flex items-center gap-1 text-red-500 pl-1"><AlertCircle size={8} /><span className="text-[8px] font-black uppercase tracking-widest">{passengerErrors.passportNumber.message}</span></div>}
            </div>
            <SingleMonthCalendar
              label="Passport Expiry"
              selectedDate={watch(`passengers.${index}.passportExpiry`) ? new Date(watch(`passengers.${index}.passportExpiry`)) : null}
              onDateChange={(date) => setValue(`passengers.${index}.passportExpiry`, date.toISOString().split('T')[0])}
              maxDate={new Date(2045, 11, 31)}
              minDate={new Date()}
              // @ts-ignore
              error={passengerErrors?.passportExpiry?.message}
            />
            <div className="space-y-1.5 group/field">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-[#8B5CF6] transition-colors">Residency Country*</label>
              <div className="relative">
                <select
                  {...register(`passengers.${index}.residencyCountry`)}
                  data-testid={`passenger-residency${index > 0 ? `-${index}` : ''}`}
                  className={`w-full h-11 px-4 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[11px] font-bold appearance-none outline-none transition-all cursor-pointer text-gray-700 ${passengerErrors?.residencyCountry ? 'border-red-500/50 focus:border-red-500' : 'border-transparent'}`}
                >
                  <option value="">Select Country</option>
                  {countries.map((c: any) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                  {countries.length === 0 && (
                    <>
                      <option value="US">United States</option>
                      <option value="AE">United Arab Emirates</option>
                    </>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
              </div>
              {passengerErrors?.residencyCountry && <div className="flex items-center gap-1 text-red-500 pl-1"><AlertCircle size={8} /><span className="text-[8px] font-black uppercase tracking-widest">{passengerErrors.residencyCountry.message}</span></div>}
            </div>
          </div>
        </div>

        {/* Loyalty Programs */}
        <div className="pt-8 border-t border-dashed border-gray-100 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-[#8B5CF6]" />
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Loyalty Programs</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 group/field">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Airline Program</label>
              <div className="relative">
                <select
                  {...register(`passengers.${index}.frequentFlyerProgram`)}
                  className="w-full h-11 px-5 bg-gray-50/50 border-2 border-transparent hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[10px] font-bold appearance-none outline-none transition-all cursor-pointer text-gray-700"
                >
                  <option value="">Select Program</option>
                  {programs.map((p: any) => (
                    <option key={p.code || p.id} value={p.code}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={12} className="text-gray-400" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5 group/field">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Member Number</label>
              <input
                {...register(`passengers.${index}.frequentFlyerNumber`)}
                placeholder="FF Number"
                className="w-full h-11 px-5 bg-gray-50/50 border-2 border-transparent hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-xl text-[10px] font-bold outline-none transition-all placeholder:text-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Contact info (If first passenger) */}
        {index === 0 && (
          <div className="pt-8 border-t border-dashed border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[9px] font-black text-gray-300 uppercase tracking-widest hidden md:block">Contact Info</div>

            <div className="relative group/field space-y-2">
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2">
                  <Mail size={16} className="text-gray-300 group-focus-within/field:text-[#8B5CF6] transition-colors" />
                </div>
                <input
                  {...register(`passengers.${index}.email`)}
                  placeholder="Email Address"
                  className={`w-full h-14 pl-14 pr-6 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.email ? 'border-red-500/50 focus:border-red-500' : 'border-transparent'}`}
                />
              </div>
              {passengerErrors?.email && <div className="flex items-center gap-1 text-red-500 pl-1"><AlertCircle size={10} /><span className="text-[9px] font-black uppercase tracking-widest">{passengerErrors.email.message}</span></div>}
            </div>

            <div className="relative group/field space-y-2">
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2">
                  <Phone size={16} className="text-gray-300 group-focus-within/field:text-[#8B5CF6] transition-colors" />
                </div>
                <input
                  {...register(`passengers.${index}.phone`)}
                  placeholder="Mobile Number"
                  className={`w-full h-14 pl-14 pr-6 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.phone ? 'border-red-500/50 focus:border-red-500' : 'border-transparent'}`}
                />
              </div>
              {passengerErrors?.phone && <div className="flex items-center gap-1 text-red-500 pl-1"><AlertCircle size={10} /><span className="text-[9px] font-black uppercase tracking-widest">{passengerErrors.phone.message}</span></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
