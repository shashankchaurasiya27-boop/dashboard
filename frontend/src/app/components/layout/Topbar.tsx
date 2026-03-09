import { Bell, Search, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNotificationClick = () => {
    toast("No new notifications", {
      description: "You're all caught up! Check back later.",
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-200">
      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
        {/* Breadcrumbs could go here based on route */}
        <span>Dashboard</span>
        <span className="mx-2">/</span>
        <span className="text-slate-900 dark:text-slate-200 font-medium">Overview</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 border border-slate-300 dark:border-slate-700 rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <button 
          className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 relative cursor-pointer transition-colors"
          onClick={handleNotificationClick}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
        <button 
          className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition-colors"
          onClick={toggleTheme}
        >
          {mounted && theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
