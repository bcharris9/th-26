import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../..", ".env");
dotenv.config({ path: envPath });

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

const unwrapId = (response: Record<string, unknown>) => {
  const direct = response._id as string | undefined;
  const nested = (response.objectCreated as { _id?: string } | undefined)?._id;
  return direct || nested;
};

const createCustomer = async () => {
  return request("/customers", {
    method: "POST",
    body: JSON.stringify({
      first_name: "Payee",
      last_name: "Demo",
      address: {
        street_number: "2",
        street_name: "Broad",
        city: "Boston",
        state: "MA",
        zip: "02110",
      },
    }),
  });
};

const createAccount = async (customerId: string) => {
  return request(`/customers/${customerId}/accounts`, {
    method: "POST",
    body: JSON.stringify({
      type: "Checking",
      nickname: "Demo Payee",
      rewards: 0,
      balance: 250,
    }),
  });
};

const listBills = async () => {
  return request(`/accounts/${accountId}/bills`, { method: "GET" }) as Promise<
    Array<Record<string, unknown>>
  >;
};

const createBill = async () => {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth(), 15).toISOString();
  return request(`/accounts/${accountId}/bills`, {
    method: "POST",
    body: JSON.stringify({
      status: "pending",
      payee: "Demo Telecom",
      nickname: "Internet",
      payment_date: date,
      recurring_date: 15,
      payment_amount: 55.25,
    }),
  });
};

const setEnvValue = (contents: string, key: string, value: string) => {
  const lines = contents.split(/\r?\n/);
  const prefix = `${key}=`;
  let replaced = false;

  const next = lines.map((line) => {
    if (line.startsWith(prefix)) {
      replaced = true;
      return `${prefix}${value}`;
    }
    return line;
  });

  if (!replaced) {
    next.push(`${prefix}${value}`);
  }

  return next.join("\n");
};

const run = async () => {
  let safeBillId = process.env.SAFE_BILL_ID;
  let safeTransferPayeeId = process.env.SAFE_TRANSFER_PAYEE_ID;

  if (!safeBillId) {
    const bills = await listBills();
    const firstBillId = bills[0]?._id as string | undefined;
    if (firstBillId) {
      safeBillId = firstBillId;
    } else {
      const bill = await createBill();
      safeBillId = unwrapId(bill);
    }
  }

  if (!safeBillId) {
    throw new Error("Unable to determine SAFE_BILL_ID.");
  }

  if (!safeTransferPayeeId) {
    const customer = await createCustomer();
    const customerId = unwrapId(customer);
    if (!customerId) {
      console.error("Customer response:", JSON.stringify(customer, null, 2));
      throw new Error("Payee customer response missing _id.");
    }

    const payeeAccount = await createAccount(customerId);
    safeTransferPayeeId = unwrapId(payeeAccount);
  }

  if (!safeTransferPayeeId) {
    throw new Error("Unable to determine SAFE_TRANSFER_PAYEE_ID.");
  }

  const envContents = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  let updated = setEnvValue(envContents, "SAFE_BILL_ID", safeBillId);
  updated = setEnvValue(updated, "SAFE_TRANSFER_PAYEE_ID", safeTransferPayeeId);
  fs.writeFileSync(envPath, updated, "utf8");

  console.log("SAFE_BILL_ID:", safeBillId);
  console.log("SAFE_TRANSFER_PAYEE_ID:", safeTransferPayeeId);
  console.log("Updated .env with safe IDs.");
};

run().catch((error) => {
  console.error("Nessie safe-id helper failed:", error);
  process.exit(1);
});
