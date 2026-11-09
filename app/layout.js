import { Red_Hat_Display, Red_Hat_Text, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Pairing dari skill taste (start.mjs deal, software): Red Hat Display / Red Hat Text + IBM Plex Mono.
const display = Red_Hat_Display({ variable: "--nf-display", subsets: ["latin"], weight: ["400", "500", "600"] });
const text = Red_Hat_Text({ variable: "--nf-text", subsets: ["latin"], weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ variable: "--nf-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata = {
  title: "CV Extractor: analisis CV dengan AI untuk rekruter dan pelamar",
  description:
    "Unggah CV dalam PDF atau Word. Formatnya dicek untuk sistem ATS, lalu isinya dipecah menjadi profil, pengalaman, keahlian, skor dan saran perbaikan.",
  icons: { icon: "/favicon.svg" },
  other: { "page-type": "software", "site-kind": "software" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1c1c1c",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      data-type="software"
      data-radius="soft"
      data-buttons="tonal"
      data-tone="dark"
      className={`${display.variable} ${text.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Kit desain taste-skill (disalin dari .agents/skills/design-taste-frontend/assets) */}
        <link rel="stylesheet" href="/assets/system.css" />
        <link rel="stylesheet" href="/assets/layout/layout.css" />
        <link rel="stylesheet" href="/assets/motion/motion.css" />
        {/* Entrance hero sekali saat halaman dibuka (motion.md) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('m-enter');setTimeout(function(){document.documentElement.classList.add('m-enter-done')},700)",
          }}
        />
      </head>
      {/* motion.js (kit) dimuat oleh CvApp setelah hydration selesai, supaya tidak bentrok dengan React */}
      <body>{children}</body>
    </html>
  );
}
