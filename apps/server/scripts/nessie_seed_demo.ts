import path from "node:path";
import dotenv from "dotenv";

const __dirname = path.dirname(process.argv[1]);
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

const createCustomer = async () => {
  return request("/customers", {
    method: "POST",
    body: JSON.stringify({
      first_name: "Demo",
      last_name: "User",
      address: {
        street_number: "1",
        street_name: "Main",
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
      nickname: "Demo Checking",
      rewards: 0,
      balance: 500,
    }),
  });
};

const run = async () => {
  const customer = await createCustomer();
  const customerId =
    (customer._id as string | undefined) ||
    ((customer.objectCreated as { _id?: string } | undefined)?._id as string | undefined);
  if (!customerId) {
    console.error("Customer response:", JSON.stringify(customer, null, 2));
    throw new Error("Customer response missing _id.");
  }

  const account = await createAccount(customerId);
  const accountId =
    (account._id as string | undefined) ||
    ((account.objectCreated as { _id?: string } | undefined)?._id as string | undefined);
  if (!accountId) {
    console.error("Account response:", JSON.stringify(account, null, 2));
    throw new Error("Account response missing _id.");
  }

  console.log("Created customer:", customerId);
  console.log("Created account:", accountId);
  console.log("Set DEMO_ACCOUNT_ID to the account id in your .env file.");
};

run().catch((error) => {
  console.error("Nessie seed failed:", error);
  process.exit(1);
});
