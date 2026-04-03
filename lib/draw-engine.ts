// Draw Engine - handles both random and algorithmic draw logic

export interface DrawResult {
  winningNumbers: number[];
  method: 'random' | 'algorithmic';
}

/**
 * Generate 5 winning numbers using random lottery-style generation
 * Numbers are in range 1-45 (Stableford score range)
 */
export function generateRandomDraw(): DrawResult {
  const numbers: number[] = [];
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return {
    winningNumbers: numbers.sort((a, b) => a - b),
    method: 'random',
  };
}

/**
 * Generate winning numbers algorithmically based on user score frequency
 * Uses a weighted approach: more common scores have higher probability
 */
export function generateAlgorithmicDraw(
  allScores: number[],
  mode: 'most-frequent' | 'least-frequent' = 'most-frequent'
): DrawResult {
  if (allScores.length === 0) {
    return generateRandomDraw();
  }

  // Count frequency of each score
  const frequency: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) frequency[i] = 0;
  allScores.forEach(score => {
    if (score >= 1 && score <= 45) frequency[score]++;
  });

  // Build weighted pool
  const pool: number[] = [];
  Object.entries(frequency).forEach(([score, count]) => {
    const scoreNum = parseInt(score);
    const weight = mode === 'most-frequent'
      ? Math.max(1, count * 3) + 1  // More frequent = more weight
      : Math.max(1, 10 - count) + 1; // Less frequent = more weight
    for (let i = 0; i < weight; i++) {
      pool.push(scoreNum);
    }
  });

  // Draw 5 unique numbers from weighted pool
  const numbers: number[] = [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  
  for (const num of shuffled) {
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
    if (numbers.length === 5) break;
  }

  // Fill remaining with random if needed
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) numbers.push(num);
  }

  return {
    winningNumbers: numbers.sort((a, b) => a - b),
    method: 'algorithmic',
  };
}

/**
 * Check a user's scores against the winning numbers
 * Returns the match type or null if no match
 */
export function checkMatch(
  userScores: number[],
  winningNumbers: number[]
): { type: '5-match' | '4-match' | '3-match' | null; matched: number[] } {
  const matched = userScores.filter(score => winningNumbers.includes(score));
  const uniqueMatched = Array.from(new Set(matched));

  if (uniqueMatched.length >= 5) {
    return { type: '5-match', matched: uniqueMatched.slice(0, 5) };
  } else if (uniqueMatched.length === 4) {
    return { type: '4-match', matched: uniqueMatched };
  } else if (uniqueMatched.length === 3) {
    return { type: '3-match', matched: uniqueMatched };
  }
  return { type: null, matched: [] };
}

/**
 * Calculate prize pool distribution
 */
export function calculatePrizePools(
  totalPool: number,
  carriedOverJackpot: number = 0
): {
  pool5: number;
  pool4: number;
  pool3: number;
  jackpotWithCarryover: number;
} {
  const pool5 = Math.round(totalPool * 0.40 * 100) / 100;
  const pool4 = Math.round(totalPool * 0.35 * 100) / 100;
  const pool3 = Math.round(totalPool * 0.25 * 100) / 100;

  return {
    pool5: pool5 + carriedOverJackpot,
    pool4,
    pool3,
    jackpotWithCarryover: pool5 + carriedOverJackpot,
  };
}

/**
 * Calculate individual prize amount (split among winners)
 */
export function calculateIndividualPrize(
  poolAmount: number,
  winnerCount: number
): number {
  if (winnerCount === 0) return 0;
  return Math.round((poolAmount / winnerCount) * 100) / 100;
}

/**
 * Simulate a draw without committing - for admin preview
 */
export function simulateDraw(
  allScores: number[],
  logicType: 'random' | 'algorithmic',
  entries: Array<{ userId: string; scores: number[] }>
) {
  const drawResult = logicType === 'algorithmic'
    ? generateAlgorithmicDraw(allScores)
    : generateRandomDraw();

  const results = entries.map(entry => {
    const { type, matched } = checkMatch(entry.scores, drawResult.winningNumbers);
    return {
      userId: entry.userId,
      matchType: type,
      matched,
    };
  }).filter(r => r.matchType !== null);

  const fiveMatches = results.filter(r => r.matchType === '5-match').length;
  const fourMatches = results.filter(r => r.matchType === '4-match').length;
  const threeMatches = results.filter(r => r.matchType === '3-match').length;

  return {
    winningNumbers: drawResult.winningNumbers,
    method: drawResult.method,
    results,
    summary: { fiveMatches, fourMatches, threeMatches },
  };
}
