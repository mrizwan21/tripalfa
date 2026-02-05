import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, RefreshCw, Shield, UserPlus2 } from 'lucide-react';
import { z } from 'zod';
import {
  StaffUserInput,
  staffUserSchema,
  businessTypes,
  countries,
  languages,
  passwordChecklist,
} from '@tripalfa/shared-utils';
import {
  FileUploadField,
  PasswordField,
  PhoneField,
  ProgressIndicator,
  SelectField,
  TextField,
} from '@tripalfa/ui-components';

const steps = [
  { label: 'Identity' },
  { label: 'Company DNA' },
  { label: 'Security' },
];

const outlineButtonClass =
  'inline-flex items-center gap-2 rounded-2xl border border-secondary-200 px-5 py-2.5 text-sm font-semibold text-secondary-600 transition hover:border-secondary-300 hover:text-primary-600 dark:border-secondary-700 dark:text-secondary-300';
const primaryButtonClass =
  'inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70';

const defaultValues: StaffUserInput = {
  fullName: '',
  businessEmail: '',
  phone: { countryDialCode: countries[0]?.dialCode ?? '+1', number: '' },
  contactPersonName: '',
  designation: '',
  branchLocation: '',
  preferredLanguage: languages[0]?.code ?? 'en',
  preferredLanguageLabel: languages[0]?.name ?? 'English',
  companyRegistrationNumber: '',
  countryOfOperation: countries[0]?.code ?? 'US',
  businessType: businessTypes[0]?.value ?? 'CORPORATE',
  password: '',
  confirmPassword: '',
  avatar: null,
  termsAccepted: false,
};

const dialCodeOptions = countries.map((country) => ({
  value: country.dialCode,
  label: `${country.flag} ${country.dialCode}`,
}));

const languageOptions = languages.map((language) => ({
  value: language.code,
  label: language.name,
}));

const countryOptions = countries.map((country) => ({
  value: country.code,
  label: `${country.flag} ${country.name}`,
}));

const businessTypeOptions = businessTypes.map((type) => ({
  value: type.value,
  label: type.label,
}));

type FormErrors = Record<string, string>;

function mapErrors(errors: FormErrors, path: string) {
  return errors[path];
}

export default function StaffOnboardingPage() {
  const [values, setValues] = useState<StaffUserInput>(defaultValues);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const passwordChecklistState = useMemo(() => {
    const pwd = values.password ?? '';
    return passwordChecklist.map((item) => {
      if (item.key === 'length') return { ...item, met: pwd.length >= 12 };
      if (item.key === 'uppercase') return { ...item, met: /[A-Z]/.test(pwd) };
      if (item.key === 'lowercase') return { ...item, met: /[a-z]/.test(pwd) };
      if (item.key === 'digit') return { ...item, met: /\d/.test(pwd) };
      if (item.key === 'symbol') return { ...item, met: /[^A-Za-z0-9]/.test(pwd) };
      return { ...item, met: false };
    });
  }, [values.password]);

  const updateValue = <K extends keyof StaffUserInput>(key: K, newValue: StaffUserInput[K]) => {
    setValues((previous) => ({ ...previous, [key]: newValue }));
  };

  const captureErrors = (error: z.ZodError) => {
    const nextErrors: FormErrors = {};
    error.issues.forEach((issue) => {
      nextErrors[issue.path.join('.')] = issue.message;
    });
    setErrors(nextErrors);
    return nextErrors;
  };

  const validate = () => {
    const parsed = staffUserSchema.safeParse(values);
    if (!parsed.success) {
      captureErrors(parsed.error);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmissionMessage(null);
    try {
      const response = await fetch('/api/b2b/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('Failed to submit staff profile');
      const payload = await response.json();
      setSubmissionMessage(`Request received • Ref ${payload.referenceId ?? 'pending'}`);
      setValues(defaultValues);
      setStepIndex(0);
    } catch (error) {
      console.error(error);
      setSubmissionMessage('Something went wrong. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-secondary-400">B2B Experience</p>
          <h2 className="mt-2 text-3xl font-display font-semibold text-secondary-900 dark:text-white">
            Travel Agent Staff Command Center
          </h2>
          <p className="mt-2 max-w-2xl text-secondary-500">
            Capture high-fidelity staff intelligence with biomimetic validation, multilingual access controls, and instant compliance scoring.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-secondary-200 bg-white px-4 py-2 text-sm font-medium text-secondary-600 shadow-xs transition hover:border-primary-200 hover:text-primary-600"
        >
          <RefreshCw className="h-4 w-4" />
          Sync CRM
        </button>
      </div>

      <ProgressIndicator steps={steps} activeIndex={stepIndex} />

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-8 rounded-3xl border border-secondary-100 bg-white/70 p-8 shadow-soft backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/60">
          {stepIndex === 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              <TextField
                label="Staff Full Name"
                name="fullName"
                value={values.fullName}
                required
                onChange={(value) => updateValue('fullName', value)}
                error={mapErrors(errors, 'fullName')}
              />
              <TextField
                label="Business Email"
                name="businessEmail"
                value={values.businessEmail}
                required
                onChange={(value) => updateValue('businessEmail', value)}
                error={mapErrors(errors, 'businessEmail')}
              />
              <PhoneField
                label="Phone Number"
                dialCodeOptions={dialCodeOptions}
                countryDialCode={values.phone.countryDialCode}
                number={values.phone.number}
                onDialCodeChange={(countryDialCode) => updateValue('phone', { ...values.phone, countryDialCode })}
                onNumberChange={(number) => updateValue('phone', { ...values.phone, number })}
                error={mapErrors(errors, 'phone.number')}
              />
              <TextField
                label="Contact Person Name"
                name="contactPersonName"
                value={values.contactPersonName}
                required
                onChange={(value) => updateValue('contactPersonName', value)}
                error={mapErrors(errors, 'contactPersonName')}
              />
              <TextField
                label="Designation"
                name="designation"
                value={values.designation ?? ''}
                onChange={(value) => updateValue('designation', value)}
                helperText="Optional — helps personalize comms"
                error={mapErrors(errors, 'designation')}
              />
              <FileUploadField
                label="Profile Avatar"
                name="avatar"
                previewUrl={values.avatar?.preview}
                onFileSelect={(file, preview) =>
                  updateValue('avatar',
                    file
                      ? { name: file.name, size: file.size, type: file.type, preview }
                      : null
                  )
                }
                error={mapErrors(errors, 'avatar')}
              />
            </div>
          )}

          {stepIndex === 1 && (
            <div className="grid gap-6 md:grid-cols-2">
              <TextField
                label="Branch Location"
                name="branchLocation"
                value={values.branchLocation}
                required
                onChange={(value) => updateValue('branchLocation', value)}
                error={mapErrors(errors, 'branchLocation')}
              />
              <SelectField
                label="Preferred Language"
                name="preferredLanguage"
                value={values.preferredLanguage}
                options={languageOptions}
                required
                onChange={(code) => {
                  updateValue('preferredLanguage', code);
                  const selected = languageOptions.find((option) => option.value === code);
                  updateValue('preferredLanguageLabel', selected?.label ?? '');
                }}
                error={mapErrors(errors, 'preferredLanguage')}
              />
              <SelectField
                label="Country of Operation"
                name="countryOfOperation"
                value={values.countryOfOperation}
                options={countryOptions}
                required
                onChange={(value) => updateValue('countryOfOperation', value)}
                error={mapErrors(errors, 'countryOfOperation')}
              />
              <SelectField
                label="Business Type"
                name="businessType"
                value={values.businessType}
                options={businessTypeOptions}
                required
                onChange={(value) => updateValue('businessType', value as StaffUserInput['businessType'])}
                error={mapErrors(errors, 'businessType')}
              />
              <TextField
                label="Company Registration Number"
                name="companyRegistrationNumber"
                value={values.companyRegistrationNumber}
                required
                onChange={(value) => updateValue('companyRegistrationNumber', value)}
                error={mapErrors(errors, 'companyRegistrationNumber')}
              />
            </div>
          )}

          {stepIndex === 2 && (
            <div className="grid gap-6 md:grid-cols-2">
              <PasswordField
                label="Password"
                name="password"
                value={values.password}
                required
                onChange={(value) => updateValue('password', value)}
                error={mapErrors(errors, 'password')}
                checklist={passwordChecklistState}
              />
              <PasswordField
                label="Confirm Password"
                name="confirmPassword"
                value={values.confirmPassword}
                required
                onChange={(value) => updateValue('confirmPassword', value)}
                error={mapErrors(errors, 'confirmPassword')}
              />
              <label className="col-span-full flex items-start gap-3 rounded-2xl border border-secondary-200 bg-secondary-50 p-4 text-sm dark:border-secondary-700 dark:bg-secondary-900">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  checked={values.termsAccepted}
                  onChange={(event) => updateValue('termsAccepted', event.target.checked)}
                />
                <span>
                  I confirm that I am authorized to create staff credentials for this agency and agree to the platform usage policy.
                </span>
              </label>
              {mapErrors(errors, 'termsAccepted') ? (
                <p className="text-sm text-error-500">{mapErrors(errors, 'termsAccepted')}</p>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm text-secondary-500">
              <Shield className="h-4 w-4 text-primary-500" />
              AES-256 encryption & GDPR compliant
            </div>
            <div className="flex gap-3">
              {stepIndex > 0 && (
                <button type="button" className={outlineButtonClass} onClick={handleBack}>
                  Back
                </button>
              )}
              {stepIndex < steps.length - 1 && (
                <button type="button" className={primaryButtonClass} onClick={handleNext}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              )}
              {stepIndex === steps.length - 1 && (
                <button
                  type="submit"
                  disabled={submitting}
                  className={primaryButtonClass}
                >
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus2 className="h-4 w-4" />}
                  Launch Profile
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-secondary-900/90 p-6 text-white shadow-soft">
            <p className="text-sm uppercase tracking-[0.4em] text-secondary-400">Mission Intel</p>
            <h3 className="mt-4 text-2xl font-display font-semibold">Review Snapshot</h3>
            <div className="mt-6 space-y-4 text-sm text-secondary-200">
              <div>
                <p className="text-secondary-400">Name</p>
                <p className="font-medium text-white">{values.fullName || '—'}</p>
              </div>
              <div>
                <p className="text-secondary-400">Business Email</p>
                <p className="font-medium text-white">{values.businessEmail || '—'}</p>
              </div>
              <div>
                <p className="text-secondary-400">Branch</p>
                <p className="font-medium text-white">{values.branchLocation || '—'}</p>
              </div>
              <div>
                <p className="text-secondary-400">Business Type</p>
                <p className="font-medium text-white">
                  {businessTypeOptions.find((option) => option.value === values.businessType)?.label ?? '—'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm">
              <Shield className="h-4 w-4 text-primary-200" />
              Real-time fraud monitoring active
            </div>
          </div>

          <div className="rounded-3xl border border-secondary-100 bg-white/80 p-6 shadow-soft dark:border-secondary-800 dark:bg-secondary-900/60">
            <p className="text-sm font-semibold text-secondary-500">Live Validation</p>
            <ul className="mt-4 space-y-3 text-sm">
              {passwordChecklistState.map((item) => (
                <li key={item.key} className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${item.met ? 'bg-success-500' : 'bg-secondary-300'}`} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {submissionMessage && (
            <div className="rounded-3xl border border-success-200 bg-success-50/70 p-6 text-success-700">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                {submissionMessage}
              </div>
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}
