import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Download, Eye, FileText, Search, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { api, HistoryItem } from "../../lib/api";

export function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.getHistory()
      .then((res) => {
        setHistory(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load history:", err);
        setLoading(false);
      });
  }, []);

  const handleDownload = (id: number, companyName: string) => {
    const t = localStorage.getItem("intelli_token");
    fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/download/${id}`, {
      headers: t ? { Authorization: `Bearer ${t}` } : {}
    })
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${companyName.replace(/\s+/g, '_')}_CAM.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  const filteredHistory = history.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Check if the query matches ID (like "# 201" or "201")
    const idMatch = `#${item.id}`.includes(query.replace(/\s+/g, '')) || String(item.id).includes(query);
    const companyMatch = item.company_name.toLowerCase().includes(query);
    const decisionMatch = item.decision.toLowerCase().includes(query);

    return idMatch || companyMatch || decisionMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Evaluation History</h1>
          <p className="text-slate-400">View and manage past credit evaluations and CAM reports.</p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-md pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Evaluation ID</th>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Risk Score</th>
                  <th className="px-6 py-4 font-medium">Decision</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse bg-slate-900/50">
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-5 w-16 bg-slate-700 rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-32 bg-slate-700 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <FileText className="mx-auto h-8 w-8 mb-3 opacity-20" />
                      <p>No matching evaluation history found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-300">#{item.id}</td>
                      <td className="px-6 py-4 text-slate-200 font-medium">{item.company_name}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${item.risk_score >= 80 ? 'text-emerald-400' :
                          item.risk_score <= 50 ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                          {item.risk_score}
                        </span>
                        <span className="text-slate-500 text-xs ml-1">/ 100</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          item.decision === "APPROVE" ? "success" :
                            item.decision === "REJECT" ? "destructive" : "warning"
                        }>
                          {item.decision}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
                            <Link to={`/evaluation/${item.id}`}>
                              <Eye className="w-4 h-4 mr-2" /> View
                            </Link>
                          </Button>
                          {item.decision !== "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-700 hover:bg-slate-800"
                              onClick={() => handleDownload(item.id, item.company_name)}
                            >
                              <Download className="w-4 h-4 mr-2" /> CAM
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
