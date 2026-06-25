"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import {
  LayoutDashboard, Target, Repeat2, CheckSquare, Wallet,
  Heart, BookOpen, BarChart3, TrendingUp, Settings, LogOut,
  Menu, X, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/goals", label: "Цели", icon: Target },
  { href: "/habits", label: "Привычки", icon: Repeat2 },
  { href: "/tasks", label: "Задачи", icon: CheckSquare },
  { href: "/finance", label: "Финансы", icon: Wallet },
  { href: "/health", label: "Здоровье", icon: Heart },
  { href: "/journal", label: "Дневник", icon: BookOpen },
  { href: "/reports", label: "Отчёты", icon: BarChart3 },
  { href: "/analytics", label: "Аналитика", icon: TrendingUp },
];

function AscendLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.9)} viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="27" cy="5" r="3.5" fill="#D4A63A" />
      <path d="M2 34 L14 13 L20 23 L27 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M27 5 L38 34" stroke="#D4A63A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AscendLogo size={48} />
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", mobile ? "p-4" : "p-5")}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-1">
        <AscendLogo size={34} />
        <div>
          <p className="font-bold text-sm tracking-[0.15em] uppercase text-foreground leading-none">Ascend</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">Track. Improve. Ascend.</p>
        </div>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-3 py-2.5 mb-4 rounded-xl bg-secondary/60">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary uppercase">
            {(user?.full_name || user?.username || "A").charAt(0)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{user?.full_name || user?.username}</p>
          <p className="text-[10px] text-muted-foreground">Личный аккаунт</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary" : "")} />
              <span className="flex-1">{label}</span>
              {active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border/60 pt-3 mt-3 space-y-0.5">
        {(user as any)?.is_admin && (
          <Link
            href="/users"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              pathname === "/users"
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <Users className={cn("w-4 h-4", pathname === "/users" ? "text-primary" : "")} />
            <span>Пользователи</span>
          </Link>
        )}
        <Link
          href="/settings"
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
            pathname === "/settings"
              ? "bg-primary/15 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          <Settings className={cn("w-4 h-4", pathname === "/settings" ? "text-primary" : "")} />
          <span>Настройки</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border/60 flex-shrink-0" style={{ background: "hsl(218 30% 5%)" }}>
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 border-r border-border shadow-2xl z-10" style={{ background: "hsl(218 30% 5%)" }}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <AscendLogo size={24} />
            <span className="font-bold text-sm tracking-widest uppercase">Ascend</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
