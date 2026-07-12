# PLANETBREAKER — MASTER CONTEXT DOCUMENT
# Last Updated: July 12, 2026
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
GitHub: sharmaashish030... (exact handle visible in screenshots)

---

## TECH STACK (LOCKED — DO NOT CHANGE)
- Domain: planetbreaker.com (bought on BigRock.in)
- Hosting: Vercel (free tier, hobby plan)
- Repository: GitHub repo named "planetbreaker"
- Database: Supabase (project ID: zjcwvnvnhyjjaoltybvj)
- News Data: NewsAPI (key: ef881094b6ee4c628a1a432be2b5190f)
- Market Data: Alpha Vantage (key: IV2QBLBJGROWAYPM)
- Supabase Publishable Key: sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV
- Supabase URL: https://zjcwvnvnhyjjaoltybvj.supabase.co

---

## FILES IN GITHUB REPO (CURRENT STATE)
```
index.html          → Homepage (v2, live, real news flowing)
article.html        → Article detail page (built, click not working yet)
api/
  news.js           → Fetches news from NewsAPI, saves to Supabase
  markets.js        → Fetches market prices from Alpha Vantage
```

---

## DATABASE TABLES (SUPABASE)
1. articles
   - id, created_at (auto)
   - title, content, category, region, source, source_url
   - image_url, published_at, read_count, is_breaking

2. saved_articles
   - id, created_at (auto)
   - user_email, article_id, saved_at

3. subscribers
   - id, created_at (auto)
   - email, region, subscribed_at, is_active

---

## DESIGN DECISIONS (LOCKED — DO NOT CHANGE)
- Background: Warm ivory #FAF7F2
- Primary accent: Crimson #C0392B
- Text: Charcoal #1A1A2E
- Font: Playfair Display (headlines) + Inter (body)
- Logo: "PlanetBreaker" — Playfair Display, charcoal, NO hammer, NO split colors
- NO images on article cards (by design decision)
- Bookmark icon: 🔖 on every card
- Dual ticker: Row 1 = all categories mixed, Row 2 = biggest breaking story
- Market strip: scrolling indices + currencies + commodities
- Hero: dynamic, shows biggest story regardless of category
- Four category cards below hero: World, Finance, Sports, Entertainment
- Region detection: automatic via IP (ipapi.co), no manual selector

---

## PRICING MODEL (LOCKED)
- Free: 10 articles/month
- PlanetBreaker Pass: ₹29/month = save up to 31 articles
- Pro plan (₹99/month, 600 saves) — PARKED, not live yet, add later
- No other plans

---

## WHAT IS WORKING RIGHT NOW
✅ planetbreaker.com live globally
✅ Mobile responsive (basic)
✅ Real news fetching from NewsAPI every 5 minutes
✅ Articles storing in Supabase database
✅ Deduplication working (no repeat articles)
✅ Hero updates with real breaking news
✅ Live feed sidebar shows real stories
✅ Trending section shows real articles
✅ Category cards show real news
✅ Market strip (partial — Alpha Vantage free tier limited)
✅ Bookmark button (frontend only, no backend save yet)
✅ article.html page built with full content, share buttons, ad slots, related articles
✅ Auto refresh every 5 minutes

---

## WHAT IS BROKEN / NOT WORKING
❌ Clicking article cards does nothing (onclick not injecting correctly into template literals)
❌ Market prices not real-time for Indian indices (NIFTY, SENSEX) — Alpha Vantage free tier
❌ Bookmark not actually saving to Supabase (frontend only)
❌ No Google Analytics yet
❌ No Google AdSense yet
❌ No Hindi translation yet
❌ News not following Google Trends (fetching generic queries, missing trending events like World Cup)

---

## DECISIONS ALREADY MADE (DO NOT RE-DISCUSS)
- Domain: PlanetBreaker.com ✓ (not MarketBreaker, not PlanetWhisper)
- Single pricing plan only for now (₹29) ✓
- No images on cards ✓
- No hammer in logo ✓
- Separate article page not slide-in ✓ (better for SEO and AdSense)
- Evening session default for MCX trading ✓
- Option B for homepage (all sections driven by trending) ✓ — BUILD NEXT SESSION
- Social media posts (tweets, X posts) can be used as articles with embed + credit ✓ (legal)
- Skip Streak platform for now ✓
- Skip Namecheap SEO package ✓
- Skip paper trading, go live on Zerodha ✓
- No maximum holding period in MCX strategy ✓ (fixed SL handles it)

---

## NEXT SESSION PRIORITIES (IN ORDER — DO NOT SKIP)
1. FIX article card click → article.html navigation
2. BUILD Google Trends integration → drives all homepage content dynamically
3. ADD Google Analytics (15 min setup)
4. FIX NIFTY/SENSEX live prices
5. IMPROVE mobile design
6. ADD Hindi translation layer
7. APPLY for Google AdSense
8. CONNECT bookmark to Supabase backend

---

## GOOGLE TRENDS INTEGRATION PLAN (AGREED)
- Fetch Google Trends top 20 every hour (India + Global)
- Use unofficial PyTrends via Vercel serverless function
- Map trending topics to categories automatically
- Use trending terms as dynamic NewsAPI queries
- Result: Homepage shows Copa America quarterfinals, World Cup lineups etc — whatever is trending NOW
- This drives ENTIRE homepage (Option B — all sections, not just hero)
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
Claude should:
1. Read this document first
2. Check what's broken (section above)
3. Start with Priority #1 from Next Session list
4. Never ask questions already answered in this document
5. Never suggest options already rejected
6. Never re-discuss locked decisions
7. Guide Gajendra step by step — he has zero technical knowledge

---

## IMPORTANT RULES FOR CLAUDE
- Never lose track of the big picture: automated global news site
- Always think revenue first (AdSense + subscriptions)
- Never suggest paid tools when free alternatives exist
- Keep Sperandeo trading system and PlanetBreaker website completely separate
- When stuck on a technical problem, try max 2 approaches then find a different solution
- Don't repeat the same fix that already failed
- Always save progress — update this document at end of each session

---
END OF MASTER CONTEXT DOCUMENT
