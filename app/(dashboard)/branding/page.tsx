import type { Metadata } from "next";
import { BrandingKit } from "@/features/branding/branding-kit";

export const metadata: Metadata = {
  title: "Branding Kit — 7 Hari Personal Branding",
};

export default function BrandingPage() {
  return <BrandingKit />;
}
