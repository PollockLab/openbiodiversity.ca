import { CaseStudy, LeaderboardEntry } from '../types';

export const btgCaseStudies: CaseStudy[] = [
  {
    id: 'general',
    title: 'General Gap Map',
    titleFr: 'Carte générale des lacunes',
    description: 'Our primary guiding tool highlighting national data gaps. Explore Canada-wide density of biodiversity records overlaid on trails and roads.',
    descriptionFr: "Notre outil principal de guidage mettant en évidence les lacunes de données nationales. Explorez la densité des enregistrements de biodiversité à l'échelle du Canada superposée aux sentiers et aux routes.",
    background: 'Despite millions of records on iNaturalist, observations are concentrated heavily along roads, parks, and major cities. Over 90% of Canada\'s vast natural ecosystems remain virtually unsurveyed.',
    backgroundFr: "Malgré des millions d'observations sur iNaturalist, les observations sont fortement concentrées le long des routes, des parcs et des grandes villes. Plus de 90 % des vastes écosystèmes naturels du Canada restent pratiquement inexplorés.",
    guidance: 'Zoom in to find the areas near you that have the least observation density. Plan your hiking or paddling routes through these regions to maximize your scientific contribution.',
    guidanceFr: "Faites un zoom avant pour trouver les zones près de chez vous qui ont la plus faible densité d'observations. Planifiez vos itinéraires de randonnée ou de canot à travers ces régions pour maximiser votre contribution scientifique.",
    metrics: {
      explorer: 'Calculates points based on visiting squares with 0 historical records. Every empty grid cell you observations-fill becomes your conquered territory!',
      taxonomic: 'Gives special bonuses for submitting files of under-surveyed taxa (fungi, bryophytes, non-flying insects) in those grid cells.',
      voi: 'Standardised indicator combining SDM prediction uncertainty and biodiversity density, prioritizing regions where models are most confused.'
    },
    metricsFr: {
      explorer: "Calcule des points en fonction de la visite de carrés comportant 0 historique d'observations. Chaque cellule vide que vous observez devient votre territoire conquis !",
      taxonomic: "Donne des bonus spéciaux pour la soumission d'espèces de taxons sous-étudiés (champignons, bryophytes, insectes non volants) dans ces cellules.",
      voi: "Indicateur normalisé combinant l'incertitude des prédictions des MDE et la densité de biodiversité, priorisant les régions où les modèles sont les plus confus."
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
    titleFr: 'Zones clés pour la biodiversité (KBA)',
    description: 'View KBA boundaries across the country as well as candidate areas to become KBAs ("MayBAs").',
    descriptionFr: 'Visualisez les limites des KBA à travers le pays ainsi que les zones candidates pour devenir des KBA ("MayBA").',
    background: 'Key Biodiversity Areas are sites of global importance for preserving species and habitats. However, many candidate KBAs lack the data required to achieve official designation.',
    backgroundFr: "Les zones clés pour la biodiversité sont des sites d'importance mondiale pour la préservation des espèces et des habitats. Cependant, de nombreuses KBA candidates manquent de données pour obtenir une désignation officielle.",
    guidance: 'Focus your iNaturalist sampling in areas and species groups inside KBA and MayBA boundaries with low record density. In May/June (the peak of spring nesting and bloom), participate in the MayBA blitz to capture early-season ephemeral plant occurrences.',
    guidanceFr: "Concentrez vos échantillonnages iNaturalist sur les zones et les groupes d'espèces situés à l'intérieur des limites des KBA et MayBA ayant une faible densité d'observations. En mai et juin (le pic de nidification et de floraison printanière), participez au bioblitz MayBA pour capturer les plantes éphémères de début de saison.",
    metrics: {
      explorer: 'Fills physical grid cells inside priority candidate KBAs. Complete full coverage of the candidate polygon.',
      taxonomic: 'Targets triggering species (the rare species that justify the KBA). Finding a triggering species doubles your entire expedition score!',
      voi: 'Value of Information prioritizes sites undergoing active conservation assessments, focusing on threatened status criteria.'
    },
    metricsFr: {
      explorer: "Remplit les cellules physiques de la grille à l'intérieur des KBA candidates prioritaires. Complétez la couverture complète du polygone candidat.",
      taxonomic: "Cible les espèces déclenchantes (les espèces rares qui justifient la KBA). Trouver une espèce déclenchante double votre score d'expédition !",
      voi: "La valeur de l'information priorise les sites faisant l'objet d'évaluations actives de conservation, en se concentrant sur les critères de statut menacé."
    },
    metricsGoal: {
      target: '45,000 Records',
      current: '31,200 Records',
      progress: 69.3
    },
    featuredRegions: ['Fraser River Peak, BC', 'Grasslands East, SK', 'Avalon Peninsula, NL', 'Algonquin Wildlands, ON'],
    featuredRegionsFr: ["Pic de la rivière Fraser, CB", "Prairies de l'Est, SK", "Péninsule d'Avalon, TNL", "Région sauvage d'Algonquin, ON"]
  },
  {
    id: 'bc-parks',
    title: 'British Columbia Parks Case Study',
    titleFr: 'Étude de cas sur les parcs de la Colombie-Britannique',
    description: 'Sophisticated spatial evaluation mapping species gaps across BC\'s extensive Provincial Parks, Ecological Reserves, and Conservancies.',
    descriptionFr: "Évaluation spatiale sophistiquée cartographiant les lacunes d'espèces dans les vastes parcs provinciaux, réserves écologiques et aires de conservation de la Colombie-Britannique.",
    background: 'BC Parks manage over 14% of the province, yet deep interior valleys and remote alpine peaks remain complete data black boxes. Managing these parks requires understanding what lives there.',
    backgroundFr: "Les parcs de la Colombie-Britannique gèrent plus de 14 % de la province, mais les vallées intérieures profondes et les sommets alpins reculés restent de véritables boîtes noires de données. Gérer ces parcs nécessite de comprendre ce qui y vit.",
    guidance: 'Filter the map by park categories (Ecological Reserves often have zero registered records!). Coordinate with local park associations to survey hiking trail margins and remote campsites.',
    guidanceFr: "Filtrez la carte par catégories de parcs (les réserves écologiques n'ont souvent aucun enregistrement enregistré !). Coordonnez vos efforts avec les associations de parcs locaux pour arpenter les sentiers et campings isolés.",
    metrics: {
      explorer: 'Completing checklists across remote trail sub-segments. Grid cell occupancy points are weighted by regional isolate score.',
      taxonomic: 'Specifically targets BC endemic species and invasive species of primary park concern.',
      voi: 'Expected Richness Delta: Prioritizes grid cells with a high predicted species count but 0 actual observations.'
    },
    metricsFr: {
      explorer: "Remplir des listes de contrôle sur des segments de sentiers isolés. Les points d'occupation des cellules sont pondérés par le score d'isolation régional.",
      taxonomic: "Cible spécifiquement les espèces endémiques de la Colombie-Britannique et les espèces envahissantes préoccupantes.",
      voi: "Delta de richesse attendu : priorise les cellules de la grille avec un nombre élevé d'espèces prédites mais 0 observation réelle."
    },
    metricsGoal: {
      target: '80,000 Records',
      current: '42,500 Records',
      progress: 53.1
    },
    featuredRegions: ['Garibaldi Provincial Park', 'Tatshenshini-Alsek Park', 'Khutzeymateen Conservancy', 'Spatsizi Plateau Wilderness'],
    featuredRegionsFr: ["Parc provincial Garibaldi", "Parc Tatshenshini-Alsek", "Aire de conservation Khutzeymateen", "Région sauvage du plateau Spatsizi"]
  },
  {
    id: 'newfoundland',
    title: 'Newfoundland Case Study',
    titleFr: 'Étude de cas sur Terre-Neuve',
    description: 'Simple and direct guidance for Newfoundland & Labrador community groups looking to fill local biodiversity knowledge gaps.',
    descriptionFr: "Directives simples et directes pour les groupes communautaires de Terre-Neuve-et-Labrador désireux de combler les lacunes locales en matière de connaissances sur la biodiversité.",
    background: 'Newfoundland\'s rugged coastline and peatlands house distinct sub-species and boreal ecosystems. The Newfoundland natural history community has requested simple, highly-targeted direction on where to direct field trips.',
    backgroundFr: "Le littoral accidenté et les tourbières de Terre-Neuve abritent des sous-espèces distinctes et des écosystèmes boréaux. La communauté d'histoire naturelle de Terre-Neuve a demandé des orientations ciblées sur l'emplacement des excursions sur le terrain.",
    guidance: 'This map mirrors the national data density layers but focuses purely on the Island. Check out the Avalon, Central peatlands, and Northern Peninsula sectors for key accessibility gaps with zero historical records.',
    guidanceFr: "Cette carte reproduit les couches de densité de données nationales mais se concentre uniquement sur l'île. Consultez les secteurs d'Avalon, des tourbières du Centre et de la péninsule Nord pour trouver les principales lacunes d'accès sans aucun historique d'observations.",
    metrics: {
      explorer: 'Standard coverage metric to expand community science reporting beyond St. John\'s and corner brook highway buffers.',
      taxonomic: 'Focuses on critical boreal mosses, lichens, and native vascular flora.',
      voi: 'Blends basic observation density and uncertainty maps for local conservation action plan reporting.'
    },
    metricsFr: {
      explorer: "Indicateur de couverture standard pour étendre les rapports de science communautaire au-delà des zones tampons des autoroutes de St. John's et Corner Brook.",
      taxonomic: "Se concentre sur les mousses boréales critiques, les lichens et la flore vasculaire indigène.",
      voi: "Mélange la densité d'observations de base et les cartes d'incertitude pour les rapports de plan d'action locaux."
    },
    metricsGoal: {
      target: '20,000 Records',
      current: '6,400 Records',
      progress: 32.0
    },
    featuredRegions: ['Gros Morne Perimeter', 'Bonavista Coastal Gaps', 'Swayze Barrens Candidate KBA', 'Burin Peninsula Peatlands'],
    featuredRegionsFr: ["Périmètre de Gros Morne", "Lacunes côtières de Bonavista", "KBA candidate de Swayze Barrens", "Tourbières de la péninsule de Burin"]
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
  impactBrief: 'During Blitz the Gap 2025, naturalists across the country filled data gaps in over 50,000 1km grid cells that had never recorded a single species on iNaturalist, improving our ability to model Canada\'s species.',
  impactBriefFr: "Lors de Blitz the Gap 2025, des naturalistes de tout le pays ont comblé des lacunes de données dans plus de 50 000 mailles de 1 km qui n'avaient jamais enregistré une seule espèce sur iNaturalist, améliorant ainsi notre capacité à modéliser les espèces du Canada."
};
