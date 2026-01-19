import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThatAppCompany",
  description: "Clean workflows, immersive product experiences."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
