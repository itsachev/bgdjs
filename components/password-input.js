"use client";

import { useState } from "react";

export function PasswordInput({ id, value, onChange, placeholder, minLength, required = true }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-border bg-background-elevated px-4 py-3 pr-11 outline-none transition-colors focus:border-accent"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-foreground-muted transition-colors hover:text-foreground"
      >
        {visible ? (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.7C4.4 8.1 2.9 10 2 12c1.6 3.6 5.4 7 10 7 1.7 0 3.3-.4 4.7-1.2M9.9 4.2A10.6 10.6 0 0 1 12 4c4.6 0 8.4 3.4 10 7-.6 1.3-1.4 2.5-2.4 3.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 12c1.6-3.6 5.4-7 10-7s8.4 3.4 10 7c-1.6 3.6-5.4 7-10 7s-8.4-3.4-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
