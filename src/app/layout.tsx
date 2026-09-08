import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AmbientBackdrop } from "@/components/layout/AmbientBackdrop";
import "./globals.css";

// Une grotesque neutre pour toute l'interface : sur un thème sombre aux traits
// fins, un serif éditorial épaissit et brouille les petits corps.
const sansUi = Inter({
  variable: "--font-sans-ui",
  subsets: ["latin"],
});

// Réservée aux métriques (allure, distance, FC) via la classe .metric : une
// chasse fixe aligne les colonnes de chiffres et donne le registre "instrument"
// attendu sur une app d'entraînement.
const monoUi = JetBrains_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sessionized",
  description: "Ton plan, de ton coach, chaque jour.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${sansUi.variable} ${monoUi.variable} h-full antialiased`}>
      {/* Pas de `scene` ici : une perspective sur <body> ferait des éléments
          fixed (modale portée, drawer mobile) des enfants de son cadre au lieu
          du viewport. La perspective est ouverte par les conteneurs de contenu. */}
      <body className="min-h-full flex flex-col">
        <AmbientBackdrop />
        {children}
      </body>
    </html>
  );
}
