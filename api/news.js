 const NEWS_API_KEY = 'ef881094b6ee4c628a1a432be2b5190f';
const SUPABASE_URL = 'https://zjcwvnvnhyjjaoltybvj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV';

// Category to NewsAPI query mapping
const CATEGORIES = {
  world: 'world news OR international OR global',
  finance: 'stock market OR finance OR economy OR trading OR shares',
  sports: 'sports OR cricket OR football OR tennis OR NBA',
  auto: 'automobile OR car launch OR EV OR electric vehicle',
  entertainment: 'bollywood OR hollywood OR netflix OR movies OR celebrity'
};

// Fetch news from NewsAPI
async function fetchNews(category, query) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${NEWS_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.articles || [];
}

// Save article to Supabase
async function saveArticle(article, category) {
  const body = {
    title: article.title,
    content: article.description || article.content || '',
    category: category,
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
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(body)
  });

  return response.status;
}

// Main handler
export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const results = [];

    // Fetch and save news for each category
    for (const [category, query] of Object.entries(CATEGORIES)) {
      const articles = await fetchNews(category, query);
      
      for (const article of articles.slice(0, 5)) {
        if (!article.title || article.title === '[Removed]') continue;
        const status = await saveArticle(article, category);
        results.push({ category, title: article.title, status });
      }
    }

    // Return latest articles from Supabase
    const latestResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?select=*&order=published_at.desc&limit=50`,
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
