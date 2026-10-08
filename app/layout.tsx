import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orynt — School Operating Intelligence",
  description: "A school operating intelligence and action layer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
