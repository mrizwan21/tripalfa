import * as React from 'react';
export interface InputOTPProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}
export const InputOTP = ({ length = 6, value = '', onChange, className = '' }: InputOTPProps) => {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const handleChange = (index: number, char: string) => {
    const chars = value.split('');
    chars[index] = char.slice(-1);
    const newVal = chars.join('').slice(0, length);
    onChange?.(newVal);
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  };
  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          id={`input-otp-digit-${i}`}
          name={`otpDigit${i}`}
          ref={el => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          className="h-10 w-10 rounded-md border text-center text-lg font-medium shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      ))}
    </div>
  );
};
