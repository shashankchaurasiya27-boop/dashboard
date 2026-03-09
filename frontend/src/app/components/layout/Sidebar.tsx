import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  FilePlus,
  FileClock,
  History,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "New Appraisal", href: "/new-appraisal", icon: FilePlus },
  { label: "Pending Drafts", href: "/drafts", icon: FileClock },
  { label: "Evaluation History", href: "/history", icon: History },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    // Only fetch user info if a token exists — avoids unnecessary 401 requests
    if (localStorage.getItem("intelli_token")) {
      api.getCurrentUser()
        .then((u) => setUser(u))
        .catch(() => { }); // silently ignore if token is expired
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("intelli_token");
    window.location.href = "/login";
  };

  const initials = user ? user.username.slice(0, 2).toUpperCase() : "??";
  const displayName = user ? user.username : "Guest";
  const displayRole = user ? (user.role === "manager" ? "Manager / Admin" : "Credit Risk Analyst") : "";

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col fixed left-0 top-0 transition-colors duration-200">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <ShieldCheck className="w-6 h-6 text-indigo-500 mr-2" />
        <span className="font-bold text-slate-100 text-lg">Intelli-Credit AI</span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center bg-slate-800 rounded-md p-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="text-indigo-300 font-semibold text-sm">{initials}</span>
          </div>
          <div className="ml-3 truncate">
            <p className="text-sm font-medium text-slate-100">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{displayRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 rounded-md text-xs text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign out
        </button>
      </div>
    </div>
  );
}
