import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AmbientBackdrop } from "@/components/layout/AmbientBackdrop";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
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
    // suppressHydrationWarning : le script ci-dessous pose data-theme sur <html>
    // avant que React n'hydrate, donc l'attribut diffère forcément du HTML rendu
    // par le serveur — qui, lui, ne peut pas connaître le choix du visiteur.
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${sansUi.variable} ${monoUi.variable} h-full antialiased`}
    >
      {/* Pas de `scene` ici : une perspective sur <body> ferait des éléments
          fixed (modale portée, drawer mobile) des enfants de son cadre au lieu
          du viewport. La perspective est ouverte par les conteneurs de contenu. */}
      <body className="min-h-full flex flex-col">
        {/* Premier nœud du body pour s'exécuter avant toute peinture : c'est ce
            qui évite le flash de thème au chargement. Voir lib/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <AmbientBackdrop />
        {children}
      </body>
    </html>
  );
}
