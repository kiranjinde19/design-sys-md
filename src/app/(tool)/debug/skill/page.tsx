import type { Metadata } from "next";
import { SkillPrint } from "./skill-print";

export const metadata: Metadata = {
  title: "Skill file (temporary)",
  robots: { index: false },
};

export default function SkillPage() {
  return <SkillPrint stack="next-tailwind-shadcn" />;
}
