import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from './lib/firebase';
import { createUserDocument, getUserDocument } from './lib/firestore';

const LOGO_SRC = '/assets/ofthedaylogi.png';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '984386798513-aprar4ehdq87dd4jtguigupaiva0pnr5.apps.googleusercontent.com';

const tsToMs = ts => {
  if (typeof ts === 'number') return ts;
  return ts?.toMillis?.() ?? (ts?.seconds != null ? ts.seconds * 1000 : null);
};

function friendlyAuthError(errorOrCode) {
  const code = typeof errorOrCode === 'string' ? errorOrCode : errorOrCode?.code;
  const details = typeof errorOrCode === 'string' ? '' : errorOrCode?.message;
  switch (code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/weak-password': return 'Use at least 6 characters for your password.';
    case 'auth/user-not-found': return 'No account found for this email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/invalid-credential': return 'Invalid email or password.';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    case 'auth/popup-closed-by-user': return '';
    case 'auth/cancelled-popup-request': return '';
    case 'auth/popup-blocked': return 'Pop-ups are blocked. Please allow pop-ups for this site and try again.';
    case 'auth/account-exists-with-different-credential': return 'An account already exists with this email. Try signing in with email and password.';
    case 'auth/operation-not-allowed': return 'This sign-in method is not enabled. Go to Firebase Console → Authentication → Sign-in method and enable Email/Password and Google.';
    case 'auth/unauthorized-domain': return 'This domain is not authorized for sign-in. Go to Firebase Console → Authentication → Settings → Authorized domains and add this domain.';
    case 'auth/internal-error': return `Google sign-in hit a configuration issue.${details && details !== 'Firebase: Error (auth/internal-error).' ? ` Details: ${details}` : ' Please try again or use email sign-in.'}`;
    default: return `Something went wrong (${code || 'unknown'}). Try again.`;
  }
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity="true"]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Google sign-in script could not load.'));
    document.head.appendChild(script);
  });
}

async function signInWithGoogleIdentity() {
  await loadGoogleIdentityScript();
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2 || !GOOGLE_CLIENT_ID) {
      reject({ code: 'auth/internal-error', message: 'Google Identity Services is not configured.' });
      return;
    }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: async response => {
        if (response?.error) {
          reject({ code: `google/${response.error}`, message: response.error_description || response.error });
          return;
        }
        try {
          const credential = GoogleAuthProvider.credential(null, response.access_token);
          const result = await signInWithCredential(auth, credential);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
      error_callback: error => reject({ code: 'google/popup-error', message: error?.message || error?.type || 'Google sign-in popup failed.' }),
    });
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
}

export default function AuthScreen({ onAuthed, googleError }) {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('signup') ? 'signup' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '', grade: '3–5' });
  const [error, setError] = useState(() => googleError ? friendlyAuthError(googleError) || 'Google sign-in failed. Try again.' : '');
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const setField = (key, value) => { setForm(f => ({ ...f, [key]: value })); setError(''); };
  const switchMode = m => { setMode(m); setError(''); setResetSent(false); };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogleIdentity();
      setBusy(false);
    } catch (err) {
      console.error('Google sign-in failed', err);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'google/popup-error') {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithPopup(auth, provider);
          return;
        } catch (popupErr) {
          console.error('Google Firebase popup fallback failed', popupErr);
          const redirectMsg = friendlyAuthError(popupErr);
          setBusy(false);
          if (redirectMsg) setError(redirectMsg);
          return;
        }
      }
      const msg = friendlyAuthError(err);
      setBusy(false);
      if (msg) setError(msg);
    }
  };

  const submit = async e => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    if (!email || !password || (mode === 'signup' && (!form.name.trim() || !form.grade))) {
      setError('Fill out all required fields.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        await createUserDocument(cred.user.uid, { name: form.name.trim(), email, grade: form.grade });
        onAuthed({ uid: cred.user.uid, email, emailVerified: false, name: form.name.trim(), grade: form.grade, plan: 'trial', trialStartedAt: Date.now() });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getUserDocument(cred.user.uid);
        onAuthed({
          uid: cred.user.uid,
          email: cred.user.email,
          emailVerified: cred.user.emailVerified,
          name: userDoc?.name || cred.user.displayName || '',
          grade: userDoc?.grade || '3–5',
          plan: userDoc?.plan || 'free',
          trialStartedAt: tsToMs(userDoc?.trialStartedAt),
          tier: userDoc?.tier || null,
        });
      }
    } catch (err) {
      setError(friendlyAuthError(err.code));
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email) { setError('Enter your email address first.'); return; }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError(friendlyAuthError(err.code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <img className="auth-logo-img" src={LOGO_SRC} alt="Of The Day logo"/>
        <div className="auth-kicker">The daily ritual for great teachers</div>
        <div className="auth-headline">Your daily classroom ritual is ready.</div>
        <div className="auth-copy">Build connection, calm, and momentum in minutes.</div>
      </div>
      <div className="auth-card-wrap">
        <div className="auth-panel">
          <div className="auth-panel-logo">
            <img src={LOGO_SRC} alt="Of The Day" className="auth-panel-logo-img"/>
          </div>
          <div className="auth-tabs">
            <button type="button" className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
            <button type="button" className={`auth-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>Sign Up</button>
          </div>
          <button type="button" className="auth-google-btn" onClick={handleGoogleSignIn} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <div className="auth-divider"><span>or with email</span></div>
          <form onSubmit={submit}>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} autoComplete="email" placeholder="you@school.edu"/>
            </label>
            {mode === 'signup' && (
              <>
                <label className="auth-field">
                  <span>Your Name</span>
                  <input value={form.name} onChange={e => setField('name', e.target.value)} autoComplete="name" placeholder="Ms. Johnson"/>
                </label>
                <div className="auth-field">
                  <span>Grade Level</span>
                  <div className="auth-grade-chips">
                    {['K–2', '3–5', '6–8', '9–12'].map(g => (
                      <button key={g} type="button" className={`auth-grade-chip${form.grade === g ? ' active' : ''}`} onClick={() => setField('grade', g)}>{g}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <label className="auth-field">
              <span>Password</span>
              <input type="password" value={form.password} onChange={e => setField('password', e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="Your password"/>
              {mode === 'signup' && <span className="auth-field-hint">At least 8 characters</span>}
            </label>
            {error && <div className="auth-error">{error}</div>}
            {resetSent && <div className="auth-success">Password reset email sent. Check your inbox.</div>}
            <button className="btn-primary auth-submit" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
            {mode === 'login' && (
              <button className="auth-switch" type="button" onClick={handlePasswordReset} disabled={busy}>
                Forgot your password?
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
