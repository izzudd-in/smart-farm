export type SalesTab =
  | "customer"
  | "price";

export type SalesActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export type CustomerInput = {
  name: string;
  phone: string;
  address: string;
  discountPerKg: string;
};

export type EggPriceInput = {
  pricePerKg: string;
  effectiveAt: string;
};

export type CustomerView = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  discountPerKg: string;
  isActive: boolean;
};

export type EggPriceView = {
  id: string;
  pricePerKg: string;
  effectiveAt: string;
  createdAt: string;
};

export type SalesPageData = {
  asOfDate: string;
  customers: CustomerView[];
  activePrice: EggPriceView | null;
  priceHistory: EggPriceView[];
};