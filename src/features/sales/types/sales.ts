export type SalesTab =
  | "order"
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

export type OrderInput = {
  customerId: string;
  orderedAt: string;
  quantityKg: string;
  note: string;
};

export type OrderPricingPreviewInput = {
  customerId: string;
  orderedAt: string;
};

export type OrderPricingPreviewResult =
  | {
      success: true;
      customerName: string;
      basePricePerKg: string;
      discountPerKg: string;
      finalPricePerKg: string;
      availableStockKg?: string;
    }
  | {
      success: false;
      error: string;
    };

export type CreateOrderResult =
  | {
      success: true;
      message: string;
      orderId: string;
    }
  | {
      success: false;
      error: string;
    };

export type OrderFilters = {
  from: string;
  to: string;
  customerId: string;
};

export type OrderView = {
  id: string;
  customerId: string;
  customerName: string;
  orderedAt: string;

  quantityKg: string;
  basePricePerKg: string;
  discountPerKg: string;
  finalPricePerKg: string;
  totalPrice: string;

  note: string | null;
  createdAt: string;
};

export type SalesSummary = {
  totalSales: string;
  totalQuantityKg: string;
  orderCount: number;
  activeCustomerCount: number;
};

export type OrderListData = {
  filters: OrderFilters;
  summary: SalesSummary;
  orders: OrderView[];
};