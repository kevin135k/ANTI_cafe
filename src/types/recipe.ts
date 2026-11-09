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

export type BrewerType = 'V60' | 'Kalita Wave' | 'Origami' | '冰手沖' | 'All';

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
}
