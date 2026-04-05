import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import RootNavbar from "@/components/RootNavbar";
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
            <RootNavbar />
            {children}
            <Toaster richColors position="top-right" />
          </CityProvider>
        </Providers>
      </body>
    </html>
  );
}
