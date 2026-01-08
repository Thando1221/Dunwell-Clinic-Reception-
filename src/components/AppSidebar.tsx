import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarCheck,
  Clock,
  UserPlus,
  Stethoscope,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "Add Patient", url: "/patients/add", icon: UserPlus },
  { title: "Book Appointment", url: "/appointments/book", icon: Calendar },
  { title: "All Bookings", url: "/bookings", icon: CalendarCheck },
  { title: "Attendance", url: "/attendance", icon: Clock },
];

export function AppSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <Sidebar className="bg-[#0D1B2A] text-gray-200 flex flex-col shadow-xl border-r border-gray-700/30 backdrop-blur-xl">
      {/* Brand Header */}
      <SidebarHeader className="bg-gradient-to-br from-[#0D1B2A] to-[#112A45] border-b border-gray-700/30 p-6 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#1B3A5F] rounded-xl shadow-lg">
            <Stethoscope className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-wide text-white">
              Dunwell Clinic
            </h2>
            <p className="text-[11px] text-gray-400 tracking-wide">
              Youth Priority Reception
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 py-6 flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.1em] font-semibold text-gray-400 px-3 mb-3">
            Main Menu
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        clsx(
                          "relative flex items-center gap-3 py-2.5 px-4 rounded-lg text-[15px] font-medium transition-all group",
                          "hover:bg-[#1C324B] hover:text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none",
                          isActive
                            ? "bg-cyan-600/90 text-white shadow-md ring-1 ring-cyan-300"
                            : "text-gray-300"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={clsx(
                              "h-5 w-5 transition-all",
                              isActive
                                ? "text-white drop-shadow-sm"
                                : "text-cyan-300 opacity-75 group-hover:opacity-100"
                            )}
                          />
                          <span>{item.title}</span>
                          {isActive && (
                            <span className="absolute right-2 w-2 h-2 rounded-full bg-white animate-pulse" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700/30">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-red-300 hover:bg-red-900/30 gap-3 py-2.5 rounded-lg transition-all"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </Sidebar>
  );
}
