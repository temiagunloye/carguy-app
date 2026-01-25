import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThatAppCompany",
  description: "Clean workflows, immersive product experiences.",
  icons: {
    icon: "/brand/tac-logo.png",
    shortcut: "/brand/tac-logo.png",
    apple: "/brand/tac-logo.png"
  },
  openGraph: {
    images: ["/brand/tac-logo.png"]
  },
  twitter: {
    images: ["/brand/tac-logo.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
