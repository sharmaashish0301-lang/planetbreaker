const NEWS_API_KEY = 'ef881094b6ee4c628a1a432be2b5190f';
const SUPABASE_URL = 'https://zjcwvnvnhyjjaoltybvj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV';

// Tighter category queries — less overlap
const CATEGORIES = {
  world: 'geopolitics OR war OR diplomacy OR UN OR NATO OR climate OR election OR government OR sanctions',
  finance: 'stock market OR earnings OR IPO OR Federal Reserve OR inflation OR GDP OR cryptocurrency OR insider trading OR block deal',
  sports: 'FIFA World Cup OR cricket OR Premier League OR NBA OR tennis OR Olympics OR football match OR tournament OR quarterfinal OR semifinal',
  auto: 'car launch OR electric vehicle OR EV sales OR automobile OR Tesla OR Tata Motors OR BMW OR Toyota new model',
  entertainment: 'Netflix OR Hollywood OR Bollywood OR box office OR celebrity OR Grammy OR Oscar OR new release OR streaming'
};

// Keyword-based category detector — catches misclassified articles
function detectCategory(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();

  if (/world cup|fifa|cricket|premier league|nba|tennis|tournament|quarterfinal|semifinal|match result|football|rugby|olympics|athlete|scorer|wicket|goal|innings/.test(text)) return 'sports';
  if (/stock|share|market|nifty|sensex|nasdaq|earnings|ipo|crypto|bitcoin|finance|economy|gdp|inflation|fed|trading|investor|rupee|dollar/.test(text)) return 'finance';
  if (/car|suv|ev|electric vehicle|automobile|launch|mileage|bmw|toyota|tesla|tata motors|hyundai|motor show/.test(text)) return 'auto';
  if (/netflix|movie|bollywood|hollywood|celebrity|box office|oscar|grammy|streaming|web series|album|actor|actress/.test(text)) return 'entertainment';
  return 'world';
}

// Fetch news from NewsAPI
async function fetchNews(category, query) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${NEWS_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.articles || [];
}

// Check if article already exists
async function articleExists(title) {
  const shortTitle = encodeURIComponent(title.substring(0, 50));
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?title=ilike.*${shortTitle}*&select=id&limit=1`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  const data = await res.json();
  return Array.isArray(data) && data.length > 0;
}

// Save article — return=representation so we get the ID back
async function saveArticle(article, category) {
  // Re-detect category from content to fix misclassification
  const trueCategory = detectCategory(article.title, article.description);

  const body = {
    title: article.title,
    content: article.description || article.content || '',
    category: trueCategory,
    region: 'global',
    source: article.source?.name || 'Unknown',
    source_url: article.url,
    image_url: article.urlToImage || '',
    published_at: article.publishedAt,
    read_count: 0,
    is_breaking: false
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'  // Return full row including id
    },
    body: JSON.stringify(body)
  });

  return response.status;
}

// Main handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const results = [];

    for (const [category, query] of Object.entries(CATEGORIES)) {
      const articles = await fetchNews(category, query);

      for (const article of articles.slice(0, 5)) {
        if (!article.title || article.title === '[Removed]') continue;
        const exists = await articleExists(article.title);
        if (exists) continue;
        const status = await saveArticle(article, category);
        results.push({ category, title: article.title, status });
      }
    }

    // Fetch latest with explicit id column — critical for article page navigation
    const latestResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?select=id,title,content,category,region,source,source_url,published_at,read_count,is_breaking&order=published_at.desc&limit=50`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const latestArticles = await latestResponse.json();

    res.status(200).json({
      success: true,
      fetched: results.length,
      articles: latestArticles
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
