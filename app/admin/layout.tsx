"use client";

import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import AdminHeader from "@/components/AdminHeader";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// Redux
import { Provider } from "react-redux";
import { store } from "@/redux/store";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isAuthPage =
    pathname?.includes("/login") || pathname?.includes("/register");

  // Route protection: redirect to login if not authenticated on protected pages
  useEffect(() => {
    if (status === "loading") return;
    if (!session && !isAuthPage) {
      router.replace("/admin/login");
    }
    if (session && isAuthPage) {
      router.replace("/admin");
    }
  }, [session, status, isAuthPage, router]);

  // Show nothing while checking auth on protected pages to avoid flash
  if (status === "loading" && !isAuthPage) return null;
  if (!session && !isAuthPage) return null;

  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {!isAuthPage ? (
          <div className="flex h-screen overflow-hidden bg-[var(--background)]">

            {/* ── Mobile overlay backdrop ── */}
            {mobileOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
            )}

            {/* ── Sidebar ── */}
            <aside
              className={`
                fixed top-0 left-0 h-screen z-50
                p-4 overflow-hidden
                bg-[var(--sidebar)] text-[var(--sidebar-foreground)]
                border-r border-[var(--sidebar-border)]
                transition-all duration-300
                ${collapsed ? "w-20" : "w-64"}
                ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0
              `}
            >
              <Sidebar
                collapsed={collapsed}
                onMobileClose={() => setMobileOpen(false)}
              />
            </aside>

            {/* ── Collapse toggle — desktop only ── */}
            <div
              className="hidden lg:block fixed top-[20px] -translate-x-1/2 z-50 transition-all duration-300"
              style={{ left: collapsed ? "80px" : "256px" }}
            >
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="bg-[var(--background)] border border-[var(--border)] rounded-full p-1 shadow-md hover:bg-[var(--muted)] transition"
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* ── Main content ── */}
            <div
              className={`
                flex flex-col flex-1 min-w-0
                transition-all duration-300
                ${collapsed ? "lg:ml-20" : "lg:ml-64"}
              `}
            >
              <AdminHeader onMenuClick={() => setMobileOpen((o) => !o)} />
              <main className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 min-h-full">
                  {children}
                </div>
              </main>
            </div>

          </div>
        ) : (
          <main>{children}</main>
        )}
      </ThemeProvider>
    </Provider>
  );
};

export default AdminLayout;
