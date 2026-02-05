import { z } from 'zod';

// ============================================================================
// B2B Staff Onboarding Schemas & Types
// ============================================================================

export const staffUserSchema = z.object({
    fullName: z.string().min(2, 'Full name is required'),
    businessEmail: z.string().email('Invalid business email'),
    phone: z.object({
        countryDialCode: z.string(),
        number: z.string().min(5, 'Invalid phone number'),
    }),
    contactPersonName: z.string().min(2, 'Contact person name is required'),
    designation: z.string().optional(),
    branchLocation: z.string().min(2, 'Branch location is required'),
    preferredLanguage: z.string(),
    preferredLanguageLabel: z.string(),
    companyRegistrationNumber: z.string().min(2, 'Registration number is required'),
    countryOfOperation: z.string(),
    businessType: z.enum(['TRAVEL_AGENCY', 'TOUR_OPERATOR', 'OTA', 'CORPORATE', 'WHOLESALER', 'CONSOLIDATOR', 'DMC', 'FRANCHISE']),
    password: z.string().min(12, 'Password must be at least 12 characters'),
    confirmPassword: z.string(),
    avatar: z.any().optional(),
    termsAccepted: z.boolean().refine(val => val === true, 'You must accept terms'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type StaffUserInput = z.infer<typeof staffUserSchema>;

// ============================================================================
// Constants & Reference Data
// ============================================================================

export const businessTypes = [
    { label: 'Travel Agency', value: 'TRAVEL_AGENCY' },
    { label: 'Tour Operator', value: 'TOUR_OPERATOR' },
    { label: 'OTA', value: 'OTA' },
    { label: 'Corporate', value: 'CORPORATE' },
    { label: 'Wholesaler', value: 'WHOLESALER' },
    { label: 'Consolidator', value: 'CONSOLIDATOR' },
    { label: 'DMC', value: 'DMC' },
    { label: 'Franchise', value: 'FRANCHISE' },
] as const;

export const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
    { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
];

export const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'Arabic' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
];

export const passwordChecklist = [
    { key: 'length', label: 'Minimum 12 characters' },
    { key: 'uppercase', label: 'One uppercase letter' },
    { key: 'lowercase', label: 'One lowercase letter' },
    { key: 'digit', label: 'One numeric digit' },
    { key: 'symbol', label: 'One special character' },
];

export * from './constants';
export * from './types';
export * from './utils';
export * from './api';
export * from './hooks';
