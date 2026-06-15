import { Link, useLocation } from "wouter";
import { Calendar, Users, LayoutDashboard, Menu, X, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  admin?: boolean;
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-xs sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm font-serif">AA</span>
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm tracking-tight">Meeting Directory</span>
              <p className="text-xs text-muted-foreground hidden sm:block">Find a meeting near you</p>
            </div>
          </Link>
          <Link
            href="/admin"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded border border-border hover:border-border/80 hover:bg-muted"
          >
            Admin
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/meetings", label: "Meetings", icon: Calendar },
  { href: "/admin/people", label: "People", icon: Users },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 bg-sidebar flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:flex",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="admin-sidebar"
      >
        <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-sidebar-primary-foreground font-bold text-sm font-serif">AA</span>
          </div>
          <div>
            <span className="font-semibold text-sidebar-foreground text-sm">Admin Panel</span>
            <p className="text-xs text-sidebar-foreground/60">Meeting Directory</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {adminNav.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/admin" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
                data-testid={`nav-${label.toLowerCase()}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <ChevronRight size={12} className="rotate-180" />
            Public Schedule
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center px-4 sm:px-6 gap-4 shrink-0 lg:hidden">
          <button
            className="p-1.5 rounded hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="sidebar-toggle"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-semibold text-sm">Admin Panel</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
