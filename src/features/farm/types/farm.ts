export type FarmActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export type OperatorOption = {
  id: string;
  name: string;
  email: string;
};

export type FlockSummary = {
  id: string;
  name: string;
  startDate: string;
  initialPopulation: number;
  ageDays: number;
  ageLabel: string;
};

export type KandangSummary = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  operators: OperatorOption[];
  activeFlock: FlockSummary | null;
};

export type FarmPageData = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  kandangs: KandangSummary[];
  operators: OperatorOption[];
};

export type KandangInput = {
  code: string;
  name: string;
  operatorIds: string[];
};

export type FlockInput = {
  name: string;
  startDate: string;
  initialPopulation: number;
};