import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Domain Hunter",
  description: "Find open domains before others do."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
