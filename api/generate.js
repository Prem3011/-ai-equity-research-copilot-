export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { ticker } = req.body;
  if (!ticker) return res.status(400).json({ error: "Ticker is required" });

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });

  const prompt = `You are a senior equity research analyst at Goldman Sachs. Generate a detailed, data-rich equity research brief for: ${ticker}.

Use INR for Indian stocks (NSE/BSE). Use USD for US stocks. Be specific with real numbers. Write authoritatively. Do NOT mention data limitations.

Use EXACTLY these ## markdown headers:

## Company Overview
3-4 sentences: business, CEO, HQ, employees, segments, market position.

## Key Financial Metrics
Bullets with **Label**: Value format:
- **Market Cap**: [number]
- **Stock Price (Approx)**: [number]
- **P/E Ratio**: [number]
- **Revenue (Annual)**: [amount + year]
- **Net Profit Margin**: [%]
- **ROE**: [%]
- **Debt/Equity**: [ratio]
- **EPS**: [amount]
- **Dividend Yield**: [% or N/A]

## Recent Catalysts & Developments
4 bullets starting with **[Date/Quarter]:** then 2 sentences with numbers.

## Risk Factors
4 bullets starting with **[Risk Title]:** then 2 sentences specific to this company.

## Bull Case vs Bear Case
**Bull Case:** 3 sentences with specific numbers.
**Bear Case:** 3 sentences with specific numbers.

## Competitive Landscape
3 bullets: **[Competitor]**: 1-2 sentences.
Then: **Competitive Moat:** 2 sentences.

## Investment Thesis
4 sentences. End with exactly: **Outlook: Bullish** or **Outlook: Neutral** or **Outlook: Bearish**`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
        }),
      }
    );

    const data = await response.json();

    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
