import { analytics } from '@heycatch/sdk';

// HeyCatch marketing analytics. Public marketing pages ONLY.
// Every event from any other path (dashboard, demo, login, upgrade,
// projector windows) is dropped here, in the browser, before it is sent.
// We never call setIdentity: no teacher emails or names leave the app.
import { MARKETING_PATHS } from './routes';
const MARKETING_SET = new Set(MARKETING_PATHS);

const isMarketingPage = () => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return MARKETING_SET.has(path);
};

analytics.init({
  projectKey: 'hck_pk_BCY7uL61J4QM4mmag3Omo6tlTjUBB1NO',
  install: { framework: 'vite-react', frameworkVersion: '19', agent: 'claude-code' },
  beforeSend: event => (isMarketingPage() ? event : null),
});
