import React, { lazy, Suspense, useState, useRef, useEffect } from "react";
import Login from "./pages/Login";
import { Button } from "./components/ui/button";
import { LayoutDashboard, Users, LogOut, Menu, X, Calendar, Activity } from "lucide-react";
import { User } from "./types";
import { logoutApi, getToken, api } from "./services/api";
import { ToastContainer } from "./components/ui/toast";
import { Spinner } from "./components/ui/spinner";
import { BrandLogo } from "./components/auth/BrandPanel";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Patients = lazy(() => import("./pages/Patients"));
const PatientDetails = lazy(() => import("./pages/PatientDetails"));
const SessionDetails = lazy(() => import("./pages/SessionDetails"));
const Schedule = lazy(() => import("./pages/Schedule"));
const UnitStats = lazy(() => import("./pages/UnitStats"));

type Page =
  | "login"
  | "dashboard"
  | "patients"
  | "patient_details"
  | "session_details"
  | "schedule"
  | "unit_stats";

type NavigationState = {
  page: Page;
  id?: number;
  parentId?: number;
  fromPage?: string;
};

const APP_PAGES: Page[] = [
  "login",
  "dashboard",
  "patients",
  "patient_details",
  "session_details",
  "schedule",
  "unit_stats",
];

function isNavigationState(value: unknown): value is NavigationState {
  if (!value || typeof value !== "object") return false;
  return APP_PAGES.includes((value as NavigationState).page);
}

function navigationUrl(state: NavigationState) {
  switch (state.page) {
    case "dashboard":
      return "/dashboard";
    case "patients":
      return "/patients";
    case "patient_details":
      return `/patients/${state.id ?? ""}`;
    case "session_details":
      return state.id === 0
        ? `/patients/${state.parentId ?? ""}/sessions/new`
        : `/sessions/${state.id ?? ""}`;
    case "schedule":
      return "/schedule";
    case "unit_stats":
      return "/analytics";
    default:
      return "/login";
  }
}

function navigationFromLocation(): NavigationState {
  // Convert old hash-based bookmarks once, then keep clean browser paths.
  const legacyHashPath = window.location.hash.startsWith("#/")
    ? window.location.hash.slice(1)
    : "";
  const routePath = legacyHashPath || window.location.pathname;
  const segments = routePath.replace(/^\/?/, "").split("/").filter(Boolean);
  if (segments[0] === "dashboard") return { page: "dashboard" };
  if (segments[0] === "patients" && segments[1]) {
    const patientId = Number(segments[1]);
    if (segments[2] === "sessions" && segments[3] === "new") {
      return { page: "session_details", id: 0, parentId: patientId, fromPage: "patient_details" };
    }
    return { page: "patient_details", id: patientId, fromPage: "patients" };
  }
  if (segments[0] === "patients") return { page: "patients" };
  if (segments[0] === "sessions" && segments[1]) {
    return { page: "session_details", id: Number(segments[1]) };
  }
  if (segments[0] === "schedule") return { page: "schedule" };
  if (segments[0] === "analytics") return { page: "unit_stats" };
  return { page: "login" };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [currentId, setCurrentId] = useState<number | undefined>(undefined);
  const [parentId, setParentId] = useState<number | undefined>(undefined);
  const [fromPage, setFromPage] = useState<string | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const applyNavigationState = (state: NavigationState) => {
    setCurrentPage(state.page);
    setCurrentId(state.id);
    setParentId(state.parentId);
    setFromPage(state.fromPage);
  };

  // Restore session from stored JWT on mount
  useEffect(() => {
    const requestedState = isNavigationState(window.history.state)
      ? window.history.state
      : navigationFromLocation();
    const token = getToken();
    if (token) {
      api.me()
        .then((user) => {
          setCurrentUser(user);
          const destination = requestedState.page === "login"
            ? { page: "dashboard" as Page }
            : requestedState;
          applyNavigationState(destination);
          window.history.replaceState(destination, "", navigationUrl(destination));
        })
        .catch(() => {
          logoutApi();
          const loginState: NavigationState = { page: "login" };
          applyNavigationState(loginState);
          window.history.replaceState(loginState, "", navigationUrl(loginState));
        });
    } else {
      const loginState: NavigationState = { page: "login" };
      applyNavigationState(loginState);
      window.history.replaceState(loginState, "", navigationUrl(loginState));
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const destination = isNavigationState(event.state)
        ? event.state
        : navigationFromLocation();

      if (destination.page !== "login" && !getToken()) {
        const loginState: NavigationState = { page: "login" };
        applyNavigationState(loginState);
        window.history.replaceState(loginState, "", navigationUrl(loginState));
        return;
      }

      applyNavigationState(destination);
      setMobileMenuOpen(false);
      setUserMenuOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

  const handleNavigate = (page: string, id?: number) => {
    if (!APP_PAGES.includes(page as Page)) return;

    let nextId: number | undefined;
    let nextParentId: number | undefined;
    let nextFromPage: string | undefined;

    if (page === "session_details") {
      if (id && id !== 0) {
        nextId = id;
        nextParentId = parentId;
        nextFromPage = fromPage;
      } else {
        nextParentId = currentId;
        nextId = 0;
        nextFromPage = fromPage;
      }
    } else if (page === "patient_details") {
      // When returning from session_details → patient_details, preserve fromPage
      // so the Back button on PatientDetails still goes to the original page (e.g. "patients")
      if (currentPage !== "session_details") {
        nextFromPage = currentPage;
      } else {
        nextFromPage = fromPage;
      }
      nextId = id;
    }

    const destination: NavigationState = {
      page: page as Page,
      id: nextId,
      parentId: nextParentId,
      fromPage: nextFromPage,
    };
    applyNavigationState(destination);
    window.history.pushState(destination, "", navigationUrl(destination));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    const destination: NavigationState = { page: "dashboard" };
    applyNavigationState(destination);
    window.history.pushState(destination, "", navigationUrl(destination));
  };

  const handleLogout = () => {
    logoutApi();
    setCurrentUser(null);
    const destination: NavigationState = { page: "login" };
    applyNavigationState(destination);
    window.history.pushState(destination, "", navigationUrl(destination));
  };

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <Login onLogin={handleLogin} />;
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} user={currentUser!} />;
      case "patients":
        return <Patients onNavigate={handleNavigate} user={currentUser!} />;
      case "patient_details":
        return (
          <PatientDetails
            patientId={currentId!}
            onNavigate={handleNavigate}
            user={currentUser!}
            fromPage={fromPage}
          />
        );
      case "session_details":
        return (
          <SessionDetails
            sessionId={currentId!}
            patientId={parentId}
            onNavigate={handleNavigate}
            user={currentUser!}
          />
        );
      case "schedule":
        return <Schedule onNavigate={handleNavigate} />;
      case "unit_stats":
        return <UnitStats onNavigate={handleNavigate} />;
      default:
        return <div>Page not found</div>;
    }
  };

  if (currentPage === "login") {
    return (
      <>
        <div className="min-h-screen bg-muted/20">{renderPage()}</div>
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 border-b bg-background shadow-sm">
        <div className="flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center">
            <BrandLogo compact />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 items-center gap-1 md:flex md:mx-8">
            <button
              onClick={() => handleNavigate("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 text-sm md:text-base font-medium transition-all duration-200 border-b-2 ${currentPage === "dashboard"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>
            <button
              onClick={() => handleNavigate("patients")}
              className={`flex items-center gap-2 px-4 py-2 text-sm md:text-base font-medium transition-all duration-200 border-b-2 ${currentPage === "patients" || currentPage === "patient_details"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <Users className="h-5 w-5" />
              Patients
            </button>
            <button
              onClick={() => handleNavigate("schedule")}
              className={`flex items-center gap-2 px-4 py-2 text-sm md:text-base font-medium transition-all duration-200 border-b-2 ${currentPage === "schedule"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <Calendar className="h-5 w-5" />
              Schedule
            </button>
            {currentUser?.role !== "nurse" && (
              <button
                onClick={() => handleNavigate("unit_stats")}
                className={`flex items-center gap-2 px-4 py-2 text-sm md:text-base font-medium transition-all duration-200 border-b-2 ${currentPage === "unit_stats"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Activity className="h-5 w-5" />
                Unit Stats
              </button>
            )}
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-2 sm:gap-4 relative">
            {/* User Avatar Circle */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors flex items-center justify-center flex-shrink-0"
                title={currentUser?.full_name}
              >
                {currentUser?.full_name?.charAt(0).toUpperCase() || "U"}
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-background border border-border shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">
                      {currentUser?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {currentUser?.role === "guest" ? "Read-only guest" : currentUser?.role}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-primary h-10 w-10"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="border-t bg-background md:hidden">
            <div className="flex flex-col">
              <button
                onClick={() => {
                  handleNavigate("dashboard");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${currentPage === "dashboard"
                  ? "bg-primary/10 text-primary border-l-2 border-l-primary"
                  : "text-foreground hover:bg-muted"
                  }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  handleNavigate("patients");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${currentPage === "patients" ||
                  currentPage === "patient_details"
                  ? "bg-primary/10 text-primary border-l-2 border-l-primary"
                  : "text-foreground hover:bg-muted"
                  }`}
              >
                <Users className="h-5 w-5" />
                Patients
              </button>
              <button
                onClick={() => {
                  handleNavigate("schedule");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${currentPage === "schedule"
                  ? "bg-primary/10 text-primary border-l-2 border-l-primary"
                  : "text-foreground hover:bg-muted"
                  }`}
              >
                <Calendar className="h-5 w-5" />
                Schedule
              </button>
              {currentUser?.role !== "nurse" && (
                <button
                  onClick={() => {
                    handleNavigate("unit_stats");
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${currentPage === "unit_stats"
                    ? "bg-primary/10 text-primary border-l-2 border-l-primary"
                    : "text-foreground hover:bg-muted"
                    }`}
                >
                  <Activity className="h-5 w-5" />
                  Unit Stats
                </button>
              )}
            </div>
          </nav>
        )}
        </header>
        <main className="flex-1 bg-background p-4 sm:p-6 md:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <Suspense
              fallback={
                <div className="flex min-h-48 items-center justify-center" role="status">
                  <Spinner size="lg" className="text-primary" />
                  <span className="sr-only">Loading workspace</span>
                </div>
              }
            >
              {renderPage()}
            </Suspense>
          </div>
        </main>
      </div>
      <ToastContainer />
    </>
  );
}
