'use client';

import { useEffect, useState } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser';

const INITIAL_FORM = {
  email: '',
  password: '',
};

export function AuthPanel() {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState(INITIAL_FORM);
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus('');

    try {
      const supabase = getBrowserSupabaseClient();
      const credentials = {
        email: form.email,
        password: form.password,
      };

      const result =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp(credentials);

      if (result.error) {
        setStatus(result.error.message);
      } else if (mode === 'signup') {
        setStatus('Check your inbox to confirm the new account.');
      } else {
        setStatus('Signed in successfully.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setStatus('');

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();
      setStatus(error ? error.message : 'Signed out.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-panel">
      <div className="auth-panel__header">
        <div>
          <p className="section-card__eyebrow">Supabase Auth</p>
          <h2>Replace Cognito with one shared session model.</h2>
        </div>
        {session ? (
          <button className="button button--secondary" disabled={busy} onClick={handleSignOut} type="button">
            Sign out
          </button>
        ) : null}
      </div>

      <div className="auth-panel__session">
        <p className="auth-panel__label">Current session</p>
        <pre>{session ? JSON.stringify(session.user, null, 2) : 'No active session'}</pre>
      </div>

      <form className="auth-panel__form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            type="email"
            value={form.email}
          />
        </label>

        <label>
          Password
          <input
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            name="password"
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            type="password"
            value={form.password}
          />
        </label>

        <div className="auth-panel__actions">
          <button className="button" disabled={busy} type="submit">
            {busy ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          <button
            className="button button--ghost"
            disabled={busy}
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            type="button"
          >
            {mode === 'signin' ? 'Need an account?' : 'Have an account?'}
          </button>
        </div>
      </form>

      {status ? <p className="auth-panel__status">{status}</p> : null}
    </section>
  );
}
