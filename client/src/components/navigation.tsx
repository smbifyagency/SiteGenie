import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LogOut,
  Globe,
  ChevronDown,
  LayoutDashboard,
  Globe2,
  Search,
  Settings,
  User,
  CreditCard,
  Key,
  Users,
  BarChart3,
  Plug,
  Paintbrush,
  Bell,
  Shield,
  FileText,
  Activity,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = (user as any)?.role === "admin" || (user as any)?.id === "admin";
  const isOnDashboard = location.startsWith("/dashboard") || location.startsWith("/admin");

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error) {
      console.error("Logout error:", error);
      setLocation("/");
    }
  };

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const navLink = (href: string, label: string, onClick?: () => void) => (
    <Link href={href}>
      <button
        onClick={() => {
          setActiveDropdown(null);
          setMobileMenuOpen(false);
          onClick?.();
        }}
        className={`text-sm px-3 py-2 rounded-lg transition-colors ${location === href
          ? "text-purple-700 bg-purple-50"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
      >
        {label}
      </button>
    </Link>
  );

  // ===== PUBLIC NAVIGATION (for non-dashboard pages) =====
  const renderPublicNav = () => (
    <>
      {navLink("/home", "Home")}
      {navLink("/features", "Features")}
      {navLink("/pricing", "Pricing")}
      {navLink("/demo", "Demo")}
      {navLink("/how-to-use", "How to Use")}
      {navLink("/about", "About")}
      {navLink("/contact", "Contact")}
    </>
  );

  // ===== DASHBOARD NAVIGATION (for logged-in users on dashboard) =====
  const renderDashboardNav = () => (
    <>
      {navLink("/dashboard", "Dashboard")}
      {navLink("/dashboard/websites", "Websites")}
      {navLink("/dashboard/articles", "Articles")}

      {/* Settings Dropdown */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("settings")}
          className={`text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${location.startsWith("/dashboard/settings")
            ? "text-purple-700 bg-purple-50"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
        >
          Settings <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === "settings" ? "rotate-180" : ""}`} />
        </button>
        {activeDropdown === "settings" && (
          <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-100 p-2 z-50">
            {[
              { href: "/dashboard/settings/profile", label: "Profile", icon: User },
              { href: "/dashboard/settings/api-keys", label: "API Keys", icon: Key },
              { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    onClick={() => { setActiveDropdown(null); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${location === item.href ? "text-purple-700 bg-purple-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                  >
                    <Icon className="h-4 w-4" /> {item.label}
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Dropdown (only for admin users) */}
      {isAdmin && (
        <div className="relative">
          <button
            onClick={() => toggleDropdown("admin")}
            className={`text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${location.startsWith("/admin")
              ? "text-purple-700 bg-purple-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
          >
            Admin <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === "admin" ? "rotate-180" : ""}`} />
          </button>
          {activeDropdown === "admin" && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-100 p-2 z-50">
              {[
                { href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
                { href: "/admin/users", label: "Users", icon: Users },
                { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
                { href: "/admin/prompts", label: "Prompts", icon: FileText },
                { href: "/admin/logs", label: "Gen Logs", icon: Activity },
                { href: "/admin/settings", label: "System Settings", icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      onClick={() => { setActiveDropdown(null); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${location === item.href ? "text-purple-700 bg-purple-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      <Icon className="h-4 w-4" /> {item.label}
                    </button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );

  // ===== MOBILE MENU ITEMS =====
  const mobilePublicItems = [
    { path: "/", label: "Home" },
    { path: "/features", label: "Features" },
    { path: "/pricing", label: "Pricing" },
    { path: "/demo", label: "Demo" },
    { path: "/how-to-use", label: "How to Use" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
    { path: "/affiliates", label: "Affiliates" },
  ];

  const mobileDashboardItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/dashboard/websites", label: "Websites" },
    { path: "/dashboard/articles", label: "Articles" },
    { path: "/dashboard/exports", label: "Exports" },
    { path: "/dashboard/settings/profile", label: "Profile" },
    { path: "/dashboard/settings/api-keys", label: "API Keys" },
    { path: "/dashboard/settings/billing", label: "Billing" },
    { path: "/dashboard/settings/team", label: "Team" },
    { path: "/dashboard/settings/notifications", label: "Notifications" },
  ];

  const mobileAdminItems = [
    { path: "/admin", label: "Admin Dashboard" },
    { path: "/admin/users", label: "Users" },
    { path: "/admin/subscriptions", label: "Subscriptions" },
    { path: "/admin/prompts", label: "Prompts" },
    { path: "/admin/logs", label: "Gen Logs" },
    { path: "/admin/settings", label: "System Settings" },
  ];

  const mobileItems = isOnDashboard
    ? [...mobileDashboardItems, ...(isAdmin ? mobileAdminItems : [])]
    : mobilePublicItems;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50" ref={dropdownRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/home">
              <div className="flex items-center gap-2 cursor-pointer group">
                <img src="/favicon.svg" alt="SiteGenie" className="h-9 w-9 rounded-lg shadow-lg group-hover:shadow-purple-500/30 transition-all" />
                <h1 className="text-lg font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">Site</span><span className="bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent">Genie</span>
                </h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {isOnDashboard && isAuthenticated ? renderDashboardNav() : renderPublicNav()}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Magic Lamp — re-enter genie splash */}
            <Link href="/">
              <button
                className="group relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-amber-500/10 transition-all"
                title="✨ Rub the magic lamp"
              >
                <svg viewBox="0 0 300 260" className="h-6 w-6 drop-shadow-sm group-hover:drop-shadow-lg transition-all">
                  <ellipse cx="148" cy="220" rx="80" ry="20" fill="#B8860B" opacity="0.4" />
                  <path d="M76 195 C76 145, 100 115, 148 105 C196 115, 220 145, 220 195 Z" fill="#D4A017" />
                  <ellipse cx="148" cy="195" rx="72" ry="18" fill="#FBBF24" opacity="0.6" />
                  <path d="M120 108 L118 85 C118 78, 125 72, 148 70 C171 72, 178 78, 178 85 L176 108" fill="#E8B818" />
                  <path d="M122 85 C122 65, 132 52, 148 48 C164 52, 174 65, 174 85" fill="#F5C842" />
                  <circle cx="148" cy="42" r="4" fill="#FBBF24"><animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" /></circle>
                  <path d="M220 175 C238 168, 252 165, 262 148 C268 138, 270 130, 265 122" stroke="#D4A017" strokeWidth="12" fill="none" strokeLinecap="round" />
                  <path d="M76 155 C52 150, 38 165, 40 185 C42 200, 56 210, 76 200" stroke="#D4A017" strokeWidth="10" fill="none" strokeLinecap="round" />
                </svg>
                <span className="absolute -bottom-0.5 -right-0.5 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">✨</span>
              </button>
            </Link>

            {isAuthenticated ? (
              <>
                {!isOnDashboard && (
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                    </Button>
                  </Link>
                )}
                {isOnDashboard && (
                  <Link href="/home">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                      <Globe className="h-4 w-4 mr-2" /> Home
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  data-testid="button-logout-desktop"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-[#7C3AED] hover:bg-[#9333EA] text-white font-semibold shadow-lg shadow-[#7C3AED]/25">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-6 space-y-1 border-t border-gray-200">
              {mobileItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${location === item.path
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </button>
                </Link>
              ))}

              <div className="h-px bg-gray-200 my-3" />

              {isAuthenticated ? (
                <>
                  {!isOnDashboard && (
                    <Link href="/dashboard">
                      <button onClick={() => setMobileMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-purple-700 hover:bg-purple-50">
                        <LayoutDashboard className="h-4 w-4 inline mr-2" /> Dashboard
                      </button>
                    </Link>
                  )}
                  {isOnDashboard && (
                    <Link href="/home">
                      <button onClick={() => setMobileMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                        <Globe className="h-4 w-4 inline mr-2" /> Home
                      </button>
                    </Link>
                  )}
                  <button
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 inline mr-2" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <button onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Login
                    </button>
                  </Link>
                  <Link href="/signup">
                    <button onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center mt-2 px-4 py-3 rounded-xl text-sm font-semibold bg-[#7C3AED] hover:bg-[#9333EA] text-white">
                      Get Started Free
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
