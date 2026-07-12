const GUARDIAN_KEY = process.env.GUARDIAN_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;
const SUPABASE_URL = 'https://zjcwvnvnhyjjaoltybvj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV';

// ══════════════════════════════════════════════
//  GUARDIAN CATEGORY MAPPING
//  Guardian has built-in sections — no guessing
// ══════════════════════════════════════════════
const GUARDIAN_SECTIONS = [
  { section: 'world',       category: 'world'         },
  { section: 'business',    category: 'finance'        },
  { section: 'money',       category: 'finance'        },
  { section: 'sport',       category: 'sports'         },
  { section: 'football',    category: 'sports'         },
  { section: 'technology',  category: 'auto'           },
  { section: 'film',        category: 'entertainment'  },
  { section: 'music',       category: 'entertainment'  },
  { section: 'culture',     category: 'entertainment'  },
  { section: 'media',       category: 'entertainment'  },
];

// ══════════════════════════════════════════════
//  SMART CATEGORY DETECTOR (fallback)
// ══════════════════════════════════════════════
function detectCategory(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  if (/world cup|fifa|cricket|premier league|nba|nfl|tennis|olympics|tournament|quarterfinal|semifinal|match|football|rugby|athlete|wicket|goal|innings|ipl|champions league|euro|copa america|t20|scorer/.test(text)) return 'sports';
  if (/stock|share|market|nifty|sensex|nasdaq|earnings|ipo|crypto|bitcoin|finance|economy|gdp|inflation|fed|trading|investor|rupee|dollar|rbi|sebi|merger|revenue|profit/.test(text)) return 'finance';
  if (/car|suv|ev|electric vehicle|automobile|vehicle launch|bmw|toyota|tesla|tata motors|hyundai|maruti|motor show|auto expo|mahindra|mercedes|audi/.test(text)) return 'auto';
  if (/netflix|movie|bollywood|hollywood|celebrity|box office|oscar|grammy|streaming|web series|album|actor|actress|director|trailer|concert|music|award/.test(text)) return 'entertainment';
  return 'world';
}

// ══════════════════════════════════════════════
//  GEMINI ARTICLE WRITER
//  Writes 400-500 word ORIGINAL article
//  Based on headline + summary only
//  Never copies Guardian text
// ══════════════════════════════════════════════
async function writeWithGemini(title, summary, category, source) {
  const categoryContext = {
    world: 'international news and global affairs',
    finance: 'financial markets and economic news',
    sports: 'sports news and match coverage',
    auto: 'automotive industry news',
    entertainment: 'entertainment and celebrity news'
  };

  const prompt = `You are a professional news journalist writing for PlanetBreaker, a global breaking news website.

Write a complete, original 400-500 word news article based ONLY on the facts below.
Do NOT copy any text from the source. Write in your own words entirely.
Do NOT invent facts, quotes, or statistics not mentioned below.
If details are limited, acknowledge it is a developing story.

HEADLINE: ${title}
SUMMARY: ${summary}
TOPIC: ${categoryContext[category] || 'general news'}
ORIGINAL SOURCE: ${source}

RULES:
- Strong opening sentence with the key fact
- Explain why this matters to readers globally  
- Use "according to ${source}" when stating facts
- Add relevant background context you know about this topic
- End with what happens next / what to watch for
- Never write "In conclusion" or "In summary"
- Add "DEVELOPING STORY — This article will be updated as more details emerge." if it just happened
- Write in third person
- Do not mention PlanetBreaker in the article

Write the article now, nothing else:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        })
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || summary;
  } catch(e) {
    console.log('Gemini error:', e.message);
    return summary;
  }
}

// ══════════════════════════════════════════════
//  GUARDIAN API FETCH
//  Returns articles with headline + standfirst
//  Proper categories built in
// ══════════════════════════════════════════════
async function fetchFromGuardian(section, category) {
  try {
    const url = `https://content.guardianapis.com/search?section=${section}&show-fields=standfirst,byline&page-size=5&order-by=newest&api-key=${GUARDIAN_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const results = data.response?.results || [];

    return results.map(r => ({
      title: r.webTitle,
      summary: r.fields?.standfirst || '',
      url: r.webUrl,
      source: 'The Guardian',
      publishedAt: r.webPublicationDate,
      category: category
    }));
  } catch(e) {
    console.log('Guardian error:', e.message);
    return [];
  }
}

// ══════════════════════════════════════════════
//  GDELT FETCH
//  Real-time global breaking events
// ══════════════════════════════════════════════
async function fetchFromGDELT(query) {
  try {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=5&sort=datedesc&format=json`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.articles || []).map(a => ({
      title: a.title,
      summary: `Breaking news reported by ${a.domain}.`,
      url: a.url,
      source: a.domain || 'News',
      publishedAt: a.seendatetime || new Date().toISOString(),
      category: detectCategory(a.title, '')
    }));
  } catch(e) {
    console.log('GDELT error:', e.message);
    return [];
  }
}

// ══════════════════════════════════════════════
//  SUPABASE HELPERS
// ══════════════════════════════════════════════
async function articleExists(title) {
  const shortTitle = encodeURIComponent(title.substring(0, 50));
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?title=ilike.*${shortTitle}*&select=id&limit=1`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  return Array.isArray(data) && data.length > 0;
}

async function saveArticle(article) {
  const body = {
    title: article.title,
    content: article.content,
    category: article.category,
    region: 'global',
    source: article.source,
    source_url: article.url,
    image_url: '',
    published_at: article.publishedAt || new Date().toISOString(),
    read_count: 0,
    is_breaking: false
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });

  const saved = await response.json();
  return Array.isArray(saved) ? saved[0] : null;
}

// ══════════════════════════════════════════════
//  MAIN HANDLER
// ══════════════════════════════════════════════
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const results = [];

    // ── STEP 1: Guardian API (primary source) ──
    for (const { section, category } of GUARDIAN_SECTIONS) {
      const articles = await fetchFromGuardian(section, category);

      for (const article of articles.slice(0, 3)) {
        if (!article.title) continue;
        const exists = await articleExists(article.title);
        if (exists) continue;

        // Gemini writes full original article
        const fullContent = await writeWithGemini(
          article.title,
          article.summary,
          article.category,
          article.source
        );

        const saved = await saveArticle({ ...article, content: fullContent });
        if (saved) results.push({ source: 'guardian', category, title: article.title });
      }
    }

    // ── STEP 2: GDELT for breaking global events ──
    const gdeltQueries = [
      'FIFA World Cup 2026 quarterfinal',
      'breaking news explosion attack',
      'stock market crash today',
      'earthquake flood disaster',
      'election results coup'
    ];

    for (const query of gdeltQueries) {
      const articles = await fetchFromGDELT(query);

      for (const article of articles.slice(0, 2)) {
        if (!article.title) continue;
        const exists = await articleExists(article.title);
        if (exists) continue;

        const fullContent = await writeWithGemini(
          article.title,
          article.summary,
          article.category,
          article.source
        );

        const saved = await saveArticle({ ...article, content: fullContent });
        if (saved) results.push({ source: 'gdelt', category: article.category, title: article.title });
      }
    }

    // ── STEP 3: Return latest articles ──
    const latestResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?select=id,title,content,category,region,source,source_url,published_at,read_count,is_breaking&order=published_at.desc&limit=50`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const latestArticles = await latestResponse.json();

    res.status(200).json({
      success: true,
      fetched: results.length,
      sources: {
        guardian: results.filter(r => r.source === 'guardian').length,
        gdelt: results.filter(r => r.source === 'gdelt').length
      },
      articles: latestArticles
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
