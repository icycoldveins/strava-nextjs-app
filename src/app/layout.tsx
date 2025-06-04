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
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <Providers>
          <main className="flex min-h-screen flex-col strava-theme">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
