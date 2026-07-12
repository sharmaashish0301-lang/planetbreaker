const NEWS_API_KEY = 'ef881094b6ee4c628a1a432be2b5190f';
const SUPABASE_URL = 'https://zjcwvnvnhyjjaoltybvj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV';

// TRUSTED SOURCE WHITELIST — prevents fake news
const TRUSTED_SOURCES = [
  'reuters.com','apnews.com','bbc.com','bbc.co.uk',
  'theguardian.com','nytimes.com','washingtonpost.com',
  'bloomberg.com','ft.com','economist.com',
  'ndtv.com','thehindu.com','hindustantimes.com',
  'timesofindia.com','economictimes.com','moneycontrol.com',
  'livemint.com','businessstandard.com','cnbc.com',
  'espn.com','espncricinfo.com','skysports.com',
  'goal.com','fifa.com','icc-cricket.com',
  'autocarindia.com','motortrend.com','caranddriver.com',
  'variety.com','hollywoodreporter.com','deadline.com',
  'aljazeera.com','france24.com','dw.com',
  'scmp.com','straitstimes.com','abc.net.au'
];

function isTrustedSource(url) {
  if (!url) return false;
  return TRUSTED_SOURCES.some(domain => url.includes(domain));
}

// SMART CATEGORY DETECTOR
function detectCategory(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  if (/world cup|fifa|cricket|premier league|nba|nfl|tennis|olympics|tournament|quarterfinal|semifinal|match result|football|rugby|athlete|scorer|wicket|goal|innings|ipl|champions league|euro|copa america|test match|odi|t20/.test(text)) return 'sports';
  if (/stock|share|market|nifty|sensex|nasdaq|s&p|earnings|ipo|crypto|bitcoin|ethereum|finance|economy|gdp|inflation|fed|trading|investor|rupee|dollar|rbi|sebi|merger|acquisition|revenue|profit|loss|quarterly/.test(text)) return 'finance';
  if (/car|suv|ev|electric vehicle|automobile|vehicle launch|mileage|bmw|toyota|tesla|tata motors|hyundai|maruti|motor show|horsepower|auto expo|mahindra|kia|mercedes|audi/.test(text)) return 'auto';
  if (/netflix|movie|bollywood|hollywood|celebrity|box office|oscar|grammy|streaming|web series|album|actor|actress|director|trailer|season|episode|concert|music|award show/.test(text)) return 'entertainment';
  return 'world';
}

// NEWSAPI QUERIES
const NEWSAPI_QUERIES = {
  world: 'geopolitics OR war OR diplomacy OR UN OR NATO OR election OR government OR sanctions OR disaster OR crash OR attack',
  finance: 'stock market OR earnings OR IPO OR Federal Reserve OR inflation OR GDP OR cryptocurrency OR insider trading OR Nifty OR Sensex',
  sports: 'FIFA World Cup OR cricket OR Premier League OR NBA OR tennis OR Olympics OR quarterfinal OR semifinal OR tournament',
  auto: 'car launch OR electric vehicle OR EV sales OR automobile OR Tesla OR BMW OR Toyota new model OR auto sales',
  entertainment: 'Netflix OR Hollywood OR Bollywood OR box office OR celebrity OR Grammy OR Oscar OR new release OR streaming'
};

async function fetchFromNewsAPI(category, query) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${NEWS_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return (data.articles || []).filter(a => isTrustedSource(a.url));
}

// GDELT FETCH — global real-time breaking events
async function fetchFromGDELT(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodedQuery}&mode=artlist&maxrecords=10&sort=datedesc&format=json`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.articles || [])
      .filter(a => isTrustedSource(a.url))
      .map(a => ({
        title: a.title,
        description: `As reported by ${a.domain}.`,
        url: a.url,
        source: { name: a.domain || 'Unknown' },
        publishedAt: a.seendatetime || new Date().toISOString(),
        urlToImage: '',
        location: a.location || null,
        domain: a.domain
      }));
  } catch(e) {
    console.log('GDELT error:', e.message);
    return [];
  }
}

// CLAUDE ARTICLE WRITER
async function writeArticleWithClaude(title, description, category, source, location) {
  const categoryContext = {
    world: 'international news and global affairs',
    finance: 'financial markets and economic news',
    sports: 'sports news and match coverage',
    auto: 'automotive industry and vehicle news',
    entertainment: 'entertainment and celebrity news'
  };
  const locationContext = location ? `The event occurred in or near ${location}.` : '';
  const prompt = `You are a professional news journalist writing for PlanetBreaker, a global breaking news website.

Write a complete, factual news article based ONLY on the information provided below.
Do NOT invent facts, quotes, statistics, or details not in the source information.
If information is limited, write what you know and note it is a developing story.

HEADLINE: ${title}
DESCRIPTION: ${description}
CATEGORY: ${categoryContext[category] || 'general news'}
SOURCE: ${source}
${locationContext}

WRITING RULES:
- Write 350-500 words
- Start with a strong opening sentence summarizing the key fact
- Add context about why this matters globally
- Use "according to ${source}" or "as reported by ${source}" for facts
- End with what to watch for next
- Never use "In conclusion" or "In summary"
- Write in third person
- Add "DEVELOPING STORY — Details are being updated as more information becomes available." at the end if event just happened
- Do not make up any names, numbers, or quotes

Write the article now:`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    return data.content?.[0]?.text || description;
  } catch(e) {
    console.log('Claude error:', e.message);
    return description;
  }
}

// SUPABASE HELPERS
async function articleExists(title) {
  const shortTitle = encodeURIComponent(title.substring(0, 50));
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?title=ilike.*${shortTitle}*&select=id&limit=1`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  return Array.isArray(data) && data.length > 0;
}

async function saveArticle(article, category, fullContent) {
  const trueCategory = detectCategory(article.title, article.description || '');
  const body = {
    title: article.title,
    content: fullContent || article.description || '',
    category: trueCategory,
    region: 'global',
    source: article.source?.name || article.domain || 'Unknown',
    source_url: article.url,
    image_url: article.urlToImage || '',
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

// MAIN HANDLER
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const results = [];
    const useClaudeAPI = !!process.env.ANTHROPIC_API_KEY;

    // STEP 1: NewsAPI for all categories
    for (const [category, query] of Object.entries(NEWSAPI_QUERIES)) {
      const articles = await fetchFromNewsAPI(category, query);
      for (const article of articles.slice(0, 3)) {
        if (!article.title || article.title === '[Removed]') continue;
        const exists = await articleExists(article.title);
        if (exists) continue;
        let fullContent = article.description || '';
        if (useClaudeAPI) {
          fullContent = await writeArticleWithClaude(
            article.title, article.description || '',
            category, article.source?.name || 'News', null
          );
        }
        const saved = await saveArticle(article, category, fullContent);
        if (saved) results.push({ source: 'newsapi', category, title: article.title });
      }
    }

    // STEP 2: GDELT for breaking global events
    const gdeltQueries = [
      'FIFA World Cup 2026 quarterfinal',
      'breaking news crash explosion',
      'stock market crash surge today',
      'election results political crisis',
      'natural disaster earthquake flood'
    ];

    for (const query of gdeltQueries) {
      const articles = await fetchFromGDELT(query);
      for (const article of articles.slice(0, 2)) {
        if (!article.title || article.title === '[Removed]') continue;
        const exists = await articleExists(article.title);
        if (exists) continue;
        const category = detectCategory(article.title, article.description);
        let fullContent = article.description || '';
        if (useClaudeAPI) {
          fullContent = await writeArticleWithClaude(
            article.title, article.description || '',
            category, article.source?.name || 'News', article.location
          );
        }
        const saved = await saveArticle(article, category, fullContent);
        if (saved) results.push({ source: 'gdelt', category, title: article.title });
      }
    }

    // STEP 3: Return latest articles with id
    const latestResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?select=id,title,content,category,region,source,source_url,published_at,read_count,is_breaking&order=published_at.desc&limit=50`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const latestArticles = await latestResponse.json();

    res.status(200).json({
      success: true,
      fetched: results.length,
      sources: {
        newsapi: results.filter(r => r.source === 'newsapi').length,
        gdelt: results.filter(r => r.source === 'gdelt').length
      },
      claude_enabled: useClaudeAPI,
      articles: latestArticles
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
