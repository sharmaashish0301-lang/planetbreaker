# PLANETBREAKER — MASTER CONTEXT DOCUMENT
# Last Updated: July 13, 2026
# READ THIS FIRST BEFORE DOING ANYTHING

---

## WHAT IS PLANETBREAKER
A fully automated global news website at planetbreaker.com
Target: Global audience (India, US, UK, Europe, China, HK, Korea, Japan, Australia)
Categories: World News, Finance, Sports, Auto, Entertainment
Vision: "The site that tells you what just happened in markets or news that actually matters — globally, in real time"
Style: LiveHindustan energy (catchy, number-heavy headlines) but in English + Hindi
Revenue: Google AdSense (pending approval) + ₹29/month article save subscription

---

## OWNER
Name: Gajendra (Ashish Sharma on GitHub)
Technical level: ZERO — guide every step, never assume knowledge
Communication: Direct, no hedging, no repeating questions already answered
GitHub: sharmaashish0301... (exact handle visible in screenshots)

---

## TECH STACK (LOCKED — DO NOT CHANGE)
- Domain: planetbreaker.com (bought on BigRock.in ~₹780)
- Hosting: Vercel (free tier, hobby plan)
- Repository: GitHub repo named "planetbreaker"
- Database: Supabase (project ID: zjcwvnvnhyjjaoltybvj)
- News Source: The Guardian API (key in Vercel env vars as GUARDIAN_KEY)
- Article Writer: Gemini 3.1 Flash Lite (key in Vercel env vars as GEMINI_KEY)
- Market Data: Alpha Vantage (key: IV2QBLBJGROWAYPM)
- Supabase Publishable Key: sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV
- Supabase URL: https://zjcwvnvnhyjjaoltybvj.supabase.co

## IMPORTANT — REMOVED APIs
- NewsAPI: REMOVED — development only, commercial use forbidden, 100 req/day limit
- GDELT: REMOVED — blocked by Vercel network (domain not in allowlist)
- Gemini 1.5 Flash: SHUT DOWN June 1, 2026
- Gemini 2.0 Flash: SHUT DOWN June 1, 2026
- Gemini 3.5 Flash: AVOID — uses thinking tokens, consumes output budget
- Gemini 2.5 Flash Lite: NOT AVAILABLE to new users

## WORKING GEMINI MODEL
- Model: gemini-3.1-flash-lite
- Auth: x-goog-api-key header (NOT ?key= query param)
- Free tier: 15 RPM, 1,000 RPD
- No thinking tokens — produces 3,000-4,000 character articles
- Finish reason: STOP (not MAX_TOKENS)

---

## FILES IN GITHUB REPO (CURRENT STATE)
```
index.html          → Homepage (live, real news, full articles working)
article.html        → Article detail page (working, clicks open full articles)
package.json        → type: module (required for ES modules on Vercel)
vercel.json         → maxDuration: 60 for api/news.js
api/
  news.js           → Guardian API + Gemini 3.1 Flash Lite article writer
  markets.js        → Alpha Vantage market data
  articles.js       → Fast Supabase-only endpoint (instant load)
```

---

## DATABASE TABLES (SUPABASE)
1. articles — id(int8,PK,identity), title, content, category, region, source,
               source_url, image_url, published_at, read_count, is_breaking
2. saved_articles — id(int8,PK,identity), user_email, article_id, saved_at
3. subscribers — id(int8,PK,identity), email, region, subscribed_at, is_active

---

## DESIGN DECISIONS (LOCKED — DO NOT CHANGE)
- Background: Warm ivory #FAF7F2
- Primary accent: Crimson #C0392B
- Text: Charcoal #1A1A2E
- Font: Playfair Display (headlines) + Inter (body)
- Logo: "PlanetBreaker" — Playfair Display, charcoal, NO hammer, NO split colors
- NO images on article cards (by design decision)
- Bookmark icon: 🔖 on every card with event.stopPropagation()
- Dual ticker: Row 1 = all categories mixed, Row 2 = biggest breaking story
- Market strip: scrolling indices + currencies + commodities
- Hero: dynamic, shows biggest story regardless of category
- Four category cards: World, Finance, Sports, Entertainment
- Region detection: automatic via IP (ipapi.co)
- Article cards: data-article-id attribute, event delegation for clicks
- Loading: skeleton cards shown until API responds (instant via /api/articles)

---

## PRICING MODEL (LOCKED)
- Free: 10 articles/month
- PlanetBreaker Pass: ₹29/month = save up to 31 articles
- Pro plan (₹99/month) — PARKED, not live yet

---

## WHAT IS WORKING RIGHT NOW
✅ planetbreaker.com live globally
✅ Mobile responsive (basic)
✅ Guardian API fetching real news (5 sections: world, business, sport, film, technology)
✅ Gemini 3.1 Flash Lite writing 3,000-4,000 character full articles
✅ Articles storing in Supabase with proper id field
✅ Deduplication working
✅ Hero updates with real breaking news
✅ Article cards clickable → opens article.html
✅ Full article content showing on article page (600-700 words)
✅ Share buttons (WhatsApp, Twitter, Telegram, Copy link)
✅ Source credit + link to original
✅ Related articles sidebar
✅ Trending sidebar
✅ Fast loading via /api/articles (Supabase only, instant)
✅ Auto refresh every 5 minutes
✅ Bookmark button (frontend only)
✅ Category cards showing correct categories

---

## WHAT IS BROKEN / NOT WORKING
❌ Category pill clicks (Sports, Auto tabs) — filter not built yet
❌ Category pages for SEO (agreed to build — /category.html?cat=sports)
❌ Bookmark not saving to Supabase (frontend only)
❌ Market prices not real-time for Indian indices (NIFTY, SENSEX)
❌ No Google Analytics yet
❌ No Google AdSense yet
❌ No Hindi translation yet
❌ Google Trends integration not built yet
❌ Auto section covers technology (not auto/cars) — Guardian doesn't have auto section
❌ fetched shows 0 after first run (correct — dedup working, but confusing)

---

## GUARDIAN API SECTIONS USED
world → category: world
business → category: finance
sport → category: sports
film → category: entertainment
technology → category: auto (NOTE: Guardian has no auto section — needs fix)

## GUARDIAN API ISSUE — AUTO CATEGORY
Guardian does not have an automobile/car section. Technology articles are being
saved as 'auto' category which is wrong. Next session: either use a different
source for auto news or add keyword-based auto detection before saving.

---

## DECISIONS ALREADY MADE (DO NOT RE-DISCUSS)
- Domain: PlanetBreaker.com ✓
- Single pricing plan only ₹29 ✓
- No images on cards ✓
- No hammer in logo ✓
- Separate article page not slide-in ✓
- Evening session default for MCX trading ✓
- Option B for homepage (all sections driven by trending) ✓ — TO BUILD
- Social media posts can be used as articles with embed + credit ✓
- Category pages as separate URLs for SEO ✓
- No new tabs when navigating ✓

---

## NEXT SESSION PRIORITIES (IN ORDER — DO NOT SKIP)
1. FIX auto category — Guardian technology ≠ auto news, find real auto source
2. BUILD category pill filter — clicking Sports filters news grid
3. BUILD category pages — /category.html?cat=sports for SEO
4. ADD Google Analytics (15 min setup)
5. FIX NIFTY/SENSEX live prices
6. IMPROVE mobile design
7. ADD Hindi translation layer
8. BUILD Google Trends integration → drives homepage content dynamically
9. APPLY for Google AdSense
10. CONNECT bookmark to Supabase backend

---

## GOOGLE TRENDS INTEGRATION PLAN (AGREED)
- Fetch Google Trends top 20 every hour (India + Global)
- Map trending topics to categories automatically
- Use trending terms as dynamic Guardian/news queries
- Drives ENTIRE homepage (Option B — all sections)
- Cost: Zero

---

## MCX TRADING STRATEGY (SEPARATE FROM WEBSITE)
Production configs locked:
- Silver Micro (5-min): 0.6% SL, 1.5 R:R, Evening Only, Square Off 23:05
- Crude Oil Micro (5-min): 0.5% SL, 1.75 R:R, Evening Only, Square Off 23:05
- Gold Ten (15-min): 1.0% SL, 1.5 R:R, Evening Only, Square Off 23:05
Strategy file: sperandeo_avwap_mcx_metals_v2.txt
Alert setup: TradingView alerts → Telegram webhook (pending)
Deployment doc: MCX_Metals_Strategy_Deployment_v1.docx

---

## HOW TO START EVERY SESSION
1. Read this document first
2. Check "WHAT IS BROKEN" section
3. Start with Priority #1 from Next Session list
4. Never ask questions already answered here
5. Never suggest options already rejected
6. Never re-discuss locked decisions
7. Guide Gajendra step by step — zero technical knowledge

---

## IMPORTANT RULES FOR CLAUDE
- Never lose track of big picture: automated global news site
- Always think revenue first (AdSense + subscriptions)
- Never suggest paid tools when free alternatives exist
- Keep trading system and website completely separate
- When stuck on technical problem: max 2 approaches then different solution
- Don't repeat same fix that already failed
- Check actual file content before suggesting changes — never assume
- Always update this document at end of each session

---
END OF MASTER CONTEXT DOCUMENT
