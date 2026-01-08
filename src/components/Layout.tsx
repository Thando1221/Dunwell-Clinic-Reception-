import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun } from "lucide-react";
import clsx from "clsx";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  // Apply theme to <html> tag
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <SidebarProvider>
      <div
        className={clsx(
          "min-h-screen flex w-full transition-colors duration-300",
          darkMode ? "bg-[#0D1A2B] text-gray-200" : "bg-[#E9EDF2] text-[#1C2A3A]"
        )}
      >
        {/* Sidebar */}
        <div
          className={clsx(
            "transition-all duration-300",
            sidebarOpen ? "w-64" : "w-0 lg:w-64"
          )}
        >
          <AppSidebar darkMode={darkMode} />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header
            className={clsx(
              "sticky top-0 z-20 shadow-md border-b px-6",
              "backdrop-blur-md transition-colors duration-300",
              darkMode ? "bg-[#13273D]/90 border-[#1E3A52]" : "bg-[#1F3B57]/95 border-[#274766]"
            )}
          >
            <div className="flex h-16 items-center gap-4">
              {/* Mobile Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>

              <div className="flex-1" />

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-full"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-yellow-300" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-300" />
                )}
              </Button>

              {/* User Info */}
              <span className="text-sm font-medium">
                Welcome, <span className="text-cyan-300">Admin</span>
              </span>
            </div>
          </header>

          {/* Page Body */}
          <div className="flex-1 p-6 lg:p-8 animate-fadeIn">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
