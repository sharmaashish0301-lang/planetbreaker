const SUPABASE_URL = 'https://zjcwvnvnhyjjaoltybvj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV';

// This endpoint ONLY reads from Supabase
// No external API calls = instant response under 500ms
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=60'); // Cache for 60 seconds

  try {
    const category = req.query.category || null;
    const limit = req.query.limit || 50;

    let url = `${SUPABASE_URL}/rest/v1/articles?select=id,title,content,category,region,source,source_url,published_at,read_count,is_breaking&order=published_at.desc&limit=${limit}`;
    
    if (category) {
      url += `&category=eq.${category}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const articles = await response.json();

    res.status(200).json({
      success: true,
      count: articles.length,
      articles: articles
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
