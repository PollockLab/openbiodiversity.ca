import { CaseStudy, LeaderboardEntry } from '../types';

export const btgCaseStudies: CaseStudy[] = [
  {
    id: 'general',
    title: 'General Gap Map',
    description: 'Our primary guiding tool highlighting national data gaps. Explore Canada-wide density of biodiversity records overlaid on trails and roads.',
    background: 'Despite millions of records on iNaturalist, observations are concentrated heavily along roads, parks, and major cities. Over 90% of Canada\'s vast natural ecosystems remain virtually unsurveyed.',
    guidance: 'Zoom in to find the areas near you that have the least observation density. Plan your hiking or paddling routes through these regions to maximize your scientific contribution.',
    metrics: {
      explorer: 'Calculates points based on visiting squares with 0 historical records. Every empty grid cell you observations-fill becomes your conquered territory!',
      taxonomic: 'Gives special bonuses for submitting files of under-surveyed taxa (fungi, bryophytes, non-flying insects) in those grid cells.',
      voi: 'Standardised indicator combining SDM prediction uncertainty and biodiversity density, prioritizing regions where models are most confused.'
    },
    metricsGoal: {
      target: '150,000 Records',
      current: '88,400 Records',
      progress: 58.9
    }
  },
  {
    id: 'kbas',
    title: 'Key Biodiversity Areas (KBAs)',
    description: 'View KBA boundaries across the country as well as candidate areas to become KBAs ("MayBAs").',
    background: 'Key Biodiversity Areas are sites of global importance for preserving species and habitats. However, many candidate KBAs lack the data required to achieve official designation.',
    guidance: 'Focus your iNaturalist sampling in areas and species groups inside KBA and MayBA boundaries with low record density. In May/June (the peak of spring nesting and bloom), participate in the MayBA blitz to capture early-season ephemeral plant occurrences.',
    metrics: {
      explorer: 'Fills physical grid cells inside priority candidate KBAs. Complete full coverage of the candidate polygon.',
      taxonomic: 'Targets triggering species (the rare species that justify the KBA). Finding a triggering species doubles your entire expedition score!',
      voi: 'Value of Information prioritizes sites undergoing active conservation assessments, focusing on threatened status criteria.'
    },
    metricsGoal: {
      target: '45,000 Records',
      current: '31,200 Records',
      progress: 69.3
    },
    featuredRegions: ['Fraser River Peak, BC', 'Grasslands East, SK', 'Avalon Peninsula, NL', 'Algonquin Wildlands, ON']
  },
  {
    id: 'bc-parks',
    title: 'British Columbia Parks Case Study',
    description: 'Sophisticated spatial evaluation mapping species gaps across BC\'s extensive Provincial Parks, Ecological Reserves, and Conservancies.',
    background: 'BC Parks manage over 14% of the province, yet deep interior valleys and remote alpine peaks remain complete data black boxes. Managing these parks requires understanding what lives there.',
    guidance: 'Filter the map by park categories (Ecological Reserves often have zero registered records!). Coordinate with local park associations to survey hiking trail margins and remote campsites.',
    metrics: {
      explorer: 'Completing checklists across remote trail sub-segments. Grid cell occupancy points are weighted by regional isolate score.',
      taxonomic: 'Specifically targets BC endemic species and invasive species of primary park concern.',
      voi: 'Expected Richness Delta: Prioritizes grid cells with a high predicted species count but 0 actual observations.'
    },
    metricsGoal: {
      target: '80,000 Records',
      current: '42,500 Records',
      progress: 53.1
    },
    featuredRegions: ['Garibaldi Provincial Park', 'Tatshenshini-Alsek Park', 'Khutzeymateen Conservancy', 'Spatsizi Plateau Wilderness']
  },
  {
    id: 'newfoundland',
    title: 'Newfoundland Case Study',
    description: 'Simple and direct guidance for Newfoundland & Labrador community groups looking to fill local biodiversity knowledge gaps.',
    background: 'Newfoundland\'s rugged coastline and peatlands house distinct sub-species and boreal ecosystems. The Newfoundland natural history community has requested simple, highly-targeted direction on where to direct field trips.',
    guidance: 'This map mirrors the national data density layers but focuses purely on the Island. Check out the Avalon, Central peatlands, and Northern Peninsula sectors for key accessibility gaps with zero historical records.',
    metrics: {
      explorer: 'Standard coverage metric to expand community science reporting beyond St. John\'s and corner brook highway buffers.',
      taxonomic: 'Focuses on critical boreal mosses, lichens, and native vascular flora.',
      voi: 'Blends basic observation density and uncertainty maps for local conservation action plan reporting.'
    },
    metricsGoal: {
      target: '20,000 Records',
      current: '6,400 Records',
      progress: 32.0
    },
    featuredRegions: ['Gros Morne Perimeter', 'Bonavista Coastal Gaps', 'Swayze Barrens Candidate KBA', 'Burin Peninsula Peatlands']
  }
];

export const btgLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'boreal_explorer_26', observations: 1420, species: 342, explorerScore: 92, taxonomicScore: 84, voiScore: 88, primaryTaxon: 'Fungi' },
  { rank: 2, username: 'conservation_al', observations: 1105, species: 215, explorerScore: 85, taxonomicScore: 71, voiScore: 94, primaryTaxon: 'Plants' },
  { rank: 3, username: 'salish_shepherd', observations: 945, species: 198, explorerScore: 79, taxonomicScore: 78, voiScore: 81, primaryTaxon: 'Insects' },
  { rank: 4, username: 'inat_maritime', observations: 830, species: 124, explorerScore: 82, taxonomicScore: 60, voiScore: 75, primaryTaxon: 'Birds' },
  { rank: 5, username: 'lichen_lover_nl', observations: 712, species: 189, explorerScore: 61, taxonomicScore: 95, voiScore: 86, primaryTaxon: 'Lichens' },
  { rank: 6, username: 'rocky_mtn_high', observations: 650, species: 112, explorerScore: 74, taxonomicScore: 65, voiScore: 80, primaryTaxon: 'Amphibians' },
  { rank: 7, username: 'prairie_hawk', observations: 590, species: 94, explorerScore: 70, taxonomicScore: 58, voiScore: 69, primaryTaxon: 'Birds' }
];

export const staticBtg2025Milestone = {
  uniqueEmptyCellsConquered: '50,000 km²',
  speciesWithFirstObservation: '551',
  speciesReaching100Observations: '589',
  impactBrief: 'During Blitz the Gap 2025, naturalists across the country filled data gaps in over 50,000 1km grid cells that had never recorded a single species on iNaturalist, improving our ability to model Canada\'s species.' 
};
