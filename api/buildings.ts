import type { VercelRequest, VercelResponse } from "@vercel/node";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({
      error: "Method not allowed",
    });

  try {
    const response = await fetch(OVERPASS_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: req.body,
    });

    if (!response.ok)
      return res.status(response.status).json({
        error: `Overpass request failed: ${response.status} ${response.statusText}`,
      });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to fetch building data",
    });
  }
}
