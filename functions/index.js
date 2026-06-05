const { onRequest, onCall } = require("firebase-functions/v2/https");
const functionsV1 = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

const CLASSROOM_KID_FACTS = [
  { year: "1969", title: "Apollo 11 astronauts walked on the Moon. Ask students what careful teamwork might have looked like during the mission.", category: "Space" },
  { year: "1977", title: "NASA launched the Voyager spacecraft to explore the outer planets. They are still teaching scientists about space.", category: "Space" },
  { year: "1903", title: "The Wright brothers made one of the first powered airplane flights. Their early plane stayed in the air for less than a minute.", category: "Inventions" },
  { year: "1876", title: "Alexander Graham Bell received a patent for the telephone. It changed how people could talk across long distances.", category: "Inventions" },
  { year: "1822", title: "Harriet Tubman was born around this year. She became known for courage and helping others reach freedom.", category: "Famous People" },
  { year: "1934", title: "Jane Goodall was born. She later studied chimpanzees and helped people care more about animals.", category: "Animals" },
  { year: "1955", title: "Marian Anderson became the first Black singer to perform with the Metropolitan Opera in New York.", category: "Arts & Culture" },
  { year: "1947", title: "Jackie Robinson joined Major League Baseball and helped make professional sports more fair.", category: "Sports" },
  { year: "1983", title: "Sally Ride became the first American woman in space. Her work inspired many young scientists.", category: "Space" },
  { year: "1990", title: "The Hubble Space Telescope launched. It has taken amazing pictures that help people study stars and galaxies.", category: "Space" },
  { year: "1869", title: "The first U.S. transcontinental railroad was completed, helping people and goods travel across the country faster.", category: "Transportation" },
  { year: "1970", title: "Earth Day was celebrated for the first time, encouraging people to protect nature and the planet.", category: "Nature" },
  { year: "1928", title: "Alexander Fleming noticed something that helped lead to penicillin, an important medicine.", category: "Science" },
  { year: "1958", title: "LEGO bricks began to use their modern interlocking design, making creative building easier.", category: "Inventions" },
  { year: "1888", title: "The National Geographic Society was founded to help people learn about Earth, maps, animals, and cultures.", category: "Geography" },
  { year: "1962", title: "Mae Jemison was born. She later became the first Black woman to travel into space.", category: "Famous People" },
  { year: "1706", title: "Benjamin Franklin was born. He became an inventor, writer, scientist, and one of America's founders.", category: "Famous People" },
  { year: "1912", title: "Julia Child was born. She later helped many people learn about cooking through television and books.", category: "Arts & Culture" },
  { year: "1914", title: "Garrett Morgan patented a safety hood that helped protect firefighters and rescue workers.", category: "Inventions" },
  { year: "1880", title: "Helen Keller was born. She became an author and speaker who showed the power of learning and persistence.", category: "Famous People" }
];

function stripHtml(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;|&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function categorize(text = "", fallback = "History") {
  const value = text.toLowerCase();
  if (/born|actor|actress|singer|writer|author|poet|artist|composer|president|prime minister|leader|athlete|scientist|inventor|mathematician/.test(value)) return "Famous People";
  if (/animal|bird|fish|dinosaur|whale|shark|chimpanzee|forest|tree|ocean|earth day|national park/.test(value)) return "Nature";
  if (/space|nasa|planet|moon|mars|rocket|scientist|physics|chemistry|biology|medicine|vaccine|dna|telescope|discovered|invented/.test(value)) return "Science";
  if (/computer|internet|web|software|technology|telephone|radio|television|patent/.test(value)) return "Technology";
  if (/music|film|movie|book|novel|art|museum|theater|opera|album/.test(value)) return "Arts & Culture";
  if (/olympic|baseball|basketball|football|soccer|tennis|championship|world cup/.test(value)) return "Sports";
  if (/court|constitution|election|congress|law|treaty|president|rights|independence/.test(value)) return "Civics";
  return fallback;
}

function isElementaryFriendly(text = "") {
  const value = text.toLowerCase();
  const heavy = /\b(killed|murder|assassinat|execut|massacre|bomb|attack|terror|warplane|invasion|ambush|battle|siege|kidnap|hostage|genocide|disaster|crash|pandemic|plague|slavery|nazi|hitler|atomic bomb|shooting|dead|death|died|conquer|condemned|heretic)\b/;
  const tooPolitical = /\b(coup|dictator|troops|military|missile|nuclear accident|trial|sentenced|prison|riot|monastic|papal|treaty of|kingdom of|empire|pope|emperor|scripture|shrine)\b/;
  return !heavy.test(value) && !tooPolitical.test(value);
}

function isClassroomUseful(description = "", category = "History", year = "") {
  const value = description.toLowerCase();
  const useful = /\b(space|nasa|moon|mars|planet|telescope|invent|patent|computer|web|internet|telephone|book|author|music|art|artist|museum|baseball|basketball|soccer|olympic|scientist|animal|earth|ocean|national park|president|constitution|rights|school|first woman|first black|born)\b/;
  const numericYear = Number(year);
  if (!useful.test(value)) return false;
  if ((category === "History" || category === "Civics") && numericYear && numericYear < 1800 && !/\bbook|artist|scientist|invent|telescope|planet|music\b/.test(value)) {
    return false;
  }
  return true;
}

function makeKidFriendly(description = "", category = "History") {
  let text = description
    .replace(/\s+\[[^\]]+\]/g, "")
    .replace(/\s+\([^)]*d\.\s*\d{3,4}[^)]*\)/gi, "")
    .replace(/\s+\([^)]*aged\s+\d+[^)]*\)/gi, "")
    .replace(/\s+\([^)]*\)/g, "")
    .replace(/\bwas sworn into office\b/gi, "began serving")
    .replace(/\bsucceeded\b/gi, "became")
    .replace(/\bpatented\b/gi, "received a patent for")
    .replace(/\bdebuts?\b/gi, "first appeared")
    .replace(/\s+/g, " ")
    .trim();

  if (/^born:/i.test(text)) {
    text = text.replace(/^Born:\s*/i, "");
    const name = text.split(",")[0].trim();
    if (name) text = `${name} was born. What might students want to learn about this person's life or work?`;
  }

  if (text.length > 155) {
    text = text.slice(0, 152).replace(/\s+\S*$/, "") + ".";
  }

  if (!/[.!?]$/.test(text)) text += ".";
  if (category === "Science" || category === "Space") return text + " What question would a scientist ask about this?";
  if (category === "Famous People") return text + " What character trait might this person have needed?";
  if (category === "Nature") return text + " What does this make you wonder about nature?";
  return text + " What is one connection you can make?";
}

function classroomFactsForDate(date = new Date(), count = 5) {
  const seed = (date.getUTCMonth() + 1) * 37 + date.getUTCDate() * 11;
  return CLASSROOM_KID_FACTS
    .map((item, index) => ({ item, score: (index * 17 + seed) % CLASSROOM_KID_FACTS.length }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map(({ item }) => ({ ...item, classroomSafe: true, source: "Classroom kid fact bank" }));
}

function parseListItems(html, type = "events", limit = 8) {
  const items = [];
  const seen = new Set();
  const itemPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = itemPattern.exec(html)) && items.length < limit) {
    const text = stripHtml(match[1])
      .replace(/\s+more$/i, "")
      .replace(/\s+»$/i, "")
      .trim();
    const itemMatch = text.match(/^(\d{3,4}|[1-9]\d?)\s+(.{16,})$/);
    if (!itemMatch) continue;

    const year = itemMatch[1];
    let description = itemMatch[2].trim();
    if (description.length < 18 || !isElementaryFriendly(description)) continue;

    let category = "History";
    if (type === "birthdays") {
      category = "Famous People";
      if (!/^born\b/i.test(description)) description = "Born: " + description;
    } else {
      category = categorize(description, "History");
    }
    if (!["Science", "Technology", "Famous People", "Sports"].includes(category)) continue;
    if (!isClassroomUseful(description, category, year)) continue;

    const key = year + "|" + description.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ year, title: makeKidFriendly(description, category), category, classroomSafe: true });
  }

  return items;
}

async function fetchPage(path, type, limit) {
  const response = await fetch(path, {
    headers: {
      "User-Agent": "OfTheDay classroom app (educational daily history feature)",
      "Accept": "text/html"
    }
  });
  if (!response.ok) throw new Error(`OnThisDay returned ${response.status} for ${path}`);
  const html = await response.text();
  return parseListItems(html, type, limit);
}

function prioritize(items) {
  const order = ["Nature", "Space", "Science", "Famous People", "Inventions", "Technology", "Arts & Culture", "Sports", "Geography", "Transportation", "Civics", "History"];
  const picked = [];
  const seen = new Set();

  for (const category of order) {
    const next = items.find(item => item.category === category && !seen.has(item.year + item.title));
    if (next) {
      picked.push(next);
      seen.add(next.year + next.title);
    }
  }

  for (const item of items) {
    const key = item.year + item.title;
    if (picked.length >= 8) break;
    if (!seen.has(key)) {
      picked.push(item);
      seen.add(key);
    }
  }

  return picked;
}

// Write trial plan when a new Firebase Auth user is created.
// beforeUserCreated fires before signup completes. Wrapped in try-catch so a
// Firestore failure never blocks sign-up — client-side createUserDocument is a fallback.
// Gen 1 auth trigger — beforeUserCreated (v2) requires GCIP which this project doesn't use.
exports.onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  try {
    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email || '',
      plan: 'trial',
      trialStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to create user document on sign-up:', err);
  }
});

exports.onthisday = onRequest(async (req, res) => {
  const now = new Date();
  const month = MONTHS[now.getUTCMonth()];
  const day = now.getUTCDate();
  const base = "https://www.onthisday.com";
  const sourceUrl = `${base}/events/${month}/${day}`;

  try {
    const [events, birthdays] = await Promise.allSettled([
      fetchPage(`${base}/events/${month}/${day}`, "events", 12),
      fetchPage(`${base}/birthdays/${month}/${day}`, "birthdays", 8)
    ]);

    const combined = [
      ...classroomFactsForDate(now, 8),
      ...(events.status === "fulfilled" ? events.value : []),
      ...(birthdays.status === "fulfilled" ? birthdays.value : []),
    ];
    const items = prioritize(combined);

    if (!items.length) throw new Error("No OnThisDay items parsed");

    res.set("Cache-Control", "public, max-age=21600");
    res.status(200).json({
      date: now.toISOString(),
      source: "Kid-friendly classroom facts + OnThisDay.com",
      sourceUrl,
      events: items
    });
  } catch (error) {
    res.set("Cache-Control", "public, max-age=900");
    res.status(200).json({
      date: now.toISOString(),
      source: "Classroom kid fact bank",
      sourceUrl,
      events: classroomFactsForDate(now, 8),
      warning: error.message
    });
  }
});

// ── Stripe: create Checkout Session ──────────────────────────────────────────
exports.createCheckoutSession = onCall(async (request) => {
  const { priceId, userId } = request.data;
  if (!priceId || !userId) throw new Error('priceId and userId are required');

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  const userData = userSnap.data() || {};

  let stripeCustomerId = userData.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userData.email || '',
      metadata: { firebaseUserId: userId },
    });
    stripeCustomerId = customer.id;
    await userRef.set({ stripeCustomerId }, { merge: true });
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    subscription_data: { trial_period_days: 14 },
    success_url: 'https://oftheday.net/dashboard?upgraded=true',
    cancel_url: 'https://oftheday.net/upgrade',
  });

  return { url: session.url };
});

// ── Stripe: webhook handler ───────────────────────────────────────────────────
exports.stripeWebhook = onRequest(async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured — rejecting webhook');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = admin.firestore();

  const userByCustomer = async (customerId) => {
    const snap = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
    return snap.empty ? null : snap.docs[0].ref;
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const ref = await userByCustomer(session.customer);
        if (ref) {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await ref.set({
            tier: 'pro',
            subscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            currentPeriodEnd: sub.current_period_end,
          }, { merge: true });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const ref = await userByCustomer(sub.customer);
        if (ref) {
          await ref.set({
            tier: sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free',
            currentPeriodEnd: sub.current_period_end,
          }, { merge: true });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const ref = await userByCustomer(sub.customer);
        if (ref) await ref.set({ tier: 'free' }, { merge: true });
        break;
      }
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: err.message });
  }
});
