const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, mediaType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });

  const systemPrompt = `You are an expert aquatic entomologist and fly fishing guide.
The user has photographed an insect near or on the water. Identify it and recommend fly patterns.

Respond in this exact JSON format:
{
  "insect": "Common name (Scientific name)",
  "stage": "adult|nymph|emerger|larva",
  "confidence": "high|medium|low",
  "patterns": ["Pattern Name 1", "Pattern Name 2", "Pattern Name 3"],
  "sizes": "#16-18",
  "notes": "One sentence about presentation or timing."
}

If the image does not show an insect or aquatic invertebrate, respond with:
{ "error": "No aquatic insect detected in this image." }`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageBase64
              }
            },
            { type: "text", text: "What insect is this and what fly patterns should I use?" }
          ]
        }
      ]
    });

    const text = message.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(200).json({ error: "Could not parse response" });

    res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Photo match API error:", err);
    res.status(500).json({ error: err.message || "Failed to identify insect" });
  }
};
