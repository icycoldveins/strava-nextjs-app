import Providers from "./providers";
import { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Strava NextJS App",
  description: "An application integrated with Strava API",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
    