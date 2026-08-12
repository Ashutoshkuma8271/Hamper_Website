import React from 'react';
import { COUNTRY_CODES } from '@/lib/security';

interface CountryPhoneInputProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  required?: boolean;
  className?: string;
}

export default function CountryPhoneInput({
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  required = true,
  className = '',
}: CountryPhoneInputProps) {
  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3.5 z-10 flex items-center gap-1">
        <span className="text-sm select-none">{selectedCountry.flag}</span>
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="bg-transparent font-semibold text-xs text-wine-800 dark:text-gold-300 outline-none cursor-pointer pr-1 border-r border-cream-300 dark:border-gray-600 select-none"
          aria-label="Select Country Code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code} className="dark:bg-gray-800 dark:text-white">
              {c.flag} {c.code} ({c.country})
            </option>
          ))}
        </select>
      </div>

      <input
        type="tel"
        required={required}
        maxLength={12}
        autoComplete="tel-national"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, '').slice(0, 12))}
        placeholder={selectedCountry.code === '+91' ? '10-digit mobile number' : 'Mobile number'}
        className="input pl-28 w-full"
      />
    </div>
  );
}
