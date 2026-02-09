import React from 'react';
// @ts-ignore
import { useFormContext } from 'react-hook-form';
import { User, Calendar, Mail, Phone, ChevronDown, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { fetchNationalities, fetchCountries } from '../../lib/api';
import { SingleMonthCalendar } from '../ui/SingleMonthCalendar';

// Schema Definition (exported for use in parent)
export const passengerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  nationality: z.string().min(1, "Please select a nationality"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female"], { required_error: "Please select a gender" }),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(7, "Phone number must be at least 7 digits"),
  // Travel Documents
  passportNumber: z.string().min(6, "Passport number must be at least 6 characters"),
  passportExpiry: z.string().min(1, "Passport expiry date is required"),
  residencyCountry: z.string().min(1, "Please select a residency country"),
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

        {/* Contact info (If first passenger) */}
        {index === 0 && (
          <div className="pt-8 border-t border-dashed border-gray-100 space-y-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={14} className="text-[#8B5CF6]" />
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Contact Information</h4>
              <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">(Required)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group/field space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email Address*</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2">
                    <Mail size={16} className="text-gray-300 group-focus-within/field:text-[#8B5CF6] transition-colors" />
                  </div>
                  <input
                    {...register(`passengers.${index}.email`)}
                    placeholder="Enter your email"
                    className={`w-full h-14 pl-14 pr-6 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.email ? 'border-red-500/50 focus:border-red-500' : 'border-transparent'}`}
                  />
                </div>
                {passengerErrors?.email && <div className="flex items-center gap-1 text-red-500 pl-1"><AlertCircle size={10} /><span className="text-[9px] font-black uppercase tracking-widest">{passengerErrors.email.message}</span></div>}
              </div>

              <div className="relative group/field space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Phone Number*</label>
                <div className="flex gap-2">
                  <div className="relative w-32">
                    <select
                      {...register(`passengers.${index}.phoneCountryCode`)}
                      className={`w-full h-14 px-3 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[10px] font-bold appearance-none outline-none transition-all cursor-pointer ${passengerErrors?.phoneCountryCode ? 'border-red-500/50 focus:border-red-500' : 'border-transparent'}`}
                    >
                      <option value="">Code</option>
                      {countries.map((c: any) => (
                        <option key={c.code} value={c.dialCode}>{c.dialCode} ({c.code})</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown size={12} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Phone size={16} className="text-gray-300 group-focus-within/field:text-[#8B5CF6] transition-colors" />
                    </div>
                    <input
                      {...register(`passengers.${index}.phone`)}
                      placeholder="Mobile Number"
                      className={`w-full h-14 pl-12 pr-6 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${passengerErrors?.phone ? 'border-red-500/50 focus:border-red-500' : 'border-transparent'}`}
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
      </div>
    </div>
  );
}
