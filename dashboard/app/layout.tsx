import type { Metadata } from "next";
import { Instrument_Serif, Sora } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Waypoint — AI navigation for your website",
  description: "One script tag. Visitors ask in natural language, Waypoint navigates and clicks for them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${sora.variable} antialiased`}
        style={{ fontFamily: "var(--font-body, sans-serif)" }}
      >
        {children}
      </body>
    </html>
  );
}
