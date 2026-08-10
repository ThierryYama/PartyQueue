export const RANKING_VERSION = 'v1.0.0';

export type RankingWeights = {
  ownership: number;
  groupSize: number;
  genre: number;
  mode: number;
  sessionLength: number;
  novelty: number;
  metadataConfidence: number;
};

export const rankingV1 = {
  version: RANKING_VERSION,
  weights: {
    ownership: 0.3,
    groupSize: 0.2,
    genre: 0.15,
    mode: 0.1,
    sessionLength: 0.1,
    novelty: 0.1,
    metadataConfidence: 0.05,
  },
} as const satisfies { version: string; weights: RankingWeights };
