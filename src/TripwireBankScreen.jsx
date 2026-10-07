import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from './lib/firebase';
import { CAT_META } from './lib/catMeta';
import { buildTripwireBundle, tripwireDeckActivities, TRIPWIRE_BUNDLE_DAYS } from './lib/tripwireBundle';

const TRIPWIRE_PRICE_ID = import.meta.env.VITE_STRIPE_TRIPWIRE_PRICE_ID;

function TripwirePaywall({ account, busy, error, onBuy }) {
  return (
    <div className="routine-col" style={{ background: "var(--sand)" }}>
      <div className="browse-header">
        <div className="section-eyebrow">10-Day Morning Meeting Bank</div>
        <div style={{fontSize:14, color:"var(--muted)", marginTop:3}}>$7, one time — no subscription</div>
      </div>
      <div className="browse-scroll" style={{ padding: "0 4px" }}>
        <div className="browse-card" style={{ borderTop: "3px solid #F5A623", maxWidth: 520 }}>
          <div className="browse-card-title" style={{ fontSize: 18, marginBottom: 8 }}>
            The next two weeks of Morning Meeting, done for you.
          </div>
          <div style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>
            Ten complete Morning Meeting decks — greeting, share, activity, message, all four parts —
            ready to project starting tomorrow. $7, one time, no subscription.
          </div>
          <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16, fontStyle: "italic" }}>
            Straight up: Greeting and Sharing rotate completely fresh across all ten days. A couple of the
            Group Activities and Messages repeat once or twice over the two weeks — we'd rather tell you
            that now than have you notice it on Day 6.
          </div>
          {error && <div style={{ color: "#c0392b", fontSize: 13.5, marginBottom: 10 }}>{error}</div>}
          <button
            className="btn-primary"
            type="button"
            disabled={busy || !account?.uid}
            onClick={onBuy}
          >
            {busy ? "Redirecting…" : "Get the 10-Day Bank — $7"}
          </button>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
            No-questions refund if it's not useful — just email us.
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckCard({ deck, onProject, onAddDay }) {
  const items = tripwireDeckActivities(deck);
  return (
    <div className="browse-card" style={{ borderTop: "3px solid #F5A623" }}>
      <div className="browse-card-title">Day {deck.day}</div>
      <div className="browse-card-meta">{items.length} of 4 parts ready</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "8px 0" }}>
        {items.map(a => {
          const cm = CAT_META[a.cat] || { color: "#CCC", emoji: "" };
          return (
            <div key={a.cat} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <span style={{ color: cm.color }}>{cm.emoji}</span>
              <span style={{ color: "var(--muted)", minWidth: 100 }}>{a.cat}</span>
              <span>{a.title}</span>
            </div>
          );
        })}
      </div>
      <div className="browse-card-actions">
        <button className="btn-secondary btn-compact" type="button" onClick={() => onAddDay(items)}>Use Today</button>
        <button className="btn-secondary btn-compact" type="button" onClick={() => onProject(items)}>Project</button>
      </div>
    </div>
  );
}

function TripwireBundleView({ activities, onProjectDeck, onAddDeckToday }) {
  const bundle = buildTripwireBundle(activities);
  return (
    <div className="routine-col" style={{ background: "var(--sand)" }}>
      <div className="browse-header">
        <div className="section-eyebrow">10-Day Morning Meeting Bank</div>
        <div style={{fontSize:14, color:"var(--muted)", marginTop:3}}>All {TRIPWIRE_BUNDLE_DAYS} days unlocked</div>
      </div>
      <div className="browse-scroll">
        <div className="browse-grid">
          {bundle.map(deck => (
            <DeckCard
              key={deck.day}
              deck={deck}
              onProject={items => onProjectDeck?.(items)}
              onAddDay={items => onAddDeckToday?.(items)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Top-level screen: paywall until purchased, bundle view after.
// `account.tripwireBankPurchasedAt` is set by the stripeWebhook handler for
// the one-time $7 checkout (mode: "payment") — see functions/index.js.
export default function TripwireBankScreen({ activities, account, onProjectDeck, onAddDeckToday }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const purchased = Boolean(account?.tripwireBankPurchasedAt);

  const onBuy = async () => {
    if (!TRIPWIRE_PRICE_ID) {
      setError('Checkout is not configured yet. Please contact dembryllc@gmail.com.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const fn = httpsCallable(functions, 'createTripwireCheckoutSession');
      const { data } = await fn({ userId: account.uid });
      window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  if (!purchased) {
    return <TripwirePaywall account={account} busy={busy} error={error} onBuy={onBuy} />;
  }

  return (
    <TripwireBundleView
      activities={activities}
      onProjectDeck={onProjectDeck}
      onAddDeckToday={onAddDeckToday}
    />
  );
}
