import type { Metadata } from "next";
import { ModulesPageFeature } from "@/features/modules/components/modules-page";

export const metadata: Metadata = {
  title: "Modules",
};

export default function ModulesPage() {
  return <ModulesPageFeature />;
}