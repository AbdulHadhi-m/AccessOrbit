import type { Metadata } from "next";
import { AccessDenied } from "@/components/access-denied";

export const metadata: Metadata = {
  title: "Access denied",
};

export default function AccessDeniedPage() {
  return <AccessDenied />;
}