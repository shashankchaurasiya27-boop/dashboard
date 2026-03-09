import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { NewAppraisal } from "./pages/NewAppraisal";
import { Drafts } from "./pages/Drafts";
import { DraftReview } from "./pages/DraftReview";
import { EvaluationResult } from "./pages/EvaluationResult";
import { History } from "./pages/History";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { LoginPage } from "./pages/LoginPage";

export const router = createBrowserRouter([
  // Login is standalone — no sidebar, no topbar
  { path: "/login", Component: LoginPage },

  // All authenticated pages share the RootLayout (sidebar + topbar)
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "new-appraisal", Component: NewAppraisal },
      { path: "drafts", Component: Drafts },
      { path: "drafts/:id", Component: DraftReview },
      { path: "evaluation/:id", Component: EvaluationResult },
      { path: "history", Component: History },
      { path: "reports", Component: Reports },
      { path: "settings", Component: Settings },
      { path: "*", Component: () => <div className="text-slate-400 p-8 text-center">Page under construction</div> }
    ],
  },
]);

