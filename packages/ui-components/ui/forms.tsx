import React from 'react';

export interface FieldProps {
    label?: string;
    error?: string;
    className?: string;
    [key: string]: any;
}

export const TextField = ({ label, error, className = '', ...props }: FieldProps) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <input
            type="text"
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none border-gray-300"
            {...props}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

export const SelectField = ({ label, error, options = [], className = '', ...props }: FieldProps & { options: { label: string; value: string }[] }) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <select
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none border-gray-300 bg-white"
            {...props}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

export const PasswordField = (props: FieldProps) => (
    <TextField {...props} type="password" />
);

export const PhoneField = ({ label, error, className = '', countryDialCode, ...props }: FieldProps & { countryDialCode?: string }) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <div className="flex">
            {countryDialCode && (
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    {countryDialCode}
                </span>
            )}
            <input
                type="tel"
                className={`flex-1 w-full border rounded-r-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none border-gray-300 ${!countryDialCode ? 'rounded-l-md' : ''}`}
                {...props}
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

export const FileUploadField = ({ label, error, className = '', ...props }: FieldProps) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                {...props}
            />
            <p className="text-gray-500">Click or drag file to upload</p>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

export const ProgressIndicator = ({ steps, activeIndex }: { steps: { label: string }[]; activeIndex: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
        ></div>
    </div>
);
