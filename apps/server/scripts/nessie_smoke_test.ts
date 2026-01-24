import path from "node:path";
import { createRequire } from "node:module";
import dotenv from "dotenv";

const __dirname = path.dirname(process.argv[1]);
dotenv.config({ path: path.resolve(__dirname, "../../..", ".env") });

const require = createRequire(import.meta.url);
const { demoAccountId, demoMode } = require("../src/config/demoConfig");
const { createBillPayment, createTransfer, getPurchases, listBills } = require(
  "../src/nessie/nessieClient"
);

const requireApiKey = () => {
  if (!process.env.NESSIE_API_KEY) {
    throw new Error("Set NESSIE_API_KEY before running the Nessie smoke test.");
  }
};

const safeTransferPayeeId = process.env.SAFE_TRANSFER_PAYEE_ID;
const safeBillId = process.env.SAFE_BILL_ID;

const run = async () => {
  requireApiKey();

  const purchases = await getPurchases(demoAccountId);
  const lastTenPurchases = purchases.slice(-10);
  console.log("Purchases (last 10):");
  console.log(JSON.stringify(lastTenPurchases, null, 2));

  const bills = await listBills(demoAccountId);
  console.log("Bills:");
  console.log(JSON.stringify(bills, null, 2));

  if (demoMode && safeTransferPayeeId) {
    const transfer = await createTransfer(
      demoAccountId,
      safeTransferPayeeId,
      25,
      "demo transfer"
    );
    console.log("Transfer:");
    console.log(JSON.stringify(transfer, null, 2));
  } else {
    console.log("Transfer skipped (requires DEMO_MODE=true and SAFE_TRANSFER_PAYEE_ID).");
  }

  if (demoMode && safeBillId) {
    const billPayment = await createBillPayment(demoAccountId, safeBillId, 30, "demo bill payment");
    console.log("Bill payment:");
    console.log(JSON.stringify(billPayment, null, 2));
  } else {
    console.log("Bill payment skipped (requires DEMO_MODE=true and SAFE_BILL_ID).");
  }
};

run().catch((error) => {
  console.error("Nessie smoke test failed:", error);
  process.exit(1);
});
