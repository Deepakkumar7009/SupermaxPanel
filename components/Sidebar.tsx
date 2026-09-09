"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";

import {
  Home,
  Box,
  ListOrdered,
  Receipt,
  User,
  Package,
  DollarSign,
  Users,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onMobileClose: () => void;
}

const Sidebar = ({ collapsed, onMobileClose }: SidebarProps) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const itemRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const allMenuItems = [
    { name: "Dashboard",    href: "/admin",               icon: Home,         roles: ["superadmin", "user"] },
    { name: "Users",        href: "/admin/users",         icon: Users,        roles: ["superadmin"] },
    { name: "Categories",   href: "/admin/categories",    icon: Box,          roles: ["superadmin", "user"] },
    { name: "Products",     href: "/admin/products",      icon: Package,      roles: ["superadmin", "user"] },
    { name: "Orders",       href: "/admin/orders",        icon: ListOrdered,  roles: ["superadmin", "user"] },
    { name: "Factory Exp",  href: "/admin/factoryExpense", icon: Receipt,     roles: ["superadmin", "user"] },
    { name: "Raw Material", href: "/admin/rawMaterial",   icon: Package,      roles: ["superadmin", "user"] },
    { name: "Employee Exp", href: "/admin/employees",     icon: User,         roles: ["superadmin", "user"] },
    { name: "Customers",    href: "/admin/customers",     icon: User,         roles: ["superadmin", "user"] },
    { name: "Total Exp",    href: "/admin/totalExpenses", icon: DollarSign,   roles: ["superadmin", "user"] },
  ];

  const role = session?.user.role ?? "user";
  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  const handleMouseEnter = (itemName: string) => {
    const element = itemRefs.current[itemName];
    if (element) {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({ top: rect.top + rect.height / 2, left: rect.right + 12 });
    }
    setHoveredItem(itemName);
  };

  const handleMouseLeave = () => setHoveredItem(null);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-[var(--sidebar-border)] pb-4">
        {collapsed ? (
          <div className="flex justify-center">
            <Image
              src="https://thumbs.dreamstime.com/b/admin-sign-laptop-icon-stock-vector-166205404.jpg?w=768"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-xl border border-[var(--border)]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <Image
              src="https://thumbs.dreamstime.com/b/admin-sign-laptop-icon-stock-vector-166205404.jpg?w=768"
              alt="Logo"
              width={42}
              height={42}
              className="rounded-xl border border-[var(--border)]"
            />
            <div>
              <h2 className="text-lg font-bold">Admin Panel</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Management System</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="mt-5 flex-1 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li
                key={item.name}
                className="relative group"
                onMouseEnter={() => collapsed && handleMouseEnter(item.name)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  ref={(el) => { itemRefs.current[item.name] = el; }}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`
                    relative flex items-center rounded-xl px-3 py-3
                    transition-all duration-300
                    ${collapsed ? "justify-center" : "gap-3"}
                    ${isActive
                      ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)] shadow-sm"
                      : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:scale-[1.02]"
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[var(--sidebar-primary)]" />
                  )}
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[var(--sidebar-primary)]" : ""}`} />
                  {!collapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="mt-auto border-t border-[var(--sidebar-border)] pt-4">
          <div className="rounded-xl bg-[var(--muted)] p-3">
            <p className="text-sm font-medium truncate">
              {session?.user.name ?? "Admin"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] capitalize">
              {role === "superadmin" ? "Super Admin" : "User"}
            </p>
          </div>
        </div>
      )}

      {/* Portal Tooltip */}
      {mounted && collapsed && hoveredItem &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{ top: tooltipPosition.top, left: tooltipPosition.left, transform: "translateY(-50%)" }}
          >
            <div className="relative">
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2">
                <div className="h-2 w-2 rotate-45 bg-[var(--tooltip-bg)]" />
              </div>
              <div className="rounded-lg bg-[var(--tooltip-bg)] px-4 py-2.5 text-sm font-medium text-[var(--tooltip-text)] shadow-lg border border-[var(--border)] whitespace-nowrap min-w-[80px] text-center animate-in fade-in-0 zoom-in-95 duration-200">
                {hoveredItem}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Sidebar;
