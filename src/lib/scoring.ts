import { ActualOutcomes, PredictionCategory, ScoreItem, UserPredictionSubmission, UserScoreBreakdown } from '../types';
import { PREMIER_LEAGUE_TEAMS_2026_27, getTeamById } from '../data/teams2026';

export function calculateSubmissionScore(
  submission: UserPredictionSubmission,
  actualOutcomes: ActualOutcomes,
  categories: PredictionCategory[]
): UserScoreBreakdown {
  const items: ScoreItem[] = [];
  let tablePoints = 0;
  let exactTableCount = 0;
  let oneOffTableCount = 0;

  // 1. Calculate 1-20 League Table points
  if (submission.tablePrediction && submission.tablePrediction.length > 0) {
    submission.tablePrediction.forEach((predictedTeamId, index) => {
      const predictedPosition = index + 1;
      const actualIndex = actualOutcomes.tableStandings.indexOf(predictedTeamId);
      const actualPosition = actualIndex !== -1 ? actualIndex + 1 : -1;
      
      const team = getTeamById(predictedTeamId);
      const teamName = team ? team.name : predictedTeamId;
      const actualTeamAtThisPos = actualOutcomes.tableStandings[index] ? getTeamById(actualOutcomes.tableStandings[index])?.name : 'TBD';

      if (actualPosition === -1) {
        items.push({
          type: 'table',
          label: `${predictedPosition}${getOrdinal(predictedPosition)} Place`,
          predicted: teamName,
          actual: `Position TBD`,
          points: 0,
          reason: 'miss',
        });
        return;
      }

      const diff = Math.abs(predictedPosition - actualPosition);
      let pts = 0;
      let reason: 'exact' | 'one_off' | 'miss' = 'miss';

      if (diff === 0) {
        pts = 3;
        reason = 'exact';
        exactTableCount++;
      } else if (diff === 1) {
        pts = 1;
        reason = 'one_off';
        oneOffTableCount++;
      }

      tablePoints += pts;

      items.push({
        type: 'table',
        label: `${predictedPosition}${getOrdinal(predictedPosition)} Place Prediction`,
        predicted: `${teamName} (Pred: ${predictedPosition}${getOrdinal(predictedPosition)})`,
        actual: `Finished ${actualPosition}${getOrdinal(actualPosition)} (Actual at #${predictedPosition}: ${actualTeamAtThisPos})`,
        points: pts,
        reason,
      });
    });
  }

  // 2. Calculate Bespoke Category points (3 points per correct prediction)
  let bespokePoints = 0;
  let exactBespokeCount = 0;

  categories.forEach(cat => {
    const predictedVal = submission.bespokePredictions?.[cat.id] || 'Not Selected';
    const actualVal = actualOutcomes.bespokeResults?.[cat.id];
    const isResolved = Boolean(
      actualVal &&
      typeof actualVal === 'string' &&
      actualVal.trim() !== '' &&
      !actualVal.toLowerCase().includes('pending') &&
      !actualVal.toLowerCase().includes('tbd')
    );

    let pts = 0;
    let reason: 'exact' | 'one_off' | 'miss' = 'miss';

    if (isResolved && actualVal && predictedVal !== 'Not Selected') {
      const isMatch = normalizeAnswer(predictedVal) === normalizeAnswer(actualVal);
      if (isMatch) {
        pts = cat.pointsValue || 3;
        reason = 'exact';
        exactBespokeCount++;
        bespokePoints += pts;
      }
    }

    items.push({
      type: 'bespoke',
      label: cat.title,
      predicted: predictedVal,
      actual: isResolved ? actualVal! : 'Pending Season Conclusion',
      points: pts,
      reason: isResolved ? reason : 'miss',
    });
  });

  const totalPoints = tablePoints + bespokePoints;

  return {
    submissionId: submission.id,
    userId: submission.userId,
    userName: submission.userName,
    teamName: submission.teamName,
    totalPoints,
    tablePoints,
    bespokePoints,
    exactTableCount,
    oneOffTableCount,
    exactBespokeCount,
    rank: 1,
    items,
  };
}

export function rankAllSubmissions(
  submissions: UserPredictionSubmission[],
  actualOutcomes: ActualOutcomes,
  categories: PredictionCategory[],
  leagueIdFilter?: string
): UserScoreBreakdown[] {
  const filtered = leagueIdFilter && leagueIdFilter !== 'global'
    ? submissions.filter(s => s.leagueIds?.includes(leagueIdFilter))
    : submissions;

  const scored = filtered.map(s => calculateSubmissionScore(s, actualOutcomes, categories));

  // Sort primarily by total points (descending), then exactTableCount (descending), then exactBespokeCount (descending)
  scored.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.exactTableCount !== a.exactTableCount) {
      return b.exactTableCount - a.exactTableCount;
    }
    if (b.oneOffTableCount !== a.oneOffTableCount) {
      return b.oneOffTableCount - a.oneOffTableCount;
    }
    return b.exactBespokeCount - a.exactBespokeCount;
  });

  // Assign ranks with tied rank handling
  let currentRank = 1;
  return scored.map((item, index, array) => {
    if (index > 0 && item.totalPoints < array[index - 1].totalPoints) {
      currentRank = index + 1;
    }
    return {
      ...item,
      rank: currentRank,
    };
  });
}

function normalizeAnswer(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
