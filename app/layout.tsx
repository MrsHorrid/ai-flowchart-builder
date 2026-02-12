import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Flowchart Builder",
  description: "Create beautiful tree-style flowcharts with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
