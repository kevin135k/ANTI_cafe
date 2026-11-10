export interface Step {
  id: number;
  type: 'pour' | 'wait' | 'stir' | 'swirl';
  title: string;
  description?: string;
  waterAmount: number; // In grams for this step (0 for wait/stir steps)
  duration: number; // In seconds
}

export interface ScaledStep extends Step {
  stepNumber: number;
  scaledWater: number;
  accumulatedWater: number;
}

export type GrindLevel = 'Fine' | 'Medium-Fine' | 'Medium' | 'Medium-Coarse' | 'Coarse';

export type BrewerType =
  | 'All'
  | '自訂'
  | 'V60'
  | 'Chemex'
  | 'Kalita Wave'
  | 'Origami'
  | '聰明濾杯'
  | 'Melitta'
  | 'April'
  | '冰手沖'
  | string;

export interface Recipe {
  id: string;
  name: string;
  category: BrewerType;
  referenceAuthor: string;
  referenceUrl?: string;
  defaultCoffee: number; // grams
  defaultWater: number; // grams
  defaultIce?: number; // grams if iced
  temperature: number; // Celsius
  totalTimeSeconds: number; // e.g. 180s for 3:00
  ratio: string; // e.g. "1:15"
  summary: string;
  grindAndFlavor: string;
  beanPairing: string;
  steps: Step[];
  isCustom?: boolean;
  grindLevel?: GrindLevel;
  createdAt?: number;
}
