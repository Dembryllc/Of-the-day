const crypto = require("node:crypto");

const STORE_NAME = "ofd-user-data";
const MAX_BODY_BYTES = 750_000;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function cleanEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function userKey(email, syncKey) {
  return "users/" + crypto
    .createHash("sha256")
    .update(`${cleanEmail(email)}:${syncKey}`)
    .digest("hex") + ".json";
}

function getCredentials(event) {
  const email = cleanEmail(event.headers["x-ofd-email"] || event.headers["X-OFD-Email"]);
  const syncKey = String(event.headers["x-ofd-sync-key"] || event.headers["X-OFD-Sync-Key"] || "").trim();
  if (!email || !syncKey || syncKey.length < 24) return null;
  return { email, syncKey };
}

exports.handler = async event => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

  const credentials = getCredentials(event);
  if (!credentials) {
    return json(401, { error: "Missing cloud sync credentials." });
  }

  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore(STORE_NAME);
    const key = userKey(credentials.email, credentials.syncKey);

    if (event.httpMethod === "GET") {
      const data = await store.get(key, { type: "json", consistency: "strong" });
      return json(200, { ok: true, data: data || null });
    }

    if (event.httpMethod === "PUT") {
      const raw = event.body || "";
      if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
        return json(413, { error: "Cloud sync payload is too large." });
      }

      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || typeof parsed !== "object") {
        return json(400, { error: "Unsupported cloud sync payload." });
      }

      const payload = {
        ...parsed,
        email: credentials.email,
        savedAt: new Date().toISOString()
      };
      await store.setJSON(key, payload, {
        metadata: { email: credentials.email, version: String(parsed.version) }
      });
      return json(200, { ok: true, savedAt: payload.savedAt });
    }

    return json(405, { error: "Method not allowed." });
  } catch (error) {
    return json(500, { error: error.message || "Cloud sync failed." });
  }
};
