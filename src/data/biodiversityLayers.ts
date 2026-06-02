import { BiodiversityLayer } from '../types';

export const usefulLayersCanada: BiodiversityLayer[] = [
  {
    id: 'layer-1',
    name: 'Canadian Human Footprint Index (HFI)',
    category: 'Human Footprint',
    description: 'A composite index mapping cumulative human pressures on land. Combines linear features (roads, railways), land cover conversion, night-time lights, and population density at 100m resolution.',
    significance: 'Critical for structural connectivity analysis, identifying potential corridors, and setting baseline intactness for biodiversity conservation planning.',
    resolution: '100m raster',
    coverage: 'Terrestrial Canada',
    format: 'GeoTIFF / Cloud-Optimized GeoTIFF (COG)'
  },
  {
    id: 'layer-2',
    name: 'Vertebrate Species Richness (Ensemble SDMs)',
    category: 'Conservation',
    description: 'Expected species richness layer created by stacking individual species distribution models for over 500 terrestrial vertebrates (mammals, birds, reptiles, amphibians) across Canada.',
    significance: 'Provides a robust multi-taxa view of biodiversity hotspots, enabling the detection of areas of high conservation value.',
    resolution: '1km raster',
    coverage: 'Terrestrial Canada',
    format: 'GeoTIFF'
  },
  {
    id: 'layer-3',
    name: 'Future Climate Velocity (RCP 8.5, 2050s)',
    category: 'Climate',
    description: 'Calculates the speed and direction that a species would need to migrate to maintain its current temperature and precipitation niches under rapid climate change projections.',
    significance: 'Establishes climate refugia candidates: areas where climate change is slowest and species have the highest likelihood of surviving in situ.',
    resolution: '1km raster',
    coverage: 'National',
    format: 'GeoTIFF'
  },
  {
    id: 'layer-4',
    name: 'Key Biodiversity Areas (KBAs) & Candidate Sites',
    category: 'Conservation',
    description: 'Polygons of areas contributing significantly to the global persistence of biodiversity, including rare/threatened species, ecosystems, and ecological integrity.',
    significance: 'Used directly to coordinate expansion of Canada’s protected area network towards the 30x30 target (30% protected by 2030).',
    resolution: 'Vector Polygons',
    coverage: 'National coverage',
    format: 'Shapefile / GeoJSON'
  },
  {
    id: 'layer-5',
    name: 'Soil Organic Carbon Stocks (Top 1m)',
    category: 'Climate',
    description: 'High-resolution inventory of organic carbon stored in the top 1 meter of soil, integrating peatlands, wetlands, and boreal forest soils across Canadian ecoregions.',
    significance: 'Essential for co-benefit analysis (selecting biodiversity priorities that also maximize carbon sequestration, avoiding peatland disruption).',
    resolution: '250m raster',
    coverage: 'National',
    format: 'GeoTIFF'
  },
  {
    id: 'layer-6',
    name: 'Protected and Conserved Areas Database (CPCAD)',
    category: 'Conservation',
    description: 'Up-to-date spatial database compiling federal, provincial, territorial, and indigenous-led protected areas (OECMs, Parks, Ecological Reserves).',
    significance: 'Serves as the baseline layer to calculate gaps in ecosystem representation and identify unprotected KBAs.',
    resolution: 'Vector Polygons',
    coverage: 'National (Terrestrial + Marine)',
    format: 'Feature Layer / GeoPackage'
  },
  {
    id: 'layer-7',
    name: 'Boreal Intact Forest Landscapes (IFL)',
    category: 'Habitat',
    description: 'Identifies contiguous blocks of forest and associated natural habitats showing no signs of significant human disruption, with a minimum size of 500 km².',
    significance: 'Indicates pristine wilderness areas crucial for wide-ranging wilderness species like woodland caribou and wolverine.',
    resolution: '30m raster',
    coverage: 'Boreal and Taiga zones',
    format: 'GeoTIFF'
  },
  {
    id: 'layer-8',
    name: 'Global Forest Canopy Height (GEDI-Informed Canada)',
    category: 'Habitat',
    description: 'High-precision vegetation canopy heights derived from spaceborne LiDAR (GEDI) and fused with Sentinel-2 and Landsat multispectral imagery.',
    significance: 'Enables fine-resolution micro-habitat structural complexity measurements, which acts as a key predictor for forest-dwelling birds and insects.',
    resolution: '30m raster',
    coverage: 'All forested zones',
    format: 'Cloud-Optimized GeoTIFF'
  },
  {
    id: 'layer-9',
    name: 'Linear Disturbance Density Network',
    category: 'Human Footprint',
    description: 'Detailed vector density mapping covering pipelines, powerlines, seismic exploration lines, forest trails, and remote access roads.',
    significance: 'Determines edge effect thresholds and predatory risk zones (e.g. gray wolf travel efficiency along linear corridors impacting caribou).',
    resolution: '1km grid density',
    coverage: 'Boreal & Temperate',
    format: 'GeoTIFF / ESRI Grid'
  },
  {
    id: 'layer-10',
    name: 'Hydrological Flow Integrity Index',
    category: 'Habitat',
    description: 'Models the intactness of surface water flows, major rivers, and headwater catchments, factoring in dam locations, culverts, and reservoir structures.',
    significance: 'Fundamental for assessing freshwater species hotspots and identifying aquatic corridors for fish migrations.',
    resolution: 'Vector Catchments',
    coverage: 'National',
    format: 'Shapefile / Geodatabase'
  }
];
