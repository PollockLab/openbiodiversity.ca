/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BiodiversityLayer {
  id: string;
  name: string;
  category: 'Conservation' | 'Climate' | 'Habitat' | 'Human Footprint';
  description: string;
  significance: string;
  source: string;
  resolution: string;
  coverage: string;
  format: string;
}

export interface SDMModel {
  id: string;
  scientificName: string;
  commonName: string;
  taxonGroup: 'Mammal' | 'Bird' | 'Reptile' | 'Amphibian' | 'Butterfly' | 'Tree' | 'Plant';
  iucnStatus: string;
  resolution: string;
  clippedBy: 'IUCN Range' | "Noah's Method" | 'KBA Boundary';
  habitatType: string;
  biasCorrectedAvailable: boolean;
  nonBiasCorrectedAvailable: boolean;
  uncertaintyAvailable: boolean;
}

export type ChallengeMetricType = 'Explorer' | 'Taxonomic' | 'VOI';

export interface CaseStudy {
  id: 'general' | 'kbas' | 'bc-parks' | 'newfoundland';
  title: string;
  description: string;
  background: string;
  guidance: string;
  metrics: {
    explorer: string;
    taxonomic: string;
    voi: string;
  };
  metricsGoal: {
    target: string;
    current: string;
    progress: number; // 0 to 100
  };
  featuredRegions?: string[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  observations: number;
  species: number;
  explorerScore: number; // 0-100% gap coverage
  taxonomicScore: number; // unique species multiplier
  voiScore: number; // Value of Information index
  primaryTaxon: string;
}
