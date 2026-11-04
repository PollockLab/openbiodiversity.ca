import { SDMModel } from '../types';

type ManifestRow = { slug: string; sci: string; common?: string; fr?: string; class: string; status?: string };

// Manifest (public/sdm-species.json) is the source of truth; these only add French names and habitat text
const overrides: Record<string, Partial<Pick<SDMModel, 'commonName' | 'commonNameFr' | 'habitatType' | 'habitatTypeFr'>>> = {
  'rangifer-tarandus': { commonName: 'Caribou', commonNameFr: 'Caribou', habitatType: 'Mature Coniferous Forest & Peatlands', habitatTypeFr: 'Forêt de conifères matures et tourbières' },
  'gulo-gulo': { commonNameFr: 'Carcajou', habitatType: 'Alpine Tundra & Boreal Wilderness', habitatTypeFr: 'Toundra alpine et région sauvage boréale' },
  'lynx-canadensis': { commonNameFr: 'Lynx du Canada', habitatType: 'Dense Boreal Shrublands', habitatTypeFr: 'Arbustes boréaux denses' },
  'ursus-arctos': { commonNameFr: 'Ours brun', habitatType: 'Subalpine Meadow, Shrublands & Riparian', habitatTypeFr: 'Prairies subalpines, arbustes et zones riveraines' },
  'martes-americana': { commonNameFr: "Martre d'Amérique", habitatType: 'Old-Growth Conifer Canopy', habitatTypeFr: 'Canopée de conifères anciens' },
  'cardellina-canadensis': { commonNameFr: 'Paruline du Canada', habitatType: 'Wet Mixed Deciduous/Coniferous Forest', habitatTypeFr: 'Forêt mixte humide de feuillus et de conifères' },
  'contopus-cooperi': { commonNameFr: 'Moucherolle à côtés olive', habitatType: 'Boreal Edge, Burns, and Wetland Openings', habitatTypeFr: 'Lisière boréale, brûlis et clairières humides' },
  'strix-occidentalis': { commonNameFr: 'Chouette tachetée', habitatType: 'Coastal Old-Growth Rain Forest', habitatTypeFr: 'Forêt pluviale côtière ancienne' },
  'poecile-hudsonicus': { commonNameFr: 'Mésange à tête brune', habitatType: 'Coniferous Forests', habitatTypeFr: 'Forêts de conifères' },
  'thamnophis-sirtalis': { commonNameFr: 'Couleuvre rayée', habitatType: 'Grasslands, Marsh Margins & Limestone Dens', habitatTypeFr: 'Prairies, bordures de marais et tanières de calcaire' },
  'lithobates-sylvaticus': { commonNameFr: 'Grenouille des bois', habitatType: 'Moist Woodlands & Vernal Breeding Pools', habitatTypeFr: 'Boisés humides et étangs vernaux de reproduction' },
  'pseudacris-maculata': { commonNameFr: 'Rainette faux-grillon boréale', habitatType: 'Shrubby Wetlands & Tallgrass Prairie', habitatTypeFr: 'Milieux humides arbustifs et prairie à chiendent' }
};

const TAXON: Record<string, SDMModel['taxonGroup']> = { Birds: 'Bird', Mammals: 'Mammal', Reptiles: 'Reptile', Amphibians: 'Amphibian' };

export async function loadSdmSpecies(): Promise<SDMModel[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}sdm-species.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows: ManifestRow[] = await res.json();
  return rows.map(r => ({
    id: r.slug,
    ecccSlug: r.slug,
    scientificName: r.sci,
    commonName: r.common ?? r.sci,
    commonNameFr: r.fr,
    taxonGroup: TAXON[r.class],
    iucnStatus: r.status,
    ...overrides[r.slug],
  }));
}
