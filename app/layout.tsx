import type { Metadata } from "next";
import type { Viewport } from "next/types";
import "./globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

// Prevent Font Awesome from adding its CSS automatically since we import it manually above
config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Speedrunning: A visual Exploration",
  description: "A data viz short story",
};
export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
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
