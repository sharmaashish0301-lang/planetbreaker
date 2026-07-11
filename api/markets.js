const ALPHA_VANTAGE_KEY = 'IV2QBLBJGROWAYPM';
const SUPABASE_URL = 'https://zjcwvnvnhyjjaoltybvj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vO3UIcMpHAAJB-T156vokg_048UDcSV';

// Symbols to track
const SYMBOLS = {
  // US Indices (via ETFs)
  'SPY': { name: 'S&P 500', type: 'index', region: 'US' },
  'QQQ': { name: 'NASDAQ', type: 'index', region: 'US' },
  // Stocks
  'AAPL': { name: 'Apple', type: 'stock', region: 'US' },
  'TSLA': { name: 'Tesla', type: 'stock', region: 'US' },
  'NVDA': { name: 'NVIDIA', type: 'stock', region: 'US' },
  'MSFT': { name: 'Microsoft', type: 'stock', region: 'US' },
  // Commodities
  'GLD': { name: 'Gold', type: 'commodity', region: 'Global' },
  'SLV': { name: 'Silver', type: 'commodity', region: 'Global' },
  'USO': { name: 'Crude Oil', type: 'commodity', region: 'Global' },
  // Crypto
  'BTC': { name: 'Bitcoin', type: 'crypto', region: 'Global' },
};

// Forex pairs
const FOREX_PAIRS = [
  { from: 'USD', to: 'INR', name: 'USD/INR' },
  { from: 'EUR', to: 'USD', name: 'EUR/USD' },
  { from: 'GBP', to: 'USD', name: 'GBP/USD' },
];

// Fetch quote from Alpha Vantage
async function fetchQuote(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  const quote = data['Global Quote'];
  if (!quote || !quote['05. price']) return null;
  return {
    symbol,
    price: parseFloat(quote['05. price']).toFixed(2),
    change: parseFloat(quote['09. change']).toFixed(2),
    change_pct: parseFloat(quote['10. change percent']).toFixed(2),
    volume: quote['06. volume'],
    name: SYMBOLS[symbol]?.name || symbol,
    type: SYMBOLS[symbol]?.type || 'stock',
    region: SYMBOLS[symbol]?.region || 'Global'
  };
}

// Fetch forex rate
async function fetchForex(from, to, name) {
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_VANTAGE_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  const rate = data['Realtime Currency Exchange Rate'];
  if (!rate) return null;
  return {
    symbol: `${from}/${to}`,
    name,
    price: parseFloat(rate['5. Exchange Rate']).toFixed(4),
    change: '0.00',
    change_pct: '0.00',
    type: 'forex',
    region: 'Global'
  };
}

// Main handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300'); // Cache for 5 minutes

  try {
    const marketData = [];

    // Fetch stock/ETF quotes (Alpha Vantage free tier: 25 requests/day)
    // Fetch top 5 most important symbols only
    const topSymbols = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA'];
    
    for (const symbol of topSymbols) {
      const quote = await fetchQuote(symbol);
      if (quote) marketData.push(quote);
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    // Fetch forex pairs
    for (const pair of FOREX_PAIRS) {
      const forex = await fetchForex(pair.from, pair.to, pair.name);
      if (forex) marketData.push(forex);
      await new Promise(r => setTimeout(r, 200));
    }

    // Add static data for indices we can't fetch in free tier
    // These will be updated manually or via paid tier later
    const staticData = [
      { symbol: 'NIFTY', name: 'NIFTY 50', price: '23847', change: '-289', change_pct: '-1.20', type: 'index', region: 'India' },
      { symbol: 'SENSEX', name: 'SENSEX', price: '78234', change: '-712', change_pct: '-0.90', type: 'index', region: 'India' },
      { symbol: 'FTSE', name: 'FTSE 100', price: '8102', change: '-24', change_pct: '-0.30', type: 'index', region: 'UK' },
      { symbol: 'DAX', name: 'DAX', price: '18432', change: '+36', change_pct: '+0.20', type: 'index', region: 'Europe' },
      { symbol: 'HANGSENG', name: 'Hang Seng', price: '17823', change: '-89', change_pct: '-0.50', type: 'index', region: 'HK' },
      { symbol: 'NIKKEI', name: 'Nikkei 225', price: '38921', change: '+312', change_pct: '+0.80', type: 'index', region: 'Japan' },
      { symbol: 'GOLD', name: 'Gold (USD)', price: '2387', change: '+14', change_pct: '+0.60', type: 'commodity', region: 'Global' },
      { symbol: 'SILVER', name: 'Silver (USD)', price: '29.84', change: '-0.09', change_pct: '-0.30', type: 'commodity', region: 'Global' },
      { symbol: 'CRUDE', name: 'Crude Oil', price: '74.23', change: '+6.18', change_pct: '+9.10', type: 'commodity', region: 'Global' },
    ];

    const allData = [...marketData, ...staticData];

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: allData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
