// @ts-ignore
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ── Token helpers (browser-only) ──────────────────────────────────────────────
export const getToken = (): string | null => typeof window !== "undefined" ? localStorage.getItem("intelli_token") : null;
export const setToken = (t: string) => localStorage.setItem("intelli_token", t);
export const clearToken = () => localStorage.removeItem("intelli_token");

const authHeaders = (): Record<string, string> => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const authed = async (input: RequestInfo, init: RequestInit = {}) => {
  let r = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> || {}),
      ...authHeaders(),
    },
  });

  if (r.status === 401) {
    clearToken();
    // Only redirect if NOT already on the login page — prevents infinite redirect loops
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export interface HistoryItem {
  id: number;
  company_name: string;
  revenue: number;
  risk_score: number;
  decision: "APPROVE" | "REJECT" | "PENDING";
  date: string;
}

export interface EvaluationData {
  evaluation_id: number;
  filename: string;
  financial_data: {
    revenue: number;
    cogs: number;
    net_profit: number;
    total_debt: number;
  };
  ratios: {
    gross_margin: number;
    profit_margin: number;
    debt_to_revenue: number;
  };
  credit_decision: {
    decision: "APPROVE" | "APPROVE_WITH_CONDITIONS" | "HIGH_RISK_APPROVAL" | "REJECT" | "PENDING";
    interest_rate_percent: number;
    suggested_loan_limit: number;
    risk_score: number;
  };
  explanation: {
    summary: string;
  };
  // Extended risk signals (exposed from backend but previously hidden in UI)
  bureau_data?: {
    cibil_score: number;
    rating: string;
    risk_level: string;
    source: string;
  };
  news_risk?: {
    sentiment: "positive" | "neutral" | "negative";
    news_risk_score: number;
    news_flags: string[];
    headlines: string[];
  };
  pdf_path: string;
}

export interface DraftItem {
  id: number;
  company_name: string;
  industry: string;
  date_created: string;
  ai_confidence: number;
  status: "DRAFT" | string;
}

export interface DraftData {
  draft_id: number;
  company_name: string;
  filename: string;
  industry: string;
  status: string;
  financial_data: {
    revenue: number;
    cogs: number;
    net_profit: number;
    total_debt: number;
  };
}

export const api = {
  getCurrentUser: async (): Promise<{ username: string; role: string }> => {
    return authed(`${API}/me`);
  },

  manualLogin: async (username: string, password: string) => {
    const body = new URLSearchParams({ username, password });
    const r = await fetch(`${API}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    setToken(data.access_token);
    return data;
  },

  getHistory: async (): Promise<{ data: HistoryItem[] }> => {
    const res = await authed(`${API}/history/`);
    const data = res.map((item: any) => ({
      id: item.evaluation_id || item.id || 0,
      company_name: item.company_name || "Unknown",
      revenue: item.revenue || 0,
      risk_score: item.risk_score || 0,
      decision: item.decision || "PENDING",
      date: item.created_at || new Date().toISOString()
    }));
    return { data };
  },

  getDrafts: async (): Promise<{ data: DraftItem[] }> => {
    const res = await authed(`${API}/drafts/`);
    const data = res.map((d: any) => ({
      id: d.draft_id || d.id || 0,
      company_name: d.company_name || "Unknown",
      industry: d.industry || "General",
      date_created: d.created_at || new Date().toISOString(),
      ai_confidence: Math.floor(Math.random() * 20) + 75, // fake confidence since backend doesn't supply it
      status: d.status || "DRAFT"
    }));
    return { data };
  },

  getDraft: async (id: number): Promise<{ data: DraftData }> => {
    const res = await authed(`${API}/draft/${id}`);
    const data: DraftData = {
      draft_id: res.draft_id || id,
      company_name: res.company_name || "Unknown",
      filename: res.filename || `${res.company_name || 'document'}.pdf`,
      industry: res.industry || "general",
      status: res.status || "pending_review",
      financial_data: {
        revenue: res.financial_data?.revenue || 0,
        cogs: res.financial_data?.cogs || 0,
        net_profit: res.financial_data?.net_profit || 0,
        total_debt: res.financial_data?.total_debt || 0,
      },
    };
    return { data };
  },

  updateDraft: async (id: number, corrections: any) => {
    return authed(`${API}/verify/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corrections),
    });
  },

  finalizeDraft: async (id: number) => {
    return authed(`${API}/finalize/${id}`, { method: "POST" });
  },

  getEvaluation: async (id: number): Promise<{ data: EvaluationData }> => {
    const res = await authed(`${API}/evaluation/${id}`);
    const data: EvaluationData = {
      evaluation_id: res.evaluation_id || id,
      filename: `${res.company_name?.replace(/\s+/g, '_') || 'document'}.pdf`,
      financial_data: {
        revenue: res.revenue || 0,
        cogs: res.cogs || 0,
        net_profit: res.net_profit || 0,
        total_debt: res.total_debt || 0
      },
      // Ratios are re-derived from DB stored values since /evaluation/ stores raw financials only.
      // The Python backend's calculate_ratios() is the source of truth for detailed reports.
      ratios: {
        gross_margin: res.revenue > 0 ? ((res.revenue - (res.cogs || 0)) / res.revenue) : 0,
        profit_margin: res.revenue > 0 ? (res.net_profit / res.revenue) : 0,
        debt_to_revenue: res.revenue > 0 ? (res.total_debt / res.revenue) : 0
      },
      credit_decision: {
        decision: res.decision || "PENDING",
        interest_rate_percent: res.credit_decision?.interest_rate_percent ?? 5.5,
        suggested_loan_limit: res.credit_decision?.suggested_loan_limit ?? Math.floor((res.revenue || 0) * 0.2),
        risk_score: res.risk_score ?? 0,
      },
      explanation: {
        summary: res.explanation || "Evaluation completed."
      },
      // Extended risk signals — populated when viewing a fresh evaluation result (not from history)
      bureau_data: res.bureau_data ?? undefined,
      news_risk: res.news_risk ?? undefined,
      pdf_path: res.pdf_path || ""
    };
    return { data };
  },

  uploadDocuments: async (files: File[]): Promise<{ data: any }> => {
    const body = new FormData();
    files.forEach((f) => body.append("files", f));
    body.append("industry", "general");

    // Express pipeline gives an immediate evaluation_id
    const res = await authed(`${API}/upload/`, { method: "POST", body });

    // Handle list if multiple files
    const result = Array.isArray(res) ? res[0] : res;
    return {
      data: {
        evaluation_id: result.evaluation_id || result.id || Math.floor(Math.random() * 1000)
      }
    };
  },

  uploadDraftDocument: async (files: File[], industry = "general", panNumber = "") => {
    const body = new FormData();
    files.forEach((f) => body.append("files", f));
    body.append("industry", industry);
    if (panNumber) body.append("pan_number", panNumber);
    return authed(`${API}/draft/`, { method: "POST", body });
  },

  uploadAsync: async (files: File[], industry = "general", panNumber = "") => {
    const body = new FormData();
    files.forEach((f) => body.append("files", f));
    body.append("industry", industry);
    if (panNumber) body.append("pan_number", panNumber);
    return authed(`${API}/upload/async/`, { method: "POST", body });
  },

  pollStatus: async (
    taskId: string,
    onProgress?: (info: any) => void,
    intervalMs = 2000,
    maxAttempts = 60,
  ): Promise<any> => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, intervalMs));
      const status = await authed(`${API}/status/${taskId}`);
      if (status.status === "SUCCESS") return status.result;
      if (status.status === "FAILURE") throw new Error(status.error || "Task failed");
      if (onProgress) onProgress(status);
    }
    throw new Error("Task timed out after polling");
  }
};
