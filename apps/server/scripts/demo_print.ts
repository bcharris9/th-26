import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { scamGuardCheck } from "../src/scamGuard/scamGuard";
import { demoScamTrigger, getDemoAccountSnapshot } from "../src/demo/demoData";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../..", ".env") });

const run = () => {
  const snapshot = getDemoAccountSnapshot();
  console.log("Demo snapshot:");
  console.log(JSON.stringify(snapshot, null, 2));

  const scamResult = scamGuardCheck({
    accountId: "demo-account",
    targetId: "demo-payee",
    isNewTarget: true,
    amount: demoScamTrigger.amount,
    avgAmount30d: 125,
    recentOutgoingCount10m: 4,
    projectedBalance: 20,
    memo: `IRS ${demoScamTrigger.keyword}`,
  });

  console.log("Scam guard check:");
  console.log(JSON.stringify(scamResult, null, 2));

  if (scamResult.riskLevel !== "HIGH") {
    throw new Error("Expected scam guard to return HIGH risk for demo trigger.");
  }
};

run();
