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
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEvents(html) {
  const events = [];
  const itemPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = itemPattern.exec(html)) && events.length < 8) {
    const text = stripHtml(match[1]);
    const eventMatch = text.match(/^(\d{3,4}|[1-9]\d?)\s+(.{24,})$/);
    if (!eventMatch) continue;

    const year = eventMatch[1];
    const description = eventMatch[2]
      .replace(/\s+more$/i, "")
      .replace(/\s+»$/i, "")
      .trim();

    if (description.length < 24 || /^(birth|death|wedding)s?\b/i.test(description)) continue;
    events.push({ year, title: description, category: "History" });
  }

  return events;
}

exports.handler = async () => {
  const now = new Date();
  const month = MONTHS[now.getUTCMonth()];
  const day = now.getUTCDate();
  const sourceUrl = `https://www.onthisday.com/events/${month}/${day}`;

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "OfTheDay classroom app (educational daily history feature)",
        "Accept": "text/html"
      }
    });

    if (!response.ok) throw new Error(`OnThisDay returned ${response.status}`);

    const html = await response.text();
    const events = parseEvents(html);

    if (!events.length) throw new Error("No events parsed");

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
        events
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
