"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/search/SearchBar";

function NavLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: number }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2 hover:text-text"
      }`}
    >
      {children}
      {badge ? (
        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-[18px] text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

export function Header() {
  const { user, unread, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-2 px-4">
        <Link href="/" className="mr-1 text-lg font-bold tracking-tight">
          Bailanysta
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Основная навигация">
          <NavLink href="/">Лента</NavLink>
          {user && <NavLink href={`/profile/${user.username}`}>Профиль</NavLink>}
          {user && (
            <NavLink href="/notifications" badge={unread}>
              Уведомления
            </NavLink>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <SearchBar compact />
          <ThemeToggle />
          {user ? (
            <>
              <Link href={`/profile/${user.username}`} className="ml-1 sm:hidden" aria-label="Профиль">
                <Avatar user={user} size="sm" />
              </Link>
              <Link href={`/profile/${user.username}`} className="ml-1 hidden sm:block" title={user.displayName}>
                <Avatar user={user} size="sm" />
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:inline-flex">
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 text-sm font-medium text-muted hover:text-text">
                Войти
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm">Регистрация</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      {/* Мобильная навигация */}
      <nav className="flex items-center justify-around border-t border-border sm:hidden" aria-label="Мобильная навигация">
        <NavLink href="/">Лента</NavLink>
        <NavLink href="/search">Поиск</NavLink>
        {user ? (
          <>
            <NavLink href="/notifications" badge={unread}>
              Уведомления
            </NavLink>
            <button type="button" onClick={logout} className="px-3 py-1.5 text-sm font-medium text-muted">
              Выйти
            </button>
          </>
        ) : (
          <NavLink href="/register">Регистрация</NavLink>
        )}
      </nav>
    </header>
  );
}
