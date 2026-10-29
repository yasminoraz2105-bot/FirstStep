// FirstStep AI proxy: keeps the API key secret on the server
export default async (req) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method === "GET") return Response.json({ ok: Boolean(key) });
  if (req.method !== "POST" || !key) return new Response("AI not available", { status: 503 });
  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const prompt = String(body.prompt || "").slice(0, 12000);
  if (!prompt) return new Response("Bad request", { status: 400 });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return Response.json({ error: (j.error && j.error.message) || "AI error" }, { status: 502 });
  const text = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return Response.json({ text });
};
