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
  
  const prompt = `You are a senior news journalist at a global news agency. Your job is to write a full newspaper-quality article of at least 400 words.

HEADLINE: ${title}
KEY FACTS: ${cleanSummary}
SOURCE: ${source}
TOPIC AREA: ${category}

YOUR ARTICLE MUST INCLUDE ALL OF THESE SECTIONS:
1. OPENING (2 sentences): State the main news fact directly and its immediate significance
2. BACKGROUND (3-4 sentences): What led to this? Historical context the reader needs
3. DETAILS (3-4 sentences): Expand on the key facts, who is involved, what happened exactly
4. GLOBAL IMPACT (3-4 sentences): Why does this matter globally? Economic, political, social effects
5. REACTIONS (2-3 sentences): How are people/governments/markets responding? Use "according to ${source}"
6. WHAT NEXT (2-3 sentences): What should readers watch for in coming days/weeks?

RULES:
- Minimum 400 words — this is mandatory
- Write in your own words entirely, do not copy the headline or key facts verbatim
- Third person, past/present tense mix
- No "In conclusion", "In summary", "To summarize"
- Professional newspaper tone
- If this just happened, add at the very end: "DEVELOPING STORY — This article will be updated as more details emerge."

Write the full article now:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.log('Gemini HTTP error:', response.status, errText);
      
      // Try fallback model on 503
      if (response.status === 503) {
        console.log('Trying fallback model gemini-2.5-flash-lite...');
        const fallbackResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-goog-api-key': GEMINI_KEY
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            })
          }
        );
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (fallbackText) {
            console.log('Fallback Gemini success, length:', fallbackText.length);
            return fallbackText;
          }
        }
      }
      return cleanSummary;
    }

    const data = await response.json();
    
    if (data.error) {
      console.log('Gemini API error:', JSON.stringify(data.error));
      return cleanSummary;
    }

    console.log('Gemini full response:', JSON.stringify(data).substring(0, 500));
    
    const candidate = data.candidates?.[0];
    console.log('Finish reason:', candidate?.finishReason);
    console.log('Safety ratings:', JSON.stringify(candidate?.safetyRatings));
    
    const text = candidate?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.log('Gemini no text in response');
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
    const url = `https://content.guardianapis.com/search?section=${section}&show-fields=standfirst,byline,thumbnail&page-size=5&order-by=newest&api-key=${GUARDIAN_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const results = data.response?.results || [];

    return results.map(r => ({
      title: stripHtml(r.webTitle),
      summary: stripHtml(r.fields?.standfirst || ''),
      url: r.webUrl,
      source: 'The Guardian',
      publishedAt: r.webPublicationDate,
      category: category,
      image_url: r.fields?.thumbnail || ''
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
    image_url: article.image_url || '',
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
        console.log('Image URL:', article.image_url || 'NONE');
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
