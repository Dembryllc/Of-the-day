// env: 2026-06-20
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const functionsV1 = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();

// ── Lesson Slide AI ───────────────────────────────────────────────────────────
// Requires ANTHROPIC_API_KEY in functions/.env

const SLIDE_SYSTEM_PROMPT = `You are an assistant that helps K-12 teachers create structured lesson display slides.
Return ONLY valid JSON. No preamble, explanation, or markdown. No code fences.

Grade band language registers:
- K-2: Very simple sentences. Max 8 words per line. Use "We will" or "I can" with everyday words.
- 3-5: Clear direct sentences. Academic vocabulary introduced but accessible. Max 12 words per line.
- 6-8: Standard academic language appropriate for middle school. Max 15 words per line.
- 9-12: Formal academic language appropriate for high school. Max 15 words per line.

HARD character limits — never exceed these:
- lessonName: 60 characters
- learningTarget: 120 characters
- Each outcome: 60 characters (include 2-3 outcomes)
- Each expectation: 60 characters (include 2-3 expectations)
- Each step: 60 characters (include 3-6 steps)

Return exactly this JSON structure:
{"lessonName":"string","learningTarget":"string","outcomes":["string","string"],"expectations":["string","string","string"],"steps":["string","string","string","string"]}

For expectations: positive behavioral language only (what TO do, not what not to do).
For learning targets: always "I can..." or "We will..." format.
For steps: imperative verbs, short and scannable. Teachers read these aloud.

EXAMPLE — Grade 3-5, Math, Adding fractions with like denominators:
{"lessonName":"Adding Fractions","learningTarget":"I can add fractions with the same denominator.","outcomes":["I can write the sum of two fractions.","I can explain why the denominator stays the same."],"expectations":["Show your thinking on your whiteboard.","Raise your hand to share ideas.","Use math vocabulary when you explain."],"steps":["Review: what does a denominator tell us?","Watch: adding fraction strips together.","Try it: solve 3 problems with a partner.","Share: explain one solution to the class."]}

EXAMPLE — Grade K-2, ELA, Letter sounds:
{"lessonName":"Letter Sounds","learningTarget":"I can match letters to their sounds.","outcomes":["I can say the sound a letter makes.","I can find words that start with it."],"expectations":["Sit with legs crossed and hands in lap.","Raise your hand when you know the answer.","Listen when a friend is talking."],"steps":["Sing our alphabet song together.","Look at today's special letter.","Say the sound three times with me.","Find things in the room that start with it."]}`;

const SIMPLIFY_SYSTEM_PROMPT = `Rewrite learning targets and outcomes using simpler words for the given grade level. Same meaning, simpler language. Return ONLY valid JSON with no preamble: {"learningTarget":"string","outcomes":["string"]}. Hard limits: learningTarget 120 chars, each outcome 60 chars.`;

// ── Email helpers ─────────────────────────────────────────────────────────────
// Requires MAILGUN_API_KEY and MAILGUN_DOMAIN in functions/.env
// MAILGUN_DOMAIN: your verified sending domain, e.g. mg.oftheday.net or oftheday.net
const EMAIL_FROM = 'OfTheDay <hello@oftheday.net>';
const APP_URL = 'https://oftheday.net';

function getMailgun() {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!key || !domain) return null;
  const Mailgun = require('mailgun.js');
  const FormData = require('form-data');
  const mg = new Mailgun(FormData);
  return { client: mg.client({ username: 'api', key }), domain };
}

async function sendEmail({ to, subject, html }) {
  const mg = getMailgun();
  if (!mg) return false;
  await mg.client.messages.create(mg.domain, {
    from: EMAIL_FROM,
    to: [to],
    subject,
    html,
  });
  return true;
}

function emailBase(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OfTheDay</title></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">
  <tr><td style="background:#1B2D5B;padding:24px 32px;">
    <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">of<span style="color:#F5A623;">·</span>the<span style="color:#F5A623;">·</span>day</span>
  </td></tr>
  <tr><td style="padding:32px;">
    ${bodyContent}
  </td></tr>
  <tr><td style="background:#F3F4F6;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9CA3AF;">
      OfTheDay.net · Built for teachers ·
      <a href="${APP_URL}" style="color:#4DB896;text-decoration:none;">Open the app</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function welcomeEmailHtml(name) {
  const first = name ? name.split(' ')[0] : 'Teacher';
  return emailBase(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1B2D5B;">Welcome, ${first}! 👋</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Your morning meeting is already built. Open OfTheDay any morning and you'll find a complete,
      grade-appropriate Greeting, Sharing, Group Activity, and Morning Message — ready in seconds.
    </p>
    <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#1B2D5B;text-transform:uppercase;letter-spacing:0.05em;">Three things to try first</h3>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;width:100%;">
      <tr><td style="padding:10px 12px;background:#F0FDF4;border-radius:8px;margin-bottom:8px;">
        <span style="font-size:16px;">1.</span>
        <strong style="color:#1B2D5B;margin-left:6px;">Set your grade level</strong>
        <span style="display:block;font-size:13px;color:#6B7280;margin-left:22px;">Activities, vocabulary, and Do Now problems auto-adjust.</span>
      </td></tr>
      <tr><td style="height:6px;"></td></tr>
      <tr><td style="padding:10px 12px;background:#F0FDF4;border-radius:8px;">
        <span style="font-size:16px;">2.</span>
        <strong style="color:#1B2D5B;margin-left:6px;">Hit "Project Today"</strong>
        <span style="display:block;font-size:13px;color:#6B7280;margin-left:22px;">Opens a full-screen view for your smartboard or projector.</span>
      </td></tr>
      <tr><td style="height:6px;"></td></tr>
      <tr><td style="padding:10px 12px;background:#F0FDF4;border-radius:8px;">
        <span style="font-size:16px;">3.</span>
        <strong style="color:#1B2D5B;margin-left:6px;">Check the Library</strong>
        <span style="display:block;font-size:13px;color:#6B7280;margin-left:22px;">Browse Do Nows, Word of the Day, On This Day history, and 60+ activities.</span>
      </td></tr>
    </table>
    <a href="${APP_URL}/dashboard" style="display:inline-block;background:#F5A623;color:#1B2D5B;font-size:15px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;">Open Today's Meeting →</a>
    <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;">
      Questions? Reply to this email or reach us at <a href="mailto:hello@oftheday.net" style="color:#4DB896;">hello@oftheday.net</a>.
    </p>
  `);
}

const RESOURCE_PACK_ACTIVITIES = [
  { cat: 'Greeting', title: 'Name + Gesture Greeting', desc: 'Each student says their name and invents a unique gesture. The class mirrors it back.' },
  { cat: 'Greeting', title: 'Partner Greeting Remix', desc: 'Greet a partner by name, then add one kind sentence or question before switching.' },
  { cat: 'Sharing', title: 'Weekend Highlight Share', desc: 'Share one moment from the weekend using the sentence starter: "One thing I did was…"' },
  { cat: 'Sharing', title: 'Two Truths and a Wish', desc: 'Share two true things about yourself and one thing you wish were true. Class guesses the wish.' },
  { cat: 'Group Activity', title: 'Commonality Circle', desc: 'Find one thing all students in a small group have in common. Groups share with the class.' },
  { cat: 'Group Activity', title: 'Collaborative Counting', desc: 'The class counts to 20 together — but no two people can speak at the same time. Start over on overlap.' },
  { cat: 'Morning Message', title: 'Riddle of the Day', desc: 'Display a grade-appropriate riddle. Students think quietly, then share guesses.' },
  { cat: 'Morning Message', title: 'Connection Question', desc: 'Post a question on the board. Students write a one-sentence answer before the meeting begins.' },
  { cat: 'SEL Prompt', title: 'Emoji Check-In', desc: 'Each student chooses an emoji that matches their energy this morning and briefly explains why.' },
  { cat: 'Brain Teaser', title: 'What Comes Next?', desc: 'Show a visual or number pattern. Students identify the rule and predict what comes next.' },
];

function resourcePackHtml(email) {
  const rows = RESOURCE_PACK_ACTIVITIES.map(a => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
        <span style="font-size:11px;font-weight:700;color:#4DB896;text-transform:uppercase;letter-spacing:0.06em;">${a.cat}</span>
        <strong style="display:block;font-size:14px;color:#1B2D5B;margin:2px 0;">${a.title}</strong>
        <span style="font-size:13px;color:#6B7280;line-height:1.5;">${a.desc}</span>
      </td>
    </tr>`).join('');

  return emailBase(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1B2D5B;">Your Morning Meeting Resource Pack 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Here are 10 ready-to-use activities — copy them straight into your morning meeting or
      <a href="${APP_URL}/login?signup=1" style="color:#4DB896;font-weight:600;">create a free account</a>
      to get a new complete routine every day.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${rows}
    </table>
    <a href="${APP_URL}/login?signup=1" style="display:inline-block;background:#F5A623;color:#1B2D5B;font-size:15px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;">Get Your Daily Routine Free →</a>
    <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;">
      You're receiving this because you signed up at oftheday.net with ${email}.
      <a href="mailto:hello@oftheday.net?subject=Unsubscribe" style="color:#9CA3AF;">Unsubscribe</a>
    </p>
  `);
}

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
  const heavy = /(killed|murder|assassinat|execut|massacre|bomb|attack|terror|warplane|invasion|ambush|battle|siege|kidnap|hostage|genocide|disaster|crash|pandemic|plague|slavery|nazi|hitler|atomic bomb|shooting|dead|death|died|conquer|condemned|heretic)/;
  const tooPolitical = /(coup|dictator|troops|military|missile|nuclear accident|trial|sentenced|prison|riot|monastic|papal|treaty of|kingdom of|empire|pope|emperor|scripture|shrine)/;
  return !heavy.test(value) && !tooPolitical.test(value);
}

function isClassroomUseful(description = "", category = "History", year = "") {
  const value = description.toLowerCase();
  const useful = /(space|nasa|moon|mars|planet|telescope|invent|patent|computer|web|internet|telephone|book|author|music|art|artist|museum|baseball|basketball|soccer|olympic|scientist|animal|earth|ocean|national park|president|constitution|rights|school|first woman|first black|born)/;
  const numericYear = Number(year);
  if (!useful.test(value)) return false;
  if ((category === "History" || category === "Civics") && numericYear && numericYear < 1800 && !/book|artist|scientist|invent|telescope|planet|music/.test(value)) {
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
    .replace(/was sworn into office/gi, "began serving")
    .replace(/succeeded/gi, "became")
    .replace(/patented/gi, "received a patent for")
    .replace(/debuts?/gi, "first appeared")
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
      if (!/^born/i.test(description)) description = "Born: " + description;
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

  if (!user.email) return;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Your morning meeting is ready 🌅',
      html: welcomeEmailHtml(user.displayName || ''),
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
});

exports.sendLeadMagnet = onCall(async (request) => {
  const email = (request.data?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error('Valid email required');

  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.warn('MAILGUN_API_KEY or MAILGUN_DOMAIN not set — skipping lead magnet email');
    return { sent: false };
  }

  try {
    await sendEmail({
      to: email,
      subject: 'Your Morning Meeting Resource Pack is here 🎉',
      html: resourcePackHtml(email),
    });
    return { sent: true };
  } catch (err) {
    console.error('Failed to send lead magnet email:', err);
    return { sent: false };
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

// ── Lesson Slide: AI generation ───────────────────────────────────────────────
exports.generateLessonSlide = onCall(async (request) => {
  try {
    const { subject, grade, topic, preserveLanguage } = request.data || {};
    if (!subject || !grade || !topic) throw new HttpsError('invalid-argument', 'subject, grade, and topic are required');
    if (!process.env.ANTHROPIC_API_KEY) throw new HttpsError('failed-precondition', 'ANTHROPIC_API_KEY not configured');

    let userMsg = `Subject: ${String(subject).slice(0, 60)}
Grade: ${String(grade).slice(0, 10)}
Topic: ${String(topic).slice(0, 200)}`;
    if (preserveLanguage?.trim()) {
      userMsg += `\nPreserve this specific language if relevant: "${String(preserveLanguage).slice(0, 100)}"`;
    }

    const run = async () => {
      const Anthropic = require('@anthropic-ai/sdk');
      const AnthropicClient = Anthropic.default ?? Anthropic;
      const client = new AnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY });
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: SLIDE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMsg }],
      });
      const raw = (resp.content[0]?.text || '').trim();
      const parsed = JSON.parse(raw);
      if (!parsed.learningTarget || !Array.isArray(parsed.outcomes) || !Array.isArray(parsed.steps)) {
        throw new Error('Invalid structure');
      }
      return parsed;
    };

    try { return await run(); } catch {
      try { return await run(); } catch {
        throw new HttpsError('unavailable', 'fill in manually');
      }
    }
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error('generateLessonSlide unhandled:', err?.message, err?.stack);
    throw new HttpsError('internal', `[debug] ${err?.message || 'unknown'}`);
  }
});

// ── Lesson Slide: simplify language ──────────────────────────────────────────
exports.simplifyLessonSlide = onCall(async (request) => {
  const { grade, learningTarget, outcomes } = request.data || {};
  if (!grade || !learningTarget) throw new HttpsError('invalid-argument', 'grade and learningTarget are required');
  if (!process.env.ANTHROPIC_API_KEY) throw new HttpsError('failed-precondition', 'ANTHROPIC_API_KEY not configured');

  const run = async () => {
    const Anthropic = require('@anthropic-ai/sdk');
    const AnthropicClient = Anthropic.default ?? Anthropic;
    const client = new AnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY });
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SIMPLIFY_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Grade: ${grade}
Learning target: ${learningTarget}
Outcomes: ${(outcomes || []).join(' | ')}`,
      }],
    });
    const raw = (resp.content[0]?.text || '').trim();
    return JSON.parse(raw);
  };

  try { return await run(); } catch {
    throw new HttpsError('unavailable', 'simplify unavailable');
  }
});
