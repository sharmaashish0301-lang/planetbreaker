const GUARDIAN_KEY = process.env.GUARDIAN_KEY;
const GEMINI_KEY = process.env.GEMINI_KEY;
const SUPABASE_URL = 'https://zjcwvnvnhyjjaoltybvj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV';

// Guardian sections → categories
const GUARDIAN_SECTIONS = [
  { section: 'world',       category: 'world'         },
  { section: 'us-news',     category: 'world'         },
  { section: 'politics',    category: 'world'         },
  { section: 'business',    category: 'finance'       },
  { section: 'money',       category: 'finance'       },
  { section: 'sport',       category: 'sports'        },
  { section: 'football',    category: 'sports'        },
  { section: 'cricket',     category: 'sports'        },
  { section: 'film',        category: 'entertainment' },
  { section: 'music',       category: 'entertainment' },
  { section: 'technology',  category: 'world'         },
  { section: 'environment', category: 'world'         },
  { section: 'science',     category: 'world'         },
  { section: 'media',       category: 'entertainment' },
];

// Smart category detector
function detectCategory(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  if (/world cup|fifa|cricket|premier league|nba|nfl|tennis|olympics|tournament|quarterfinal|semifinal|football match|rugby|wicket|innings|ipl|champions league|copa america|t20|scorer|grand slam|formula 1/.test(text)) return 'sports';
  if (/stock price|share price|market crash|nifty|sensex|nasdaq|earnings report|ipo|crypto|bitcoin|interest rate|federal reserve|trading|investor|rupee|dollar|rbi|sebi|merger|acquisition|bond yield/.test(text)) return 'finance';
  if (/car launch|new car model|electric vehicle sales|ev range|suv launch|bmw new|toyota new|tata motors|hyundai launch|maruti|motor show|auto expo|mahindra new|vehicle recall/.test(text)) return 'auto';
  if (/netflix|amazon prime|box office|bollywood|hollywood|celebrity|oscar|grammy|bafta|streaming show|web series|album release|film review|concert tour|music award/.test(text)) return 'entertainment';
  return 'world';
}

// Strip HTML
function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

// Gemini article writer WITH Google Search grounding
async function writeWithGemini(title, summary, category, source) {
  if (!GEMINI_KEY) return `<p>${summary}</p>`;

  const cleanSummary = stripHtml(summary);
  if (cleanSummary.length < 20) return null; // Skip empty articles

  const categoryContext = {
    world: 'international news and global affairs',
    finance: 'financial markets and economic news',
    sports: 'sports news, scores and match coverage',
    auto: 'automotive industry news',
    entertainment: 'entertainment and celebrity news'
  };

  const prompt = `You are a professional news journalist writing for PlanetBreaker, a global breaking news website.

Write a complete 400-500 word news article based ONLY on the facts provided below.

HEADLINE: ${title}
CONTEXT: ${cleanSummary}
SOURCE: ${source}
TOPIC: ${categoryContext[category] || 'general news'}

CRITICAL RULES:
- ONLY use facts that are explicitly stated in the CONTEXT above
- NEVER invent scores, goal scorers, names, statistics or quotes not in the context
- If context is limited, write what you know and keep it honest — do not pad with guesses
- Write in HTML format with proper <p> tags for each paragraph
- Use <strong> for important names, numbers, and key facts  
- Minimum 4 paragraphs, each in its own <p> tag
- First paragraph: the main news fact (most important info first)
- Second paragraph: background and why this matters
- Third paragraph: details and implications from the context
- Fourth paragraph: what to watch next
- Use "according to ${source}" when citing facts
- Do NOT write "In conclusion" or "In summary"
- Do NOT add "DEVELOPING STORY" for completed events like match results
- Do NOT assign political titles like "former", "current", "ex-" to any politician — just use their name
- Do NOT state who holds any political office — just refer to them by name only
- Do NOT invent relationships, positions, or roles not explicitly stated in the CONTEXT

Write the article now in HTML format:`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1500
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.log('Gemini error:', response.status, err.substring(0, 200));
      // Fallback without search grounding if grounding fails
      return await writeWithGeminiBasic(title, cleanSummary, category, source);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || text.length < 100) return null;

    console.log('Gemini grounded article length:', text.length);
    return text;

  } catch(e) {
    console.log('Gemini fetch error:', e.message);
    return await writeWithGeminiBasic(title, cleanSummary, category, source);
  }
}

// Fallback: Gemini without search grounding
async function writeWithGeminiBasic(title, summary, category, source) {
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Write a 300 word news article about: "${title}". Context: "${summary}". Source: ${source}. Use HTML <p> tags. Only state facts from the context. Do not invent details.` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
        })
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || `<p>${summary}</p>`;
  } catch(e) {
    return `<p>${summary}</p>`;
  }
}

// Guardian fetch
async function fetchFromGuardian(section, category) {
  try {
    const url = `https://content.guardianapis.com/search?section=${section}&show-fields=standfirst,byline,thumbnail&page-size=10&order-by=newest&api-key=${GUARDIAN_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const results = data.response?.results || [];

    return results.map(r => {
      const title = stripHtml(r.webTitle);
      const summary = stripHtml(r.fields?.standfirst || '');
      const specificSections = ['sport', 'football', 'cricket', 'business', 'money', 'film', 'music', 'media'];
      const finalCategory = specificSections.includes(section) ? category : detectCategory(title, summary);
      return {
        title,
        summary,
        url: r.webUrl,
        source: 'The Guardian',
        publishedAt: r.webPublicationDate,
        category: finalCategory,
        image_url: r.fields?.thumbnail || ''
      };
    });
  } catch(e) {
    console.log('Guardian error:', section, e.message);
    return [];
  }
}

// Check duplicate by URL (more reliable than title)
async function articleExistsByUrl(url) {
  try {
    const encodedUrl = encodeURIComponent(url);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?source_url=eq.${encodedUrl}&select=id&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch(e) { return false; }
}

// Save article
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

// Main handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  console.log('news.js called — Guardian key:', !!GUARDIAN_KEY, 'Gemini key:', !!GEMINI_KEY);

  try {
    const results = [];

    for (const { section, category } of GUARDIAN_SECTIONS) {
      const articles = await fetchFromGuardian(section, category);

      for (const article of articles.slice(0, 2)) {
        if (!article.title || !article.url) continue;
        if (article.summary.length < 20) {
          console.log('Skipping empty article:', article.title.substring(0, 50));
          continue;
        }

        // Deduplicate by URL
        const exists = await articleExistsByUrl(article.url);
        if (exists) continue;

        console.log('Writing article:', article.title.substring(0, 50));

        const fullContent = await writeWithGemini(
          article.title,
          article.summary,
          article.category,
          article.source
        );

        if (!fullContent) {
          console.log('Skipping - no content generated');
          continue;
        }

        const saved = await saveArticle({ ...article, content: fullContent });
        if (saved) {
          results.push({ category: article.category, title: article.title });
          console.log('Saved:', article.category, article.title.substring(0, 40));
        }
        
        // 8 second delay between Gemini calls — safely under 15 RPM limit
        await new Promise(r => setTimeout(r, 8000));
      }
    }

    // Return latest articles
    const latestResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?select=id,title,content,category,region,source,source_url,image_url,published_at,read_count,is_breaking&order=published_at.desc&limit=50`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const latestArticles = await latestResponse.json();

    res.status(200).json({
      success: true,
      fetched: results.length,
      articles: latestArticles
    });

  } catch (error) {
    console.log('Main error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}
