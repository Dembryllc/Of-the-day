import { analytics } from '@heycatch/sdk';

// HeyCatch marketing analytics. Public marketing pages ONLY.
// Every event from any other path (dashboard, demo, login, upgrade,
// projector windows) is dropped here, in the browser, before it is sent.
// We never call setIdentity: no teacher emails or names leave the app.
import { MARKETING_PATHS } from './routes';
const MARKETING_SET = new Set(MARKETING_PATHS);

// Success events, the one exception to the marketing-only rule: sign-up and
// sign-in finish on the sign-in screen, just before the app opens. Event name
// plus `method` ('email' or 'google') only; never a name or email.
const SUCCESS_EVENTS = new Set(['signup_completed', 'signin_completed']);

const isMarketingPage = () => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return MARKETING_SET.has(path);
};

analytics.init({
  projectKey: 'hck_pk_BCY7uL61J4QM4mmag3Omo6tlTjUBB1NO',
  install: { framework: 'vite-react', frameworkVersion: '19', agent: 'claude-code' },
  beforeSend: event => {
    if (!event) return null;
    if (isMarketingPage()) return event;
    return SUCCESS_EVENTS.has(event.event) ? event : null;
  },
});

// Named conversion events. Never pass names, emails, or anything typed.
export function track(event, properties) {
  try {
    analytics.trackEvent(event, properties);
  } catch {
    // Analytics must never break the page.
  }
}
