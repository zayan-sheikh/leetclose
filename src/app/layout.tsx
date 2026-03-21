import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloserArena AI — Practice Sales Calls Until Closing Feels Automatic",
  description:
    "AI sales call simulator for online fitness coaches. Train against realistic prospects, objections, and closing — with feedback, XP, and streaks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
