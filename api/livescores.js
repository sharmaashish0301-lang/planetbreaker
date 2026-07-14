export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=5');

  // All major sports ESPN endpoints
  const SPORTS = [
    { key: 'fifa_world_cup', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard', label: '⚽ FIFA World Cup' },
    { key: 'icc_cricket', url: 'https://site.api.espn.com/apis/site/v2/sports/cricket/8/scoreboard', label: '🏏 Cricket' },
    { key: 'nba', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard', label: '🏀 NBA' },
    { key: 'nfl', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', label: '🏈 NFL' },
    { key: 'premier_league', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard', label: '⚽ Premier League' },
    { key: 'champions_league', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard', label: '⚽ Champions League' },
    { key: 'ipl', url: 'https://site.api.espn.com/apis/site/v2/sports/cricket/4/scoreboard', label: '🏏 IPL' },
    { key: 'tennis_atp', url: 'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard', label: '🎾 ATP Tennis' },
    { key: 'formula1', url: 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard', label: '🏎️ Formula 1' },
    { key: 'mlb', url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard', label: '⚾ MLB' },
  ];

  function parseMatch(event, sportLabel) {
    const comp = event.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');
    const status = comp?.status;

    return {
      id: event.id,
      sport: sportLabel,
      name: event.name,
      shortName: event.shortName,
      date: event.date,
      status: {
        type: status?.type?.name,
        detail: status?.type?.detail,
        clock: status?.displayClock,
        period: status?.period,
        completed: status?.type?.completed,
      },
      home: {
        name: home?.team?.displayName,
        shortName: home?.team?.abbreviation,
        logo: home?.team?.logo,
        score: home?.score,
        winner: home?.winner,
      },
      away: {
        name: away?.team?.displayName,
        shortName: away?.team?.abbreviation,
        logo: away?.team?.logo,
        score: away?.score,
        winner: away?.winner,
      },
      venue: comp?.venue?.fullName,
      round: event.notes?.[0]?.headline || '',
    };
  }

  try {
    // Fetch all sports in parallel
    const results = await Promise.allSettled(
      SPORTS.map(async sport => {
        const r = await fetch(sport.url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000) // 5 second timeout per sport
        });
        const data = await r.json();
        const events = data.events || [];
        return events.map(e => parseMatch(e, sport.label));
      })
    );

    // Combine all matches, filter out failed fetches
    const allMatches = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Sort: live first, then upcoming, then finished
    const sorted = allMatches.sort((a, b) => {
      const priority = (m) => {
        if (m.status.type === 'STATUS_IN_PROGRESS') return 0;
        if (!m.status.completed) return 1;
        return 2;
      };
      return priority(a) - priority(b);
    });

    res.status(200).json({
      success: true,
      updated: new Date().toISOString(),
      total: sorted.length,
      live: sorted.filter(m => m.status.type === 'STATUS_IN_PROGRESS').length,
      matches: sorted
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
