import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { getCountries, getCountryCallingCode, AsYouType } from 'libphonenumber-js';
import Flags from 'country-flag-icons/react/3x2';

// ── Country list ──────────────────────────────────────────────────────────────

interface Country { code: string; name: string; dial: string; }

const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

const COUNTRIES: Country[] = (getCountries() as string[])
  .map(code => {
    try { return { code, name: displayNames.of(code) || code, dial: `+${getCountryCallingCode(code as any)}` }; }
    catch { return null; }
  })
  .filter(Boolean)
  .sort((a, b) => a!.name.localeCompare(b!.name)) as Country[];

const BY_CODE = Object.fromEntries(COUNTRIES.map(c => [c.code, c]));

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_DIGITS = 13; // total digits including dial code (from +)

const dialDigits  = (dial: string) => dial.replace(/\D/g, '').length;
const totalDigits = (dial: string, nat: string) =>
  dialDigits(dial) + nat.replace(/\D/g, '').length;

// ── Flag ──────────────────────────────────────────────────────────────────────

const FlagImg: React.FC<{ code: string; className?: string }> = ({ code, className }) => {
  const F = (Flags as any)[code];
  if (!F) return <span style={{ fontSize: 18 }}>🏳</span>;
  return <F className={className || 'phone-flag-img'} title={code} />;
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  defaultCountry?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  hint,
  error: externalError,
  defaultCountry = 'RW',
}) => {
  const [country,  setCountry]  = useState(defaultCountry);
  const [national, setNational] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const [search,   setSearch]   = useState('');
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialise from incoming value (e.g. when editing an existing record)
  useEffect(() => {
    if (!value) { setNational(''); return; }
    const matched = COUNTRIES.find(c => value.startsWith(c.dial));
    if (matched) {
      setCountry(matched.code);
      setNational(value.slice(matched.dial.length).trimStart());
    } else {
      setNational(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDropOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const info     = BY_CODE[country] || BY_CODE['RW'];
  const dialCode = info.dial;

  const emit = (natDigits: string, cc: string) => {
    const dial = BY_CODE[cc]?.dial || dialCode;
    onChange(natDigits ? `${dial}${natDigits}` : '');
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    // Enforce total digit cap (dial code digits + national digits ≤ MAX_DIGITS)
    if (dialDigits(dialCode) + digits.length > MAX_DIGITS) return;
    // Pretty-format the national part as the user types
    const formatter = new AsYouType(country as any);
    const full = formatter.input(`${dialCode}${digits}`);
    const nat  = full.startsWith(dialCode)
      ? full.slice(dialCode.length).trimStart()
      : full.replace(dialCode, '').trimStart();
    setNational(nat);
    emit(digits, country);
  };

  const selectCountry = (cc: string) => {
    setCountry(cc);
    setDropOpen(false);
    setSearch('');
    emit(national.replace(/\D/g, ''), cc);
    inputRef.current?.focus();
  };

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const total = totalDigits(dialCode, national);
  const over  = total > MAX_DIGITS;
  const error = externalError || (over ? `Max ${MAX_DIGITS} digits (from +)` : undefined);

  return (
    <div className="space-y-1">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className={['phone-input-wrapper', error ? 'phone-input-error' : '', disabled ? 'phone-input-disabled' : ''].filter(Boolean).join(' ')}>

        {/* ── Country selector ── */}
        <div className="phone-country-wrap" ref={wrapRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => { setDropOpen(o => !o); setSearch(''); }}
            className="phone-country-btn"
            aria-haspopup="listbox"
            aria-expanded={dropOpen}
          >
            <FlagImg code={country} className="phone-flag-img" />
            <ChevronDown className={`phone-chevron ${dropOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropOpen && (
            <div className="phone-dropdown" role="listbox">
              <div className="phone-dropdown-search">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country or +code…"
                  className="phone-dropdown-search-input"
                />
              </div>
              <ul className="phone-dropdown-list">
                {filtered.map(c => (
                  <li key={c.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.code === country}
                      onClick={() => selectCountry(c.code)}
                      className={`phone-dropdown-item ${c.code === country ? 'phone-dropdown-item--active' : ''}`}
                    >
                      <FlagImg code={c.code} className="phone-flag-img-sm" />
                      <span className="flex-1 text-left truncate">{c.name}</span>
                      <span className="phone-dropdown-dial">{c.dial}</span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-3 py-4 text-xs text-gray-400 text-center">No results</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* ── Dial code label ── */}
        <span className="phone-dial-code">{dialCode}</span>

        {/* ── Divider ── */}
        <span className="phone-divider" aria-hidden="true" />

        {/* ── Number field ── */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={national}
          onChange={handleInput}
          disabled={disabled}
          placeholder={placeholder ?? '7 88 000 001'}
          className="phone-number-input"
          aria-label="Phone number"
        />
      </div>

      {/* Digit counter */}
      {national && (
        <p className={`text-xs text-right pr-1 ${over ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
          {total}/{MAX_DIGITS}
        </p>
      )}

      {hint  && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
