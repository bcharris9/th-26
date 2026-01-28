export const demoGroceryMerchants = ["Whole Foods", "Kroger"] as const;

export const demoGroceryPurchases = [
  { merchant: "Whole Foods", amount: 120.0, date: "2025-12-05" },
  { merchant: "Kroger", amount: 72.5, date: "2025-12-12" },
  { merchant: "Whole Foods", amount: 98.75, date: "2025-12-19" },
  { merchant: "Kroger", amount: 84.25, date: "2025-12-26" },
  { merchant: "Whole Foods", amount: 74.5, date: "2025-12-29" },
] as const;

export const demoGroceryTotal = 450.0;

export const demoPendingBill = {
  biller: "Reliant Energy",
  amount: 145.2,
  dueDate: "October 30th",
} as const;

export const demoScamTrigger = {
  payeeName: "Uncle Bob",
  amount: 2500.0,
  keyword: "IRS",
} as const;

export const getDemoAccountSnapshot = () => {
  return {
    groceryTotal: demoGroceryTotal,
    groceryCount: demoGroceryPurchases.length,
    groceryMerchants: demoGroceryMerchants,
    pendingBill: demoPendingBill,
  };
};

export const getDemoRecentActivity = () => {
  return {
    groceryPurchases: demoGroceryPurchases,
    scamTrigger: demoScamTrigger,
  };
};
