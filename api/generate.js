export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { ticker, mode } = req.body;
  if (!ticker) return res.status(400).json({ error: "Ticker is required" });

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });

  const isCompare = mode === "compare";

  const prompt = isCompare ? `You are a senior equity research analyst. Generate a CONCISE equity research brief for: ${ticker}.

Search for the LATEST data. Use INR (₹) for Indian stocks, USD ($) for US stocks.

Use EXACTLY these ## headers:

## Company Overview
2 sentences: business, CEO, market position.

## Sentiment Score
First line: a number 1-10 only. Second line: one sentence explanation.

## Key Financial Metrics
- **Market Cap**: [current]
- **Stock Price**: [current]
- **P/E Ratio**: [current]
- **Revenue (Latest)**: [amount + period]
- **Net Profit Margin**: [%]
- **ROE**: [%]
- **EPS (TTM)**: [amount]
- **Dividend Yield**: [%]

## Latest News Headlines
3 bullets with **[Date]:** and 1 sentence each.

## Risk Factors
3 bullets with **[Title]:** and 1 sentence each.

## Bull Case vs Bear Case
**Bull Case:** 2 sentences. **Bear Case:** 2 sentences.

## Executive Summary
2 sentences. End with **Outlook: Bullish/Neutral/Bearish**` :

  `You are a senior equity research analyst at Goldman Sachs known for BALANCED, UNBIASED analysis. Generate a detailed equity research brief for: ${ticker}.

CRITICAL RULES FOR AVOIDING BIAS:
- Give EQUAL depth to positive AND negative factors
- Do NOT default to Bullish — assign Bearish or Neutral when evidence supports it
- Every bullish claim MUST be paired with a specific counter-argument
- Use CONCRETE numbers for both upside AND downside scenarios

Search for the LATEST available data — current stock price, most recent quarterly earnings, latest news.

Use INR (₹) for Indian stocks (NSE/BSE). Use USD ($) for US stocks.

Use EXACTLY these ## markdown headers in this order:

## Company Overview
3-4 sentences: business, CEO, HQ, employees, segments, market position.

## Sentiment Score
First line: ONLY a number 1-10 (1=extremely bearish, 5=neutral, 10=extremely bullish).
Second line: one sentence explaining the score.

## Key Financial Metrics
- **Market Cap**: [current]
- **Stock Price**: [current/latest]
- **P/E Ratio**: [current]
- **Revenue (Latest)**: [most recent quarter/year + period]
- **Net Profit Margin**: [%]
- **ROE**: [%]
- **Debt/Equity**: [ratio]
- **EPS (TTM)**: [amount]
- **Dividend Yield**: [% or N/A]

## Latest News Headlines
5 bullets: **[Date]:** headline + 1 sentence context. Most recent events only.

## Recent Catalysts & Developments
4 bullets: **[Date/Quarter]:** 2 sentences with numbers.

## Risk Factors
4 bullets: **[Risk Title]:** 2 sentences specific to this company.

## Bull Case vs Bear Case
**Bull Case:** 3 sentences with specific numbers.
**Bear Case:** 3 sentences with specific numbers. EQUAL weight.

## Contrarian View
3-4 sentences arguing AGAINST the consensus. Include specific data points.

## Confidence Assessment
- **Data Freshness**: [High/Medium/Low]
- **Analyst Consensus Alignment**: [Agrees/Partially Agrees/Disagrees]
- **Confidence Level**: [High/Medium/Low]
- **Key Uncertainty**: [one sentence]

## Competitive Landscape
3 bullets: **[Competitor]**: 1-2 sentences.
**Competitive Moat:** 2 sentences.

## Executive Summary
2 quotable sentences. End with: **Outlook: Bullish/Neutral/Bearish**

## Investment Thesis
4-5 sentences. End with: **Outlook: Bullish/Neutral/Bearish**`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { maxOutputTokens: 5000, temperature: 1.0 },
        }),
      }
    );

    const data = await response.json();

    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      .map(p => p.text)
      .join("\n") || "";

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
