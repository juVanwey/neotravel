import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AssistantWidget } from "@/components/AssistantWidget";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "NeoTravel · Le prix de votre car, calculé devant vous",
  description:
    "Transport de groupe en autocar. Prix 100 % déterministe, transparent et auditable. Simulateur de devis et assistant, de 1 à 85 passagers.",
};

// Évite le flash de thème : applique la préférence avant le premier paint.
const themeScript = `(function(){try{var t=localStorage.getItem('neotravel.theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${archivo.variable} ${jetbrains.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Bandeau d'accent supérieur */}
        <div style={{ height: 6, background: "var(--accent)" }} />
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
        <AssistantWidget />
      </body>
    </html>
  );
}
