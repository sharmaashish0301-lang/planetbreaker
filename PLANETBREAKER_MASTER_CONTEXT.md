# PLANETBREAKER — MASTER CONTEXT DOCUMENT
# Last Updated: July 13, 2026 — End of Session
# READ THIS FIRST BEFORE DOING ANYTHING

---

## WHAT IS PLANETBREAKER
Fully automated global news website at planetbreaker.com
Target: India, US, UK, Europe, China, HK, Korea, Japan, Australia
Categories: World, Finance, Sports, Auto, Entertainment
Vision: Real-time, trending, fact-rich articles — 150-200 unique articles/day
Revenue: Google AdSense (pending) + ₹29/month article save subscription

---

## OWNER
Name: Gajendra (GitHub: sharmaashish0301...)
Technical level: ZERO — guide every single step
Rule: Never lose track, never re-discuss locked decisions, never suggest paid tools

---

## TECH STACK (LOCKED)
- Domain: planetbreaker.com (BigRock.in)
- Hosting: Vercel free tier
- Repo: GitHub "planetbreaker"
- Database: Supabase (zjcwvnvnhyjjaoltybvj)
- News: Guardian API (GUARDIAN_KEY in Vercel env vars)
- Writer: Gemini 3.1-flash-lite (GEMINI_KEY in Vercel env vars)
- Auth: x-goog-api-key header (NOT ?key= param)
- Market Data: Alpha Vantage (IV2QBLBJGROWAYPM)
- Supabase URL: https://zjcwvnvnhyjjaoltybvj.supabase.co
- Supabase Key: sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV

---

## DEAD/REMOVED APIs — NEVER USE AGAIN
- NewsAPI: commercial forbidden, 100 req/day limit
- GDELT: blocked by Vercel network
- Gemini 1.5-flash: shut down June 2026
- Gemini 2.0-flash: shut down June 2026
- Gemini 3.5-flash: uses thinking tokens — eats output budget
- Gemini 2.5-flash-lite: not available to new users

---

## FILES IN GITHUB REPO
```
index.html          → Homepage (working)
article.html        → Article detail page (working)
category.html       → Category pages (working)
package.json        → type:module
vercel.json         → maxDuration:60 for api/news.js
api/
  news.js           → Guardian (14 sections) + Gemini 3.1-flash-lite
  articles.js       → Fast Supabase read (instant load)
  markets.js        → Alpha Vantage
```

---

## DATABASE TABLES
1. articles — id(int8,PK,identity), title, content, category, region,
              source, source_url, image_url, published_at, read_count, is_breaking
2. saved_articles — id(int8,PK,identity), user_email, article_id, saved_at
3. subscribers — id(int8,PK,identity), email, region, subscribed_at, is_active

---

## GUARDIAN SECTIONS CURRENTLY FETCHING (14 sections, 3 articles each = 42/run)
world, us-news, politics → world category
business, money → finance category
sport, football, cricket → sports category
film, music, media → entertainment category
technology, environment, science → world category

---

## GEMINI ARTICLE WRITING
- Model: gemini-3.1-flash-lite
- Auth: x-goog-api-key header
- Output: 3,000-4,000 characters per article
- Finish reason: STOP (working correctly)
- Prompt forces 6 sections: opening, background, details, global impact, reactions, what next

---

## DESIGN (LOCKED — DO NOT CHANGE)
- Background: #FAF7F2 warm ivory
- Accent: #C0392B crimson
- Font: Playfair Display (headlines) + Inter (body)
- Logo: PlanetBreaker — charcoal, no hammer, no split colors
- No images on static cards, images from Guardian API on dynamic cards
- Bookmark: 🔖 with event.stopPropagation()
- Article cards: data-article-id + event delegation for clicks
- Loading: skeleton cards → replaced by real articles instantly

---

## PRICING (LOCKED)
- Free: 10 articles/month
- PlanetBreaker Pass: ₹29/month = 31 article saves
- Pro plan: PARKED — do not add yet

---

## WHAT IS WORKING ✅
- planetbreaker.com live globally
- 39 articles per fetch run (up from 5)
- ~150-200 unique articles/day accumulating
- Guardian API fetching with thumbnails
- Gemini writing 3,000-4,000 char full articles
- Images saving to Supabase and displaying on cards
- Hero click → article page
- Live feed clicks → article page
- Trending clicks → article page
- Read Full Story button → article page
- Category cards (World/Finance/Sports/Entertainment) → correct articles
- Nav tabs → category.html pages
- Category pages working (/category.html?cat=sports etc)
- Fast loading via /api/articles
- Article page: full content, share buttons, related articles, read count
- Cricket section → World Cup + India cricket coverage
- Auto refresh every 5 minutes

---

## WHAT IS BROKEN ❌
- Category pill filter on homepage (Sports/Auto pills) — not filtering yet
- Homepage images sometimes not showing (height CSS issue)
- Bookmark not saving to Supabase (frontend only)
- Market prices not real-time (NIFTY, SENSEX static)
- No Google Analytics
- No Google AdSense
- No Hindi translation
- Auto category weak — no dedicated auto news source

---

## CONTENT ROADMAP (AGREED — DO NOT CHANGE)
Phase 1 ✅ DONE: Fix broken things + 42 articles per run
Phase 2 NEXT: Google Trends RSS (India+US+UK+AU+Global) + Gemini web search
  → 70-80 additional unique articles/day
  → Sports stats in articles (scores, wickets, goal scorers)
  → Trending topics drive content not just Guardian sections
Phase 3: Market intelligence
  → Volume spikes (Reliance, IBM etc — above 20-day avg)
  → 52W high/low detection
  → Circuit breaker alerts
  → Price movement articles with real data

Target: 150-200 unique articles/day, all regions, all trending

---

## NEXT SESSION — START HERE (IN ORDER)
1. Build Google Trends RSS integration (Phase 2)
   - Fetch trends for: India, US, UK, Australia, Global
   - Use as Gemini search queries
   - Gemini searches web + writes fact-rich articles with real stats
2. Fix category pill filtering on homepage
3. Fix homepage image display (height CSS)
4. Google Analytics setup
5. Mobile design polish

---

## MCX TRADING (SEPARATE — DO NOT MIX WITH WEBSITE)
Locked configs:
- Silver Micro 5-min: 0.6% SL, 1.5 R:R, Evening, SqOff 23:05
- Crude Oil Micro 5-min: 0.5% SL, 1.75 R:R, Evening, SqOff 23:05
- Gold Ten 15-min: 1.0% SL, 1.5 R:R, Evening, SqOff 23:05
Files: sperandeo_avwap_mcx_metals_v2.txt, MCX_Metals_Strategy_Deployment_v1.docx

---

## SESSION START CHECKLIST FOR CLAUDE
1. Read this entire document
2. Start with item #1 from NEXT SESSION list
3. Never ask questions answered here
4. Never suggest already-rejected options
5. Check actual file content before any code change
6. Update this document at end of session
7. Guide Gajendra step by step — zero technical knowledge

---
END OF MASTER CONTEXT
