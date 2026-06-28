import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, conditions } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are an expert fly fishing guide with deep knowledge of aquatic entomology and fly tying.
The user is using an app called Hatch Matcher. Help them choose the right fly patterns based on their described conditions.
Keep responses concise — 2-4 sentences max. Lead with 1-3 specific pattern names in bold, then a brief why.
If they mention a location, species, or season, factor that in. Be practical and direct like a guide on the water.`;

  const userMessage = conditions
    ? `Current conditions logged: ${JSON.stringify(conditions)}\n\nUser says: ${prompt}`
    : prompt;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    });

    res.status(200).json({ answer: message.content[0].text });
  } catch (err) {
    console.error("Recommend API error:", err);
    res.status(500).json({ error: err.message || "Failed to get recommendation" });
  }
}
