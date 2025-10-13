"use server";

import { getDateRange, validateArticle, formatArticle } from "@/lib/utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1" as const;
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

if (!NEXT_PUBLIC_FINNHUB_API_KEY && process.env.NODE_ENV !== "test") {
  console.warn("NEXT_PUBLIC_FINNHUB_API_KEY is not set. Finnhub requests will fail.");
}

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { method: "GET", headers, cache: "force-cache", next: { revalidate: revalidateSeconds } }
    : { method: "GET", headers, cache: "no-store" };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url} ${text ? "- " + text : ""}`);
  }
  return res.json() as Promise<T>;
}

// Public function to get news, either by symbols (round-robin) or general market news
export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    // If we have symbols, do round-robin company news for the last 5 days
    if (symbols && symbols.length > 0) {
      const cleanSymbols = Array.from(
        new Set(
          symbols
            .map((s) => (s || "").trim().toUpperCase())
            .filter((s) => s.length > 0)
        )
      );

      if (cleanSymbols.length > 0) {
        const { from, to } = getDateRange(5);

        // Fetch news per symbol in parallel (cache for 5 minutes)
        const perSymbolNewsResults = await Promise.allSettled(
          cleanSymbols.map(async (sym) => {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
            const data = await fetchJSON<RawNewsArticle[]>(url, 300);
            return data.filter((a) => validateArticle(a));
          })
        );

        const perSymbolNews = perSymbolNewsResults.map((result, index) => {
          if (result.status === "fulfilled") return result.value;
         console.warn(`company-news fetch failed for ${cleanSymbols[index]}`, result.reason);
          return [];
        });

        // Round-robin pick up to 6 articles
        const picks: MarketNewsArticle[] = [];
        const indices = new Array(perSymbolNews.length).fill(0);
        let rounds = 0;
        while (picks.length < 6 && rounds < 6) {
          for (let i = 0; i < perSymbolNews.length && picks.length < 6; i++) {
            const list = perSymbolNews[i];
            let idx = indices[i];
            // Advance until a valid unseen article is found
            while (idx < list.length && !validateArticle(list[idx])) idx++;
            if (idx < list.length) {
              const article = list[idx]!;
              indices[i] = idx + 1;
              const formatted = formatArticle(article, true, cleanSymbols[i]!, picks.length);
              picks.push(formatted);
            }
          }
          rounds++;
          // Stop if all lists are exhausted
          if (perSymbolNews.every((list, i) => indices[i] >= list.length)) break;
        }

        if (picks.length > 0) {
          // Sort by datetime desc
          picks.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
          return picks.slice(0, 6);
        }
        // If no company news found, fall back to general
      }
    }

    // General market news fallback
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    // Deduplicate by id/url/headline
    const seen = new Set<string>();
    const unique: MarketNewsArticle[] = [];
    for (const [idx, a] of general.entries()) {
      if (!validateArticle(a)) continue;
      const sig = `${a.id || idx}|${a.url}|${(a.headline || "").trim()}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      unique.push(formatArticle(a, false, undefined, idx));
      if (unique.length >= 6) break;
    }

    return unique;
  } catch (err) {
    console.error("Failed to fetch news", err);
    throw new Error("Failed to fetch news");
  }
}

export { fetchJSON };