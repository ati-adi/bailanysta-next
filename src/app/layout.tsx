import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { countUnread } from "@/lib/services/notifications";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider, themeInitScript } from "@/components/providers/ThemeProvider";
import { Header } from "@/components/layout/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Bailanysta", template: "%s · Bailanysta" },
  description: "Bailanysta — небольшая социальная сеть: посты, лента, подписки, лайки и комментарии.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unread = user ? await countUnread(user.id) : 0;

  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Применяем сохранённую тему до гидрации, чтобы не было «вспышки» светлой темы */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider initialUser={user} initialUnread={unread}>
            <Header />
            <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
            <footer className="border-t border-border py-4 text-center text-xs text-muted">
              Bailanysta · учебный проект · Next.js + libSQL
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
