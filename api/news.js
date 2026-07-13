const GUARDIAN_KEY = process.env.GUARDIAN_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;
const SUPABASE_URL = 'https://zjcwvnvnhyjjaoltybvj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV';

// ══════════════════════════════════════════════
//  GUARDIAN SECTIONS → CATEGORIES
// ══════════════════════════════════════════════
const GUARDIAN_SECTIONS = [
  { section: 'world',    category: 'world'         },
  { section: 'business', category: 'finance'       },
  { section: 'sport',    category: 'sports'        },
  { section: 'film',     category: 'entertainment' },
  { section: 'technology', category: 'auto'        },
];

// ══════════════════════════════════════════════
//  CATEGORY DETECTOR
// ══════════════════════════════════════════════
function detectCategory(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  if (/world cup|fifa|cricket|premier league|nba|nfl|tennis|olympics|tournament|quarterfinal|semifinal|football match|rugby|athlete|wicket|goal|innings|ipl|champions league|copa america|t20/.test(text)) return 'sports';
  if (/stock|share|market|nifty|sensex|nasdaq|earnings|ipo|crypto|bitcoin|finance|economy|gdp|inflation|fed|trading|investor|rupee|dollar|rbi|sebi|revenue|profit/.test(text)) return 'finance';
  if (/car|suv|ev|electric vehicle|automobile|vehicle launch|bmw|toyota|tesla|tata motors|hyundai|maruti|motor show|mahindra|mercedes|audi/.test(text)) return 'auto';
  if (/netflix|movie|bollywood|hollywood|celebrity|box office|oscar|grammy|streaming|web series|album|actor|actress|director|trailer|concert|music|award/.test(text)) return 'entertainment';
  return 'world';
}

// Strip HTML tags from text
function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

// ══════════════════════════════════════════════
//  GEMINI ARTICLE WRITER
// ══════════════════════════════════════════════
async function writeWithGemini(title, summary, category, source) {
  if (!GEMINI_KEY) {
    console.log('No Gemini key found');
    return summary;
  }

  const cleanSummary = stripHtml(summary);
  
  const prompt = `You are a professional news journalist. Write a complete 400-500 word original news article.

HEADLINE: ${title}
SUMMARY: ${cleanSummary}
SOURCE: ${source}
CATEGORY: ${category}

RULES:
- Write entirely in your own words, do not copy the summary
- Start with a strong news opening sentence
- Use "according to ${source}" when citing facts  
- Add global context and why this matters
- End with what to watch next
- Third person throughout
- No "In conclusion" or "In summary"
- If breaking news, end with: DEVELOPING STORY — This article will be updated as more details emerge.

Article:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.log('Gemini HTTP error:', response.status, errText);
      return cleanSummary;
    }

    const data = await response.json();
    
    if (data.error) {
      console.log('Gemini API error:', JSON.stringify(data.error));
      return cleanSummary;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.log('Gemini no text in response:', JSON.stringify(data).substring(0, 300));
      return cleanSummary;
    }

    console.log('Gemini success, article length:', text.length);
    return text;

  } catch(e) {
    console.log('Gemini fetch error:', e.message);
    return cleanSummary;
  }
}

// ══════════════════════════════════════════════
//  GUARDIAN FETCH
// ══════════════════════════════════════════════
async function fetchFromGuardian(section, category) {
  try {
    const url = `https://content.guardianapis.com/search?section=${section}&show-fields=standfirst,byline&page-size=5&order-by=newest&api-key=${GUARDIAN_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const results = data.response?.results || [];

    return results.map(r => ({
      title: stripHtml(r.webTitle),
      summary: stripHtml(r.fields?.standfirst || ''),
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
//  GDELT FETCH — English only, breaking events
// ══════════════════════════════════════════════
async function fetchFromGDELT(query) {
  try {
    // sourcelang:english forces English articles only
    const encodedQuery = encodeURIComponent(`${query} sourcelang:english`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodedQuery}&mode=artlist&maxrecords=5&sort=datedesc&format=json`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();

    return (data.articles || [])
      .filter(a => a.title && /[a-zA-Z]/.test(a.title)) // English titles only
      .map(a => ({
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

  console.log('news.js called — Guardian key exists:', !!GUARDIAN_KEY, '— Gemini key exists:', !!GEMINI_KEY);

  try {
    const results = [];

    // STEP 1: Guardian API
    for (const { section, category } of GUARDIAN_SECTIONS) {
      console.log('Fetching Guardian section:', section);
      const articles = await fetchFromGuardian(section, category);
      console.log('Guardian', section, 'returned:', articles.length, 'articles');

      for (const article of articles.slice(0, 1)) {
        if (!article.title) continue;
        console.log('Processing article:', article.title.substring(0, 60));
        const exists = await articleExists(article.title);
        console.log('Article exists in DB:', exists);
        if (exists) continue;

        console.log('Calling Gemini for:', article.title.substring(0, 40));
        const fullContent = await writeWithGemini(
          article.title,
          article.summary,
          category,
          'The Guardian'
        );
        console.log('Gemini returned content length:', fullContent?.length || 0);

        const saved = await saveArticle({ ...article, content: fullContent });
        console.log('Saved to DB:', !!saved);
        if (saved) results.push({ source: 'guardian', category, title: article.title });
      }
    }

    // GDELT removed — blocked by Vercel network
    // Guardian alone covers world, finance, sports, entertainment, auto

    // STEP 3: Return latest
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
    console.log('Main handler error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}
