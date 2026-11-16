import { ToolFrame } from "@/components/app/tool-frame";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return <ToolFrame>{children}</ToolFrame>;
}
