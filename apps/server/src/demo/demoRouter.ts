import { demoMode } from "../config/demoConfig";
import { getDemoAccountSnapshot, getDemoRecentActivity } from "./demoData";

export type DemoAccountSnapshot = ReturnType<typeof getDemoAccountSnapshot>;
export type DemoRecentActivity = ReturnType<typeof getDemoRecentActivity>;

export const getDemoSnapshot = () => {
  if (!demoMode) {
    throw new Error("Demo snapshot is only available when DEMO_MODE=true.");
  }
  return {
    accountSnapshot: getDemoAccountSnapshot(),
    recentActivity: getDemoRecentActivity(),
  };
};
