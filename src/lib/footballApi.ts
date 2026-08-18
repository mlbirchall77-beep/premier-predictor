import { LivePlStanding } from '../types';
import { PREMIER_LEAGUE_TEAMS_2026_27 } from '../data/teams2026';

export interface ApiSyncResult {
  success: boolean;
  message: string;
  standings?: LivePlStanding[];
  timestamp: string;
  source: 'live_football_data_api' | 'simulated_engine';
}

export function getZeroStandings(): LivePlStanding[] {
  const sorted = [...PREMIER_LEAGUE_TEAMS_2026_27].sort((a, b) => a.name.localeCompare(b.name));
  return sorted.map((t, idx) => ({
    position: idx + 1,
    teamId: t.id,
    teamName: t.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    form: [],
  }));
}

export async function fetchPremierLeagueStandings(apiKey?: string): Promise<ApiSyncResult> {
  const cleanKey = apiKey?.trim();

  // If API key is supplied for football-data.org (Competition ID 'PL' or '2021')
  if (cleanKey && cleanKey.length >= 8) {
    const endpoints = [
      'https://api.football-data.org/v4/competitions/PL/standings',
      'https://api.football-data.org/v4/competitions/2021/standings',
    ];

    let lastErrorMessage = '';

    for (const url of endpoints) {
      try {
        // Attempt 1: Direct fetch with official X-Auth-Token header
        let response: Response;
        try {
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'X-Auth-Token': cleanKey,
            },
          });
        } catch (corsErr: any) {
          // If browser CORS prevents direct request, try CORS proxy fallback
          const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'X-Auth-Token': cleanKey,
            },
          });
        }

        if (response.status === 403) {
          throw new Error('HTTP 403 Forbidden: Invalid API token or token not yet activated (takes ~5-10 mins after sign-up).');
        }

        if (response.status === 429) {
          throw new Error('HTTP 429: football-data.org rate limit reached (max 10 calls/minute on free tier).');
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} (${response.statusText || 'Error'})`);
        }

        const data = await response.json();
        const standingsData = data.standings?.[0]?.table;

        if (Array.isArray(standingsData) && standingsData.length >= 18) {
          const standings: LivePlStanding[] = standingsData.map((item: any) => {
            const teamName = item.team?.name || '';
            const tla = item.team?.tla || '';
            const matched = PREMIER_LEAGUE_TEAMS_2026_27.find(
              t => t.code === tla || t.name.toLowerCase() === teamName.toLowerCase() || teamName.toLowerCase().includes(t.shortName.toLowerCase())
            );

            return {
              position: item.position,
              teamId: matched ? matched.id : tla?.toLowerCase() || item.team?.id?.toString() || `team_${item.position}`,
              teamName: matched ? matched.name : teamName,
              played: item.playedGames ?? 0,
              won: item.won ?? 0,
              drawn: item.draw ?? 0,
              lost: item.lost ?? 0,
              goalsFor: item.goalsFor ?? 0,
              goalsAgainst: item.goalsAgainst ?? 0,
              goalDifference: item.goalDifference ?? 0,
              points: item.points ?? 0,
              form: item.form ? (typeof item.form === 'string' ? item.form.split(',') : item.form) : [],
            };
          });

          return {
            success: true,
            message: `Successfully validated API token & synchronized ${standings.length} Premier League club standings from football-data.org!`,
            standings,
            timestamp: new Date().toISOString(),
            source: 'live_football_data_api',
          };
        }
      } catch (err: any) {
        lastErrorMessage = err.message || 'Unknown network error';
      }
    }

    console.warn('Live API fetch failed, retaining clean table:', lastErrorMessage);
    return {
      success: false,
      message: `football-data.org notice: ${lastErrorMessage}. Retained pre-season standings.`,
      standings: getZeroStandings(),
      timestamp: new Date().toISOString(),
      source: 'simulated_engine',
    };
  }

  // Clean pre-season zero table when no API key configured
  return {
    success: true,
    message: 'Standings initialized for Premier League 2026/27 Pre-Season (0 games played).',
    standings: getZeroStandings(),
    timestamp: new Date().toISOString(),
    source: 'simulated_engine',
  };
}
