import fetch from "node-fetch";
import { onRequest } from "firebase-functions/v2/https";

export const safeBrowsingCheck = onRequest(async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });

  const apiKey = process.env.SAFEBROWSING_KEY;
  const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  const body = {
    client: { clientId: "phishblock", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const data = await resp.json();
    if (data && data.matches) {
      res.json({ safe: false, matches: data.matches });
    } else {
      res.json({ safe: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
