import { BiodiversityLayer } from '../types';

export const usefulLayersCanada: BiodiversityLayer[] = [
  {
    id: 'layer-1',
    name: 'Human Footprint Index',
    category: 'Human Footprint',
    description: 'A composite index mapping cumulative human pressures on land. Combines these twelve anthropogenic pressures into one index: built environments, crop land, pasture land, human population density, nighttime lights, railways, roads, navigable waterways, dams and associated reservoirs, mining activity, oil and gas, and forestry.',
    significance: 'Critical for structural connectivity analysis, identifying potential corridors, and setting baseline intactness for biodiversity conservation planning.',
    source: 'Hirsh-Pearson, K., Johnson, C. J., Schuster, R., Wheate, R. D., & Venter, O. (2022). Canada’s human footprint reveals large intact areas juxtaposed against areas under immense anthropogenic pressure. FACETS, 7, 398‑419. https://doi.org/10.1139/facets-2021-0063',
    resolution: '100m raster',
    coverage: 'Terrestrial Canada',
    format: 'GeoTIFF / Cloud-Optimized GeoTIFF (COG)'
  },
  {
    id: 'layer-2',
    name: 'Biodiversity',
    category: 'Conservation',
    description: 'Expected species richness layer created by stacking individual species distribution models over hundreds of terrestrial vertebrates (mammals, birds, reptiles, amphibians) across Canada.',
    significance: 'Provides a robust multi-taxa view of terrestrial vertebrate biodiversity hotspots, enabling the detection of areas of high conservation value.',
    source: 'Laura and Noah',
    resolution: '1km raster',
    coverage: 'Terrestrial Canada',
    format: 'GeoTIFF'
  },
  {
    id: 'layer-3',
    name: 'Carbon',
    category: 'Climate',
    description: 'Plant and soil organic carbon stocks.',
    significance: 'Canada\'s vast forests and peatlands store massive amounts of carbon which reduce atmospheric CO2 levels, mitigating climate change.',
    source: 'potentially: Sothe, C., Gonsamo, A., Arabian, J., Kurz, W. A., Finkelstein, S. A., & Snider, J. (2022). Large Soil Carbon Storage in Terrestrial Ecosystems of Canada. Global Biogeochemical Cycles, 36(2), e2021GB007213. https://doi.org/10.1029/2021GB007213',
    resolution: '1km raster',
    coverage: 'National',
    format: 'GeoTIFF'
  },
  {
    id: 'layer-4',
    name: 'Key Biodiversity Areas (KBAs)',
    category: 'Conservation',
    description: 'Polygons of areas contributing significantly to the global persistence of biodiversity, including rare/threatened species, threatened ecosystems, and ecological integrity.',
    significance: 'Used as a reference to inform the additions to Canada’s protected area network, helping Canada realize its 30x30 commitment (30% protected by 2030).',
    source: 'https://kbacanada.org/explore/map-viewer/',
    resolution: 'Vector Polygons',
    coverage: 'National coverage',
    format: 'Shapefile / GeoJSON'
  },
  {
    id: 'layer-5',
    name: 'Connectivity',
    category: 'Climate',
    description: 'Estimate of movement probability at a 300m resolution using an omnidirectional circuitscape density analysis.',
    significance: 'Habitat fragmentation is a major driver of species extinction, making habitat connectivity essential in preventing biodiversity collapse.',
    source: 'Pither, R., O’Brien, P., Brennan, A., Hirsh-Pearson, K., & Bowman, J. (2023). Predicting areas important for ecological connectivity throughout Canada. PLOS ONE, 18(2), e0281980. https://doi.org/10.1371/journal.pone.0281980',
    resolution: '250m raster',
    coverage: 'National',
    format: 'GeoTIFF'
  },
  {
    id: 'layer-6',
    name: 'Land Cover',
    category: 'Conservation',
    description: '30m resolution categorization of Canada land into nineteen classes describing what physically covers the country\'s surface.',
    significance: 'These broad categories of ecosystems and human impacts on land can show natural areas worth protecting and the extent of degraded areas.',
    source: 'Commission for Environmental Cooperation (CEC). 2024. "North American Environmental Atlas - Land Cover 2020 30m". North American Land Change Monitoring System. Canada Centre for Remote Sensing (CCRS), U.S. Geological Survey (USGS), Comisión Nacional para el Conocimiento y Uso de la Biodiversidad (CONABIO), Comisión Nacional Forestal (CONAFOR), Instituto Nacional de Estadística y Geografía (INEGI). Ed. 2.0, Raster digital data [30-m]. Available at https://www.cec.org/north-american-environmental-atlas/land-cover-30m-2020/',
    resolution: 'Vector Polygons',
    coverage: 'National (Terrestrial + Marine)',
    format: 'Feature Layer / GeoPackage'
  },
  {
    id: 'layer-7',
    name: 'Land Tenure and Protection',
    category: 'Habitat',
    description: 'Compilation of land tenure data across the country including federal, provincial, territorial, and indigenous-led protected areas.',
    significance: 'Tenure determines what protection mechanisms are already in place and who must be engaged to achieve further protection.',
    source: 'to be made',
    resolution: '30m raster',
    coverage: 'Boreal and Taiga zones',
    format: 'GeoTIFF'
  },
  {
    id: 'layer-8',
    name: 'Threats',
    category: 'Habitat',
    description: 'tbd.',
    significance: 'tbd',
    source: 'tbd',
    resolution: '30m raster',
    coverage: 'All forested zones',
    format: 'Cloud-Optimized GeoTIFF'
  },
  {
    id: 'layer-9',
    name: 'Information Index',
    category: 'Human Footprint',
    description: 'Distribution of biodiversity data in the form of observations available on gbi.org.',
    significance: 'Canada\'s biodiversity data is highly uneven across space, with much of the country\'s land and species lacking the data needed to conduct accurate analyses of the state of our biodiversity.',
    source: 'gbif?',
    resolution: '1km grid density',
    coverage: 'Boreal & Temperate',
    format: 'GeoTIFF / ESRI Grid'
  },
  {
    id: 'layer-10',
    name: 'PLACEHOLDER - Hydrological Flow Integrity Index',
    category: 'Habitat',
    description: 'placeholder',
    significance: 'placeholder',
    source: 'placeholder',
    resolution: 'Vector Catchments',
    coverage: 'National',
    format: 'Shapefile / Geodatabase'
  }
];
