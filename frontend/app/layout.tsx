import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Virtual Chemistry Lab",
  description:
    "An interactive virtual chemistry laboratory where you drag tools, pour chemicals, and observe reactions in real time.",
  keywords: [
    "chemistry",
    "virtual lab",
    "science",
    "simulation",
    "education",
    "reactions",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
