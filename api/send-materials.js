import jwt from "jsonwebtoken";

// Helper: generate signed token valid for 24 hours
function createDownloadToken({ email, hasAddon }) {
  const expiresInSeconds = 24 * 60 * 60; // 24 hours

  const payload = {
    email,
    hasAddon: !!hasAddon,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };

  const secret = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!secret) {
    throw new Error("DOWNLOAD_TOKEN_SECRET missing");
  }

  return jwt.sign(payload, secret);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://playerdriven.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { email, hasAddon } = req.body || {};
  if (!email) return res.status(400).json({ error: "Missing email" });

  try {
    const token = createDownloadToken({ email, hasAddon });

    const site = process.env.SITE_BASE_URL || "https://playerdriven.io";
    const downloadUrl = `${site.replace(/\/$/, "")}/download?token=${encodeURIComponent(token)}`;

    const loopsApiKey = process.env.LOOPS_API_KEY;
    const transactionalId = process.env.LOOPS_TRANSACTIONAL_ID;

    if (!loopsApiKey || !transactionalId) {
      throw new Error("Loops credentials missing");
    }

    // Send transactional email via Loops
    const loopsRes = await fetch("https://app.loops.so/api/v1/transactional", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${loopsApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        transactionalId,
        addToAudience: true,
        dataVariables: {
          downloadUrl,
          hasAddon: hasAddon ? "true" : "false"
        }
      })
    });

    const loopsJson = await loopsRes.json().catch(() => ({}));

    if (!loopsRes.ok || loopsJson.success === false) {
      console.error("Loops error:", loopsJson);
      return res.status(500).json({ error: "Failed to send email" });
    }

    return res.status(200).json({
      ok: true,
      token,
      downloadUrl
    });
  } catch (err) {
    console.error("send-materials error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
