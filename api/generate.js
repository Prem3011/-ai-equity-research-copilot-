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

  const prompt = `You are a senior equity research analyst at Goldman Sachs known for BALANCED, UNBIASED analysis. Generate a detailed equity research brief for: ${ticker}.

CRITICAL RULES FOR AVOIDING BIAS:
- Give EQUAL depth to positive AND negative factors
- Do NOT default to Bullish — assign Bearish or Neutral when the evidence supports it
- Every bullish claim MUST be paired with a specific counter-argument
- Use CONCRETE numbers for both upside AND downside scenarios
- If the stock is overvalued by standard metrics, SAY SO clearly

Search for the LATEST available data — current stock price, most recent quarterly earnings, latest news. Use today's date as reference.

Use INR (₹) for Indian stocks (NSE/BSE). Use USD ($) for US stocks.

Use EXACTLY these ## markdown headers in this order:

## Company Overview
3-4 sentences: business, CEO, HQ, employees, segments, market position. Use current data.

## Sentiment Score
On the FIRST line, write ONLY a number from 1-10 (where 1=extremely bearish, 5=neutral, 10=extremely bullish).
On the second line, write one sentence explaining the score.
Be honest — most stocks should score 4-7, not 8-10.

## Key Financial Metrics
Use the MOST RECENT data:
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
5 bullet points of the MOST RECENT news (within last 1-3 months). Each must start with **[Date]:** followed by headline and 1 sentence of context. Search for the latest news.

## Recent Catalysts & Developments
4 bullets starting with **[Date/Quarter]:** then 2 sentences with numbers.

## Risk Factors
4 bullets starting with **[Risk Title]:** then 2 sentences specific to this company's CURRENT situation. Be specific and unflinching.

## Bull Case vs Bear Case
**Bull Case:** 3 sentences with specific numbers and growth targets.
**Bear Case:** 3 sentences with specific downside risks and numbers. Give this EQUAL weight to bull case.

## Contrarian View
Write 3-4 sentences arguing AGAINST the consensus view on this stock. If most analysts are bullish, argue bearish and vice versa. Include specific data points. This section must genuinely challenge the prevailing narrative.

## Confidence Assessment
- **Data Freshness**: [High/Medium/Low — how recent is the data used]
- **Analyst Consensus Alignment**: [Agrees/Partially Agrees/Disagrees with consensus]
- **Confidence Level**: [High/Medium/Low — how confident in this analysis]
- **Key Uncertainty**: [One sentence on the biggest unknown]

## Competitive Landscape
3 bullets: **[Competitor]**: 1-2 sentences.
Then: **Competitive Moat:** 2 sentences.

## Executive Summary
Write EXACTLY 2 sentences that capture the entire investment thesis. This should be quotable — imagine a portfolio manager reading just this section. End with: **Outlook: Bullish** or **Outlook: Neutral** or **Outlook: Bearish**

## Investment Thesis
4-5 sentences reflecting CURRENT market conditions. Reference specific metrics. End with EXACTLY: **Outlook: Bullish** or **Outlook: Neutral** or **Outlook: Bearish**`;

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
