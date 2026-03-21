import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloseArena — Practice Sales Calls Until Closing Feels Automatic",
  description:
    "Train against a live AI prospect, handle real objections, and get better at closing high-ticket fitness coaching clients.",
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
