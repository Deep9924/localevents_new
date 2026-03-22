import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { CityProvider } from "@/contexts/CityContext";

const sora = Sora({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LocalEvents",
  description: "Discover local events in your city",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={sora.className}>
        <Providers>
          <CityProvider>
            <Navbar />
            {children}
            <Toaster richColors position="top-right" />
          </CityProvider>
        </Providers>
      </body>
    </html>
  );
}
