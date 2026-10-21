"use client";

import { useState } from "react";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
};

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder = "••••••••",
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        required
        minLength={6}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-pressed={show}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}