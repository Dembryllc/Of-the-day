const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
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
  if (/space|nasa|planet|moon|mars|rocket|scientist|physics|chemistry|biology|medicine|vaccine|dna|telescope|discovered|invented/.test(value)) return "Science";
  if (/computer|internet|web|software|technology|telephone|radio|television|patent/.test(value)) return "Technology";
  if (/music|film|movie|book|novel|art|museum|theater|opera|album/.test(value)) return "Arts & Culture";
  if (/olympic|baseball|basketball|football|soccer|tennis|championship|world cup/.test(value)) return "Sports";
  if (/court|constitution|election|congress|law|treaty|president|rights|independence/.test(value)) return "Civics";
  return fallback;
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
    if (description.length < 18) continue;

    let category = "History";
    if (type === "birthdays") {
      category = "Famous People";
      if (!/^born\b/i.test(description)) description = "Born: " + description;
    } else if (type === "deaths") {
      category = "Famous People";
      if (!/^died\b/i.test(description)) description = "Died: " + description;
    } else {
      category = categorize(description, "History");
    }

    const key = year + "|" + description.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ year, title: description, category });
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
  const order = ["Science", "Famous People", "Technology", "Arts & Culture", "Civics", "Sports", "History"];
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
    if (picked.length >= 12) break;
    if (!seen.has(key)) {
      picked.push(item);
      seen.add(key);
    }
  }

  return picked;
}

exports.handler = async () => {
  const now = new Date();
  const month = MONTHS[now.getUTCMonth()];
  const day = now.getUTCDate();
  const base = "https://www.onthisday.com";
  const sourceUrl = `${base}/events/${month}/${day}`;

  try {
    const [events, birthdays, deaths] = await Promise.allSettled([
      fetchPage(`${base}/events/${month}/${day}`, "events", 12),
      fetchPage(`${base}/birthdays/${month}/${day}`, "birthdays", 8),
      fetchPage(`${base}/deaths/${month}/${day}`, "deaths", 4)
    ]);

    const combined = [
      ...(events.status === "fulfilled" ? events.value : []),
      ...(birthdays.status === "fulfilled" ? birthdays.value : []),
      ...(deaths.status === "fulfilled" ? deaths.value : [])
    ];
    const items = prioritize(combined);

    if (!items.length) throw new Error("No OnThisDay items parsed");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=21600"
      },
      body: JSON.stringify({
        date: now.toISOString(),
        source: "OnThisDay.com",
        sourceUrl,
        events: items
      })
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=900"
      },
      body: JSON.stringify({
        date: now.toISOString(),
        source: "Built-in fallback",
        sourceUrl,
        events: [],
        warning: error.message
      })
    };
  }
};
