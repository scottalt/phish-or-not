'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AuthFlowProps {
  onSignIn: (email: string) => Promise<{ error: string | null; existing?: boolean }>;
  onVerifyCode: (email: string, code: string) => Promise<{ error: string | null }>;
  onCancel: () => void;
  headless?: boolean;
}

export function AuthFlow({ onSignIn, onVerifyCode, onCancel, headless = false }: AuthFlowProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'needs-agreement' | 'sending' | 'sent' | 'verifying' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) { setErrorMsg('Enter a valid email'); setState('error'); return; }
    setState('loading');
    setErrorMsg('');
    const { error, existing } = await onSignIn(email);
    if (error) { setErrorMsg(error); setState('error'); return; }
    if (existing) {
      // Returning user — skip agreement, OTP already sent
      try { localStorage.setItem('terms_agreed', '1'); } catch {}
      setState('sent');
    } else {
      // New user — OTP sent, but show agreement before code entry
      setState('needs-agreement');
    }
  }

  async function handleAgree() {
    setAgreed(true);
    try { localStorage.setItem('terms_agreed', '1'); } catch {}
    setState('sent');
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length !== 6) { setErrorMsg('Enter the 6-digit code from your email'); return; }
    setState('verifying');
    const { error } = await onVerifyCode(email, trimmed);
    if (error) { setErrorMsg(error); setState('sent'); }
  }

  // Step 2b: New user must agree before proceeding to code entry
  if (state === 'needs-agreement') {
    const agreementContent = (
      <div className="space-y-3">
        <div className="text-[var(--c-primary)] text-sm font-mono font-bold">Welcome, new operator</div>
        <div className="text-[var(--c-secondary)] text-sm font-mono leading-relaxed">
          A verification code has been sent to {email}. Before you continue, please review and accept our policies.
        </div>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-[var(--c-primary)]"
          />
          <span className="text-[var(--c-muted)] text-xs font-mono leading-relaxed">
            I agree to the{' '}
            <Link href="/privacy" target="_blank" className="text-[var(--c-secondary)] underline hover:text-[var(--c-primary)] transition-colors">Privacy Policy</Link>
            {' '}and{' '}
            <Link href="/terms" target="_blank" className="text-[var(--c-secondary)] underline hover:text-[var(--c-primary)] transition-colors">Terms of Use</Link>
          </span>
        </label>
        <button
          onClick={handleAgree}
          disabled={!agreed}
          className="w-full py-3 term-border text-[var(--c-primary)] font-mono font-bold text-sm tracking-widest hover:bg-[color-mix(in_srgb,var(--c-primary)_5%,transparent)] disabled:opacity-40"
        >
          [ CONTINUE ]
        </button>
        <button
          type="button"
          onClick={() => { setState('idle'); setEmail(''); setErrorMsg(''); setAgreed(false); }}
          className="w-full text-[var(--c-secondary)] text-xs font-mono hover:text-[var(--c-primary)] transition-colors"
        >
          use different email
        </button>
      </div>
    );

    if (headless) return agreementContent;

    return (
      <div className="term-border bg-[var(--c-bg)]">
        <div className="border-b border-[color-mix(in_srgb,var(--c-primary)_35%,transparent)] px-3 py-1.5 flex items-center justify-between">
          <span className="text-[var(--c-secondary)] text-sm tracking-widest">TERMS</span>
          <button onClick={onCancel} aria-label="Close" className="text-[var(--c-secondary)] text-sm font-mono hover:text-[var(--c-primary)] p-1">✕</button>
        </div>
        <div className="px-3 py-4">
          {agreementContent}
        </div>
      </div>
    );
  }

  // Step 3: Enter verification code
  if (state === 'sent' || state === 'verifying') {
    const formContent = (
      <form onSubmit={handleVerify} className="space-y-3">
        <div className="text-[var(--c-primary)] text-sm font-mono font-bold">Code sent to {email}</div>
        <div className="text-[var(--c-secondary)] text-sm font-mono leading-relaxed">
          Check your email for a 6-digit code and enter it below.
        </div>
        <div className="text-[var(--c-secondary)]/60 text-xs font-mono leading-relaxed">
          Don&apos;t see it? Check your Junk/Spam folder.
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErrorMsg(''); }}
          placeholder="000000"
          autoFocus
          className="w-full bg-transparent border border-[color-mix(in_srgb,var(--c-primary)_25%,transparent)] px-3 py-3 text-[var(--c-primary)] font-mono text-xl tracking-[0.4em] placeholder:text-[var(--c-dark)] focus:outline-none focus:border-[color-mix(in_srgb,var(--c-primary)_60%,transparent)] text-center"
        />
        {errorMsg && <div className="text-[#ff3333] text-sm font-mono">{errorMsg}</div>}
        <button
          type="submit"
          disabled={state === 'verifying'}
          className="w-full py-3 term-border text-[var(--c-primary)] font-mono font-bold text-sm tracking-widest hover:bg-[color-mix(in_srgb,var(--c-primary)_5%,transparent)] disabled:opacity-40"
        >
          {state === 'verifying' ? 'VERIFYING...' : '[ VERIFY ]'}
        </button>
        <button
          type="button"
          onClick={() => { setState('idle'); setCode(''); setErrorMsg(''); }}
          className="w-full text-[var(--c-secondary)] text-xs font-mono hover:text-[var(--c-primary)] transition-colors"
        >
          use different email
        </button>
      </form>
    );

    if (headless) return formContent;

    return (
      <div className="term-border bg-[var(--c-bg)]">
        <div className="border-b border-[color-mix(in_srgb,var(--c-primary)_35%,transparent)] px-3 py-1.5 flex items-center justify-between">
          <span className="text-[var(--c-secondary)] text-sm tracking-widest">ENTER_CODE</span>
          <button onClick={onCancel} aria-label="Close verification" className="text-[var(--c-secondary)] text-sm font-mono hover:text-[var(--c-primary)] p-1">✕</button>
        </div>
        <div className="px-3 py-4">
          {formContent}
        </div>
      </div>
    );
  }

  // Step 1: Enter email
  const formContent = (
    <form onSubmit={handleEmailSubmit} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="operator@terminal.sh"
        autoFocus
        className="w-full bg-transparent border border-[color-mix(in_srgb,var(--c-primary)_25%,transparent)] px-3 py-2.5 text-[var(--c-primary)] font-mono text-base placeholder:text-[var(--c-dark)] focus:outline-none focus:border-[color-mix(in_srgb,var(--c-primary)_60%,transparent)]"
      />
      {state === 'error' && (
        <div className="text-[#ff3333] text-sm font-mono">{errorMsg}</div>
      )}
      <button
        type="submit"
        disabled={state === 'loading'}
        className="w-full py-3 term-border text-[var(--c-primary)] font-mono font-bold text-sm tracking-widest hover:bg-[color-mix(in_srgb,var(--c-primary)_5%,transparent)] disabled:opacity-40"
      >
        {state === 'loading' ? 'CHECKING...' : '[ SEND CODE ]'}
      </button>
    </form>
  );

  if (headless) return formContent;

  return (
    <div className="term-border bg-[var(--c-bg)]">
      <div className="border-b border-[color-mix(in_srgb,var(--c-primary)_35%,transparent)] px-3 py-1.5 flex items-center justify-between">
        <span className="text-[var(--c-secondary)] text-sm tracking-widest">CLAIM_PROFILE</span>
        <button onClick={onCancel} aria-label="Close sign-in" className="text-[var(--c-secondary)] text-sm font-mono hover:text-[var(--c-primary)] p-1">✕</button>
      </div>
      <div className="px-3 py-3">
        {formContent}
      </div>
    </div>
  );
}
