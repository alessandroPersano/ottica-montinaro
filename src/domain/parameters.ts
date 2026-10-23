export type LensGeometry = "SPHERICAL" | "TORIC" | "MULTIFOCAL" | "COSMETIC";

export type ParameterRules = {
  geometry: LensGeometry;
  sphereMin: number;
  sphereMax: number;
  sphereStep: number;
  cylinderMin?: number | null;
  cylinderMax?: number | null;
  cylinderStep?: number | null;
  axisMin?: number | null;
  axisMax?: number | null;
  axisStep?: number | null;
  additionOptions: string[];
  baseCurveOptions: string[];
  diameterOptions: string[];
  dominanceOptions: string[];
  colorOptions: string[];
};

export type EyeParameters = {
  sphere: number;
  cylinder?: number | null;
  axis?: number | null;
  addition?: string | null;
  baseCurve: string;
  diameter: string;
  dominance?: string | null;
  color?: string | null;
};

function onStep(value: number, min: number, step: number): boolean {
  if (step <= 0) return false;
  const steps = (value - min) / step;
  return Math.abs(steps - Math.round(steps)) < 1e-6;
}

export function validateEyeParameters(rules: ParameterRules, eye: EyeParameters): string[] {
  const errors: string[] = [];

  if (eye.sphere < rules.sphereMin || eye.sphere > rules.sphereMax || !onStep(eye.sphere, rules.sphereMin, rules.sphereStep)) {
    errors.push("La sfera non è tra i valori ammessi per questo prodotto.");
  }

  if (!rules.baseCurveOptions.includes(eye.baseCurve)) {
    errors.push("Il raggio base non è disponibile per questo prodotto.");
  }
  if (!rules.diameterOptions.includes(eye.diameter)) {
    errors.push("Il diametro non è disponibile per questo prodotto.");
  }

  const needsCylinder = rules.geometry === "TORIC";
  if (needsCylinder) {
    if (eye.cylinder == null || rules.cylinderMin == null || rules.cylinderMax == null || rules.cylinderStep == null) {
      errors.push("Per una lente torica servono cilindro e asse.");
    } else if (
      eye.cylinder < rules.cylinderMin ||
      eye.cylinder > rules.cylinderMax ||
      !onStep(eye.cylinder, rules.cylinderMin, rules.cylinderStep)
    ) {
      errors.push("Il cilindro non è tra i valori ammessi.");
    }
    if (eye.axis == null || rules.axisMin == null || rules.axisMax == null || rules.axisStep == null) {
      errors.push("Indica l'asse.");
    } else if (
      eye.axis < rules.axisMin ||
      eye.axis > rules.axisMax ||
      !onStep(eye.axis, rules.axisMin, rules.axisStep)
    ) {
      errors.push("L'asse non è tra i valori ammessi.");
    }
  } else if (eye.cylinder != null || eye.axis != null) {
    errors.push("Cilindro e asse si indicano solo per le lenti toriche.");
  }

  if (rules.geometry === "MULTIFOCAL") {
    if (!eye.addition || !rules.additionOptions.includes(eye.addition)) {
      errors.push("Seleziona un'addizione prevista per questo prodotto.");
    }
  } else if (eye.addition) {
    errors.push("L'addizione è prevista solo per le lenti multifocali.");
  }

  if (rules.geometry === "COSMETIC" && rules.colorOptions.length > 0) {
    if (!eye.color || !rules.colorOptions.includes(eye.color)) {
      errors.push("Seleziona un colore disponibile.");
    }
  }

  if (eye.dominance && !rules.dominanceOptions.includes(eye.dominance)) {
    errors.push("La dominanza indicata non è prevista.");
  }

  return errors;
}
