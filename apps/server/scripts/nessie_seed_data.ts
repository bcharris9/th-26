import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../..", ".env") });

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name} before running this script.`);
  }
  return value;
};

const apiBase = process.env.NESSIE_API_BASE || "http://api.nessieisreal.com";
const apiKey = requireEnv("NESSIE_API_KEY");
const accountId = requireEnv("DEMO_ACCOUNT_ID");

const request = async (pathName: string, options: RequestInit) => {
  const url = new URL(pathName, apiBase);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Nessie request failed: ${response.status} ${response.statusText} ${body}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
};

const createMerchant = async (name: string) => {
  return request("/merchants", {
    method: "POST",
    body: JSON.stringify({
      name,
      category: "retail",
      address: {
        street_number: "1",
        street_name: "Main",
        city: "Boston",
        state: "MA",
        zip: "02110",
      },
      geocode: {
        lat: 42.3601,
        lng: -71.0589,
      },
    }),
  });
};

const createPurchase = async (merchantId: string, amount: number, description: string, date: string) => {
  return request(`/accounts/${accountId}/purchases`, {
    method: "POST",
    body: JSON.stringify({
      merchant_id: merchantId,
      medium: "balance",
      purchase_date: date,
      amount,
      description,
    }),
  });
};

const createBill = async (payee: string, nickname: string, amount: number, date: string, day: number) => {
  return request(`/accounts/${accountId}/bills`, {
    method: "POST",
    body: JSON.stringify({
      status: "pending",
      payee,
      nickname,
      payment_date: date,
      recurring_date: day,
      payment_amount: amount,
    }),
  });
};

const unwrapId = (response: Record<string, unknown>) => {
  const direct = response._id as string | undefined;
  const nested = (response.objectCreated as { _id?: string } | undefined)?._id;
  return direct || nested;
};

const run = async () => {
  const merchants = ["Demo Market", "City Cafe", "Northside Books"];
  const merchantIds: string[] = [];

  for (const name of merchants) {
    const merchant = await createMerchant(name);
    const id = unwrapId(merchant);
    if (!id) {
      console.error("Merchant response:", JSON.stringify(merchant, null, 2));
      throw new Error("Merchant response missing _id.");
    }
    merchantIds.push(id);
  }

  const today = new Date();
  const purchases = [
    { amount: 12.5, description: "Coffee" },
    { amount: 42.75, description: "Groceries" },
    { amount: 18.2, description: "Books" },
    { amount: 9.99, description: "Snacks" },
    { amount: 64.1, description: "Household" },
  ];

  for (let i = 0; i < purchases.length; i += 1) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString();
    const merchantId = merchantIds[i % merchantIds.length];
    await createPurchase(merchantId, purchases[i].amount, purchases[i].description, date);
  }

  const bills = [
    { payee: "City Power", nickname: "Electric", amount: 89.45, day: 5 },
    { payee: "Metro Water", nickname: "Water", amount: 48.2, day: 12 },
    { payee: "NetLink", nickname: "Internet", amount: 69.0, day: 20 },
  ];

  for (const bill of bills) {
    const date = new Date(today.getFullYear(), today.getMonth(), bill.day).toISOString();
    await createBill(bill.payee, bill.nickname, bill.amount, date, bill.day);
  }

  console.log("Seeded purchases and bills for account:", accountId);
};

run().catch((error) => {
  console.error("Nessie seed data failed:", error);
  process.exit(1);
});
