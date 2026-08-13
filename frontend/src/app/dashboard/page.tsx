import type { Metadata } from "next";
import { DashboardFeature } from "@/features/dashboard/components/dashboard-feature";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <DashboardFeature />;
}