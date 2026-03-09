import { Outlet } from "react-router";
import { Sidebar } from "./layout/Sidebar";
import { Topbar } from "./layout/Topbar";

export function RootLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-200 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-64 w-full">
        <Topbar />
        <main className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
