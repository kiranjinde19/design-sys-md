import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STACK_IDS, type StackId } from "@/lib/design-system/types";
import { SkillPrint } from "../skill-print";

export const metadata: Metadata = {
  title: "Skill file (temporary)",
  robots: { index: false },
};

export function generateStaticParams() {
  return STACK_IDS.map((stack) => ({ stack }));
}

export default async function SkillStackPage(props: PageProps<"/debug/skill/[stack]">) {
  const { stack } = await props.params;
  if (!(STACK_IDS as readonly string[]).includes(stack)) notFound();
  return <SkillPrint stack={stack as StackId} />;
}
