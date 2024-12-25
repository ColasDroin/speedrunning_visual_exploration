import type { Metadata } from "next";
import "./globals.css";
import "../fontawesome";

export const metadata: Metadata = {
  title: "Speedrun",
  description: "A data viz short story",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        {children} {<div id="portal-root"></div>}
      </body>
    </html>
  );
}
