import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://playerdriven.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { token } = req.query || {};
  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    const secret = process.env.DOWNLOAD_TOKEN_SECRET;
    const decoded = jwt.verify(token, secret);

    const email = decoded.email;
    const hasAddon = !!decoded.hasAddon;

    // TODO: Replace these with real Blob/S3 URLs
    const baseFiles = [
      { label: "Slide Deck 1", url: "https://example.com/slide1.pdf" },
      { label: "Slide Deck 2", url: "https://example.com/slide2.pdf" },
      { label: "Slide Deck 3", url: "https://example.com/slide3.pdf" },
      { label: "Slide Deck 4", url: "https://example.com/slide4.pdf" },

      { label: "Worksheet 1", url: "https://example.com/ws1.pdf" },
      { label: "Worksheet 2", url: "https://example.com/ws2.pdf" },
      { label: "Worksheet 3", url: "https://example.com/ws3.pdf" },
      { label: "Worksheet 4", url: "https://example.com/ws4.pdf" },

      { label: "Video Lessons (ZIP)", url: "https://example.com/video-lessons.zip" }
    ];

    const addonFiles = hasAddon
      ? [
          {
            label: "Short Form Video Pack",
            url: "https://example.com/short-form.zip"
          }
        ]
      : [];

    return res.status(200).json({
      ok: true,
      email,
      hasAddon,
      baseFiles,
      addonFiles
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
