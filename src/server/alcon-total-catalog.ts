import type { ParameterRules } from "@/domain/parameters";

/** Referenze pubblicate su https://total.myalcon.com/ (famiglie DAILIES TOTAL1 e TOTAL30). */
export type AlconTotalProduct = {
  id: string;
  commercialName: string;
  slug: string;
  sku: string;
  lensType: "DAILY" | "MONTHLY";
  geometry: "SPHERICAL" | "TORIC" | "MULTIFOCAL";
  lensesPerPack: number;
  replacementFrequencyDays: number;
  material: string;
  waterContent: string;
  shortDescription: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  rules: ParameterRules;
};

const note =
  "Scheda ricavata dall'elenco pubblico della gamma TOTAL. Il produttore non indica il prezzo al pubblico: la scheda resta in bozza finché il negozio non conferma prezzo, confezione e parametri sulla scheda tecnica.";

const sphere = { sphereMin: -12, sphereMax: 6, sphereStep: 0.25 };

export const alconManufacturerId = "a1c00000-0000-4000-8000-000000000001";
export const alconBrandId = "a1c00000-0000-4000-8000-000000000002";

export const alconTotalProducts: AlconTotalProduct[] = [
  {
    id: "a1c00000-0000-4000-8000-000000000010",
    commercialName: "DAILIES TOTAL1",
    slug: "dailies-total1",
    sku: "ALCON-DT1",
    lensType: "DAILY",
    geometry: "SPHERICAL",
    lensesPerPack: 30,
    replacementFrequencyDays: 1,
    material: "delefilcon A",
    waterContent: "Gradiente d'acqua, nucleo meno idratato della superficie",
    shortDescription: "Lente morbida giornaliera sferica, da sostituire ogni giorno.",
    description: `Lente a contatto morbida a ricambio giornaliero, geometria sferica, della famiglia DAILIES TOTAL1. Confezione di riferimento da 30 lenti. ${note}`,
    imagePath: "/images/products/giornaliera.svg",
    imageAlt: "Illustrazione astratta di una lente giornaliera",
    rules: { geometry: "SPHERICAL", ...sphere, additionOptions: [], baseCurveOptions: ["8.5"], diameterOptions: ["14.1"], dominanceOptions: [], colorOptions: [] },
  },
  {
    id: "a1c00000-0000-4000-8000-000000000011",
    commercialName: "DAILIES TOTAL1 for Astigmatism",
    slug: "dailies-total1-for-astigmatism",
    sku: "ALCON-DT1-AST",
    lensType: "DAILY",
    geometry: "TORIC",
    lensesPerPack: 30,
    replacementFrequencyDays: 1,
    material: "delefilcon A",
    waterContent: "Gradiente d'acqua, nucleo meno idratato della superficie",
    shortDescription: "Lente morbida giornaliera torica, per la correzione dell'astigmatismo.",
    description: `Lente a contatto morbida a ricambio giornaliero, geometria torica. Confezione di riferimento da 30 lenti. ${note}`,
    imagePath: "/images/products/torica.svg",
    imageAlt: "Illustrazione astratta di una lente torica",
    rules: {
      geometry: "TORIC",
      ...sphere,
      cylinderMin: -2.25,
      cylinderMax: -0.75,
      cylinderStep: 0.25,
      axisMin: 10,
      axisMax: 180,
      axisStep: 10,
      additionOptions: [],
      baseCurveOptions: ["8.6"],
      diameterOptions: ["14.5"],
      dominanceOptions: [],
      colorOptions: [],
    },
  },
  {
    id: "a1c00000-0000-4000-8000-000000000012",
    commercialName: "DAILIES TOTAL1 Multifocal",
    slug: "dailies-total1-multifocal",
    sku: "ALCON-DT1-MF",
    lensType: "DAILY",
    geometry: "MULTIFOCAL",
    lensesPerPack: 30,
    replacementFrequencyDays: 1,
    material: "delefilcon A",
    waterContent: "Gradiente d'acqua, nucleo meno idratato della superficie",
    shortDescription: "Lente morbida giornaliera multifocale, per la visione a più distanze.",
    description: `Lente a contatto morbida a ricambio giornaliero, geometria multifocale. Addizioni di riferimento LOW, MED e HIGH. Confezione di riferimento da 30 lenti. ${note}`,
    imagePath: "/images/products/multifocale.svg",
    imageAlt: "Illustrazione astratta di una lente multifocale",
    rules: {
      geometry: "MULTIFOCAL",
      ...sphere,
      additionOptions: ["LOW", "MED", "HIGH"],
      baseCurveOptions: ["8.5"],
      diameterOptions: ["14.1"],
      dominanceOptions: [],
      colorOptions: [],
    },
  },
  {
    id: "a1c00000-0000-4000-8000-000000000020",
    commercialName: "TOTAL30",
    slug: "total30",
    sku: "ALCON-T30",
    lensType: "MONTHLY",
    geometry: "SPHERICAL",
    lensesPerPack: 6,
    replacementFrequencyDays: 30,
    material: "lehfilcon A",
    waterContent: "Gradiente d'acqua, nucleo meno idratato della superficie",
    shortDescription: "Lente morbida mensile sferica. Si rimuove ogni sera e si sostituisce entro 30 giorni.",
    description: `Lente a contatto morbida a sostituzione mensile, geometria sferica. Richiede pulizia e conservazione quotidiane. Confezione di riferimento da 6 lenti. ${note}`,
    imagePath: "/images/products/giornaliera.svg",
    imageAlt: "Illustrazione astratta di una lente mensile",
    rules: { geometry: "SPHERICAL", ...sphere, additionOptions: [], baseCurveOptions: ["8.4"], diameterOptions: ["14.2"], dominanceOptions: [], colorOptions: [] },
  },
  {
    id: "a1c00000-0000-4000-8000-000000000021",
    commercialName: "TOTAL30 for Astigmatism",
    slug: "total30-for-astigmatism",
    sku: "ALCON-T30-AST",
    lensType: "MONTHLY",
    geometry: "TORIC",
    lensesPerPack: 6,
    replacementFrequencyDays: 30,
    material: "lehfilcon A",
    waterContent: "Gradiente d'acqua, nucleo meno idratato della superficie",
    shortDescription: "Lente morbida mensile torica, per la correzione dell'astigmatismo.",
    description: `Lente a contatto morbida a sostituzione mensile, geometria torica. Richiede pulizia e conservazione quotidiane. Confezione di riferimento da 6 lenti. ${note}`,
    imagePath: "/images/products/torica.svg",
    imageAlt: "Illustrazione astratta di una lente torica mensile",
    rules: {
      geometry: "TORIC",
      ...sphere,
      cylinderMin: -2.25,
      cylinderMax: -0.75,
      cylinderStep: 0.25,
      axisMin: 10,
      axisMax: 180,
      axisStep: 10,
      additionOptions: [],
      baseCurveOptions: ["8.6"],
      diameterOptions: ["14.5"],
      dominanceOptions: [],
      colorOptions: [],
    },
  },
  {
    id: "a1c00000-0000-4000-8000-000000000022",
    commercialName: "TOTAL30 Multifocal",
    slug: "total30-multifocal",
    sku: "ALCON-T30-MF",
    lensType: "MONTHLY",
    geometry: "MULTIFOCAL",
    lensesPerPack: 6,
    replacementFrequencyDays: 30,
    material: "lehfilcon A",
    waterContent: "Gradiente d'acqua, nucleo meno idratato della superficie",
    shortDescription: "Lente morbida mensile multifocale, per la visione a più distanze.",
    description: `Lente a contatto morbida a sostituzione mensile, geometria multifocale. Addizioni di riferimento LO, MED e HI. Confezione di riferimento da 6 lenti. ${note}`,
    imagePath: "/images/products/multifocale.svg",
    imageAlt: "Illustrazione astratta di una lente multifocale mensile",
    rules: {
      geometry: "MULTIFOCAL",
      ...sphere,
      additionOptions: ["LO", "MED", "HI"],
      baseCurveOptions: ["8.4"],
      diameterOptions: ["14.2"],
      dominanceOptions: [],
      colorOptions: [],
    },
  },
  {
    id: "a1c00000-0000-4000-8000-000000000023",
    commercialName: "TOTAL30 Multifocal for Astigmatism",
    slug: "total30-multifocal-for-astigmatism",
    sku: "ALCON-T30-MF-AST",
    lensType: "MONTHLY",
    geometry: "TORIC",
    lensesPerPack: 6,
    replacementFrequencyDays: 30,
    material: "lehfilcon A",
    waterContent: "Gradiente d'acqua, nucleo meno idratato della superficie",
    shortDescription: "Lente morbida mensile per astigmatismo e visione a più distanze.",
    description: `Lente a contatto morbida a sostituzione mensile, indicata per astigmatismo e presbiopia. La scheda la tratta come torica: l'addizione (LO, MED o HI) va annotata a parte finché il catalogo non distingue una geometria torica multifocale. Confezione di riferimento da 6 lenti. ${note}`,
    imagePath: "/images/products/torica.svg",
    imageAlt: "Illustrazione astratta di una lente torica mensile",
    rules: {
      geometry: "TORIC",
      ...sphere,
      cylinderMin: -2.25,
      cylinderMax: -0.75,
      cylinderStep: 0.25,
      axisMin: 10,
      axisMax: 180,
      axisStep: 10,
      additionOptions: ["LO", "MED", "HI"],
      baseCurveOptions: ["8.6"],
      diameterOptions: ["14.5"],
      dominanceOptions: [],
      colorOptions: [],
    },
  },
];
