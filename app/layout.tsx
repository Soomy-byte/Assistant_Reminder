import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

export const metadata: Metadata = {
  title: "Assistant Reminder",
  description: "Asisten perencana mingguan yang mengubah daftar tugas menjadi jadwal realistis.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body><ServiceWorkerRegistration />{children}</body>
    </html>
  );
}
