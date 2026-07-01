import { Switch, Route, useLocation } from "wouter";
import { useEffect, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

// ─── Error Boundary ────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("App Error:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, background: "#030712", color: "white", minHeight: "100vh", fontFamily: "monospace" }}>
          <h2 style={{ color: "#ff6b6b", marginBottom: 16 }}>App Error — please report this</h2>
          <pre style={{ background: "#1a1a1a", padding: 16, borderRadius: 8, overflow: "auto", fontSize: 12, color: "#ffcc00" }}>
            {(this.state.error as Error).message}
            {"\n\n"}
            {(this.state.error as Error).stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BusinessDataProvider } from "@/contexts/business-data-context";
import { Navigation } from "@/components/navigation";
import { SharedFooter } from "@/components/shared-footer";
import { useAuth } from "@/hooks/useAuth";

// Existing Pages
import Landing from "@/pages/landing";
import GenieSplash from "@/pages/genie-splash";
import AuthPage from "@/pages/AuthPage";
import SiteSettings from "@/pages/site-settings";
import NotFound from "@/pages/not-found";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import ContactPage from "@/pages/contact";
import AboutPage from "@/pages/about";
import ApiSetup from "@/pages/api-setup";
import SitemapPage from "@/pages/sitemap";
import BlogArchive from "@/pages/blog-archive";
import BlogPost from "@/pages/blog-post";

// New Public Pages
import PricingPage from "@/pages/pricing";
import FeaturesPage from "@/pages/features";
import DemoPage from "@/pages/demo";
import AffiliatesPage from "@/pages/affiliates";
import HowToUsePage from "@/pages/how-to-use";

// Auth Pages
import SignupPage from "@/pages/signup";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import VerifyEmailPage from "@/pages/verify-email";
import AcceptInvitePage from "@/pages/accept-invite";
import AuthCallback from "@/pages/auth-callback";

// Dashboard Pages
import DashboardHome from "@/pages/dashboard-home";
import DashboardWebsites from "@/pages/dashboard-websites";
import ArticlesDashboard from "@/pages/articles-dashboard";
import DashboardNewWebsite from "@/pages/dashboard-new-website";
import WDSiteEditor from "@/pages/wd-site-editor";

// Onboarding / AI Wizard Pages
import OnboardingBusiness from "@/pages/onboarding-business";
import OnboardingServices from "@/pages/onboarding-services";
import OnboardingLocations from "@/pages/onboarding-locations";
import OnboardingBrand from "@/pages/onboarding-brand";
import OnboardingApiSetup from "@/pages/onboarding-api-setup";
import OnboardingGenerating from "@/pages/onboarding-generating";
import OnboardingPreview from "@/pages/onboarding-preview";


// Publish & Export
import ExportHistory from "@/pages/export-history";

// Account Settings
import SettingsProfile from "@/pages/settings-profile";
import SettingsBilling from "@/pages/settings-billing";

// Admin Pages
import AdminDashboard from "@/pages/admin-dashboard";
import UserManagement from "@/pages/user-management";
import AdminSubscriptions from "@/pages/admin-subscriptions";
import AdminPrompts from "@/pages/admin-prompts";
import AdminLogs from "@/pages/admin-logs";
import AdminSettings from "@/pages/admin-settings";

// System Pages
import ServerErrorPage from "@/pages/server-error";
import MaintenancePage from "@/pages/maintenance";
import UpgradePage from "@/pages/upgrade";

// Component for public routes with navigation
function PublicRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Redirect old /dashboard/websites/:id to /dashboard/wd-editor/:id
function WDSiteEditorRedirect() {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const id = location.split("/dashboard/websites/")[1]?.split("/")[0];
    if (id) setLocation(`/dashboard/wd-editor/${id}`);
  }, []);
  return null;
}

// Component that requires authentication — redirects to /login if not logged in
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

// Component for admin-only routes
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated (using useEffect to avoid render-time side effects)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  const isAdmin = (user as any)?.role === "admin" || (user as any)?.id === "admin";

  if (!isAdmin) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-24">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();
  const isEditorRoute = location.startsWith("/dashboard/wd-editor/");
  const isSplashRoute = location === "/";

  return (
    <div className={isEditorRoute ? "h-screen overflow-hidden bg-[#030712] text-white flex flex-col" : "min-h-screen bg-gray-950 text-white flex flex-col"}>
      {!isEditorRoute && !isSplashRoute && <Navigation />}
      <main className={isEditorRoute ? "flex-1 flex flex-col overflow-hidden" : isSplashRoute ? "" : "flex-grow flex flex-col"}>
        <Switch>
          {/* ==================== SPLASH (Genie Lamp) ==================== */}
          <Route path="/">
            <GenieSplash />
          </Route>
          {/* ==================== PUBLIC PAGES ==================== */}
          <Route path="/home">
            <Landing />
          </Route>
          <Route path="/pricing">
            <PublicRoute><PricingPage /></PublicRoute>
          </Route>
          <Route path="/features">
            <PublicRoute><FeaturesPage /></PublicRoute>
          </Route>
          <Route path="/demo">
            <PublicRoute><DemoPage /></PublicRoute>
          </Route>
          <Route path="/about">
            <PublicRoute><AboutPage /></PublicRoute>
          </Route>
          <Route path="/contact">
            <PublicRoute><ContactPage /></PublicRoute>
          </Route>
          <Route path="/affiliates">
            <PublicRoute><AffiliatesPage /></PublicRoute>
          </Route>
          <Route path="/how-to-use">
            <PublicRoute><HowToUsePage /></PublicRoute>
          </Route>
          <Route path="/terms">
            <PublicRoute><TermsPage /></PublicRoute>
          </Route>
          <Route path="/privacy">
            <PublicRoute><PrivacyPage /></PublicRoute>
          </Route>
          <Route path="/blog/:slug">
            <PublicRoute><BlogPost /></PublicRoute>
          </Route>
          <Route path="/blog">
            <PublicRoute><BlogArchive /></PublicRoute>
          </Route>
          <Route path="/sitemap">
            <PublicRoute><SitemapPage /></PublicRoute>
          </Route>
          <Route path="/api-setup">
            <AuthRoute><ApiSetup /></AuthRoute>
          </Route>

          {/* ==================== AUTH PAGES ==================== */}
          <Route path="/auth/callback">
            <AuthCallback />
          </Route>
          <Route path="/login">
            <AuthPage />
          </Route>
          <Route path="/signup">
            <PublicRoute><SignupPage /></PublicRoute>
          </Route>
          <Route path="/forgot-password">
            <PublicRoute><ForgotPasswordPage /></PublicRoute>
          </Route>
          <Route path="/reset-password/:token">
            <PublicRoute><ResetPasswordPage /></PublicRoute>
          </Route>
          <Route path="/verify-email/:token">
            <PublicRoute><VerifyEmailPage /></PublicRoute>
          </Route>
          <Route path="/invite/:token">
            <PublicRoute><AcceptInvitePage /></PublicRoute>
          </Route>

          {/* ==================== ONBOARDING / AI WIZARD ==================== */}
          <Route path="/onboarding/business">
            <AuthRoute><OnboardingBusiness /></AuthRoute>
          </Route>
          <Route path="/onboarding/services">
            <AuthRoute><OnboardingServices /></AuthRoute>
          </Route>
          <Route path="/onboarding/locations">
            <AuthRoute><OnboardingLocations /></AuthRoute>
          </Route>
          <Route path="/onboarding/brand">
            <AuthRoute><OnboardingBrand /></AuthRoute>
          </Route>
          <Route path="/onboarding/api-setup">
            <AuthRoute><OnboardingApiSetup /></AuthRoute>
          </Route>
          <Route path="/onboarding/generating">
            <AuthRoute><OnboardingGenerating /></AuthRoute>
          </Route>
          <Route path="/onboarding/preview">
            <AuthRoute><OnboardingPreview /></AuthRoute>
          </Route>

          {/* ==================== DASHBOARD ==================== */}
          <Route path="/dashboard">
            <AuthRoute><DashboardHome /></AuthRoute>
          </Route>
          <Route path="/dashboard/new-website">
            <AuthRoute><DashboardNewWebsite /></AuthRoute>
          </Route>
          <Route path="/dashboard/websites/:id">
            <WDSiteEditorRedirect />
          </Route>
          <Route path="/dashboard/websites">
            <AuthRoute><DashboardWebsites /></AuthRoute>
          </Route>
          <Route path="/dashboard/articles">
            <AuthRoute><ArticlesDashboard /></AuthRoute>
          </Route>


          {/* ==================== EXPORT ==================== */}
          <Route path="/dashboard/exports">
            <AuthRoute><ExportHistory /></AuthRoute>
          </Route>

          {/* ==================== ACCOUNT SETTINGS ==================== */}
          <Route path="/dashboard/settings/profile">
            <AuthRoute><SettingsProfile /></AuthRoute>
          </Route>
          <Route path="/dashboard/settings/api-keys">
            <AuthRoute><ApiSetup /></AuthRoute>
          </Route>
          <Route path="/dashboard/settings/billing">
            <AuthRoute><SettingsBilling /></AuthRoute>
          </Route>

          {/* ==================== ADMIN PANEL ==================== */}
          <Route path="/admin/users">
            <AdminRoute><UserManagement /></AdminRoute>
          </Route>
          <Route path="/admin/subscriptions">
            <AdminRoute><AdminSubscriptions /></AdminRoute>
          </Route>
          <Route path="/admin/prompts">
            <AdminRoute><AdminPrompts /></AdminRoute>
          </Route>
          <Route path="/admin/logs">
            <AdminRoute><AdminLogs /></AdminRoute>
          </Route>
          <Route path="/admin/settings">
            <AdminRoute><AdminSettings /></AdminRoute>
          </Route>
          <Route path="/admin">
            <AdminRoute><AdminDashboard /></AdminRoute>
          </Route>

          {/* Admin Site Settings (legacy) */}
          <Route path="/site-settings">
            <AdminRoute><SiteSettings /></AdminRoute>
          </Route>

          {/* ==================== SYSTEM PAGES ==================== */}
          <Route path="/500">
            <ServerErrorPage />
          </Route>
          <Route path="/maintenance">
            <MaintenancePage />
          </Route>
          <Route path="/upgrade">
            <UpgradePage />
          </Route>
          <Route path="/404">
            <NotFound />
          </Route>

          <Route path="/dashboard/wd-editor/:id">
            <AuthRoute><WDSiteEditor /></AuthRoute>
          </Route>

          {/* 404 Catch-All */}
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isEditorRoute && !isSplashRoute && <SharedFooter />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BusinessDataProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </BusinessDataProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
