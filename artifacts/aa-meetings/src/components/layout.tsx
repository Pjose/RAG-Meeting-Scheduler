import { Link, useLocation } from "wouter";
import { Calendar, Users, LayoutDashboard, Menu, X, ChevronRight, Printer, Building2, LogOut, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth, useLogout, canManage, isAdmin } from "@/lib/auth";

interface LayoutProps {
  children: React.ReactNode;
  admin?: boolean;
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: auth } = useAuth();
  const logout = useLogout();

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-xs sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
              <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
                <circle cx="16" cy="16" r="13" fill="none" stroke="#c49a3c" strokeWidth="2" />
                <polygon points="16,7 25,23 7,23" fill="none" stroke="#c49a3c" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm tracking-tight">Meeting Directory</span>
              <p className="text-xs text-muted-foreground hidden sm:block">Find a meeting near you</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={cn(
                "text-xs px-3 py-1.5 rounded border transition-colors",
                location === "/"
                  ? "border-primary/40 text-primary bg-primary/8"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted"
              )}
            >
              Meetings
            </Link>
            <Link
              href="/hi"
              className={cn(
                "text-xs px-3 py-1.5 rounded border transition-colors",
                location === "/hi"
                  ? "border-primary/40 text-primary bg-primary/8"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted"
              )}
            >
              H&amp;I
            </Link>
            {auth?.authenticated ? (
              <>
                {canManage(auth.role) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded border border-border hover:border-border/80 hover:bg-muted"
                  >
                    <LayoutDashboard size={12} />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded border border-border hover:border-border/80 hover:bg-muted"
                >
                  <LogOut size={12} />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/admin"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded border border-border hover:border-border/80 hover:bg-muted"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/meetings", label: "Meetings", icon: Calendar },
  { href: "/admin/hi-meetings", label: "H&I", icon: Building2 },
  { href: "/admin/people", label: "People", icon: Users },
  { href: "/admin/trusted-servants", label: "Trusted Servants", icon: Star },
];

const printNav = [
  { href: "/admin/print/schedule", label: "Weekly Schedule", icon: Printer },
  { href: "/admin/print/hi-schedule", label: "H&I Schedule", icon: Printer },
  { href: "/admin/print/contacts", label: "Contact List", icon: Printer },
  { href: "/admin/print/trusted-servants", label: "Trusted Servants", icon: Printer },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: auth, isLoading: authLoading } = useAuth();
  const logout = useLogout();

  useEffect(() => {
    if (!authLoading) {
      if (!auth?.authenticated) {
        setLocation("/admin/login");
      } else if (auth.role === "Member" || auth.role === "Guest") {
        setLocation("/");
      }
    }
  }, [authLoading, auth, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!auth?.authenticated || auth.role === "Member" || auth.role === "Guest") return null;

  const visibleAdminNav = isAdmin(auth.role)
    ? adminNav
    : adminNav.filter((n) => n.href !== "/admin/people");

  async function handleLogout() {
    await logout();
    setLocation("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 bg-sidebar flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:flex",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="admin-sidebar"
      >
        <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: "#c49a3c" }}>
            <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
              <circle cx="16" cy="16" r="13" fill="none" stroke="#3b6d11" strokeWidth="2" />
              <polygon points="16,7 25,23 7,23" fill="none" stroke="#3b6d11" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-sidebar-foreground text-sm">Admin Panel</span>
            <p className="text-xs text-sidebar-foreground/60">Meeting Directory</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {visibleAdminNav.map(({ href, label, icon: Icon }) => {
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

          <div className="pt-3 pb-1 px-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Print</p>
          </div>
          {printNav.map(({ href, label, icon: Icon }) => {
            const active = location === href;
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
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <ChevronRight size={12} className="rotate-180" />
            Public Schedule
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors w-full"
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
