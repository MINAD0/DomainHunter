import { AppShell } from "@/components/app-shell";

export default function GeneratorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

