import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Activity, Users, FileText, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { api, HistoryItem } from "../../lib/api";

const CHART_DATA = [
  { name: "Jan", Manufacturing: 400, Technology: 240, Retail: 150, RealEstate: 300, Hospitality: 120, Pharma: 210 },
  { name: "Feb", Manufacturing: 300, Technology: 290, Retail: 180, RealEstate: 280, Hospitality: 150, Pharma: 230 },
  { name: "Mar", Manufacturing: 450, Technology: 350, Retail: 200, RealEstate: 320, Hospitality: 170, Pharma: 280 },
  { name: "Apr", Manufacturing: 500, Technology: 400, Retail: 250, RealEstate: 350, Hospitality: 200, Pharma: 310 },
  { name: "May", Manufacturing: 480, Technology: 420, Retail: 230, RealEstate: 310, Hospitality: 190, Pharma: 350 },
  { name: "Jun", Manufacturing: 550, Technology: 480, Retail: 280, RealEstate: 380, Hospitality: 220, Pharma: 400 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getHistory(),
      api.getDrafts(),
    ]).then(([histRes, draftRes]) => {
      setHistory(histRes.data.slice(0, 5));
      setDraftCount(draftRes.data.length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const approvedCount = history.filter(h => h.decision === "APPROVE").length;
  const avgRisk = history.length > 0
    ? (history.reduce((acc, h) => acc + (h.risk_score || 0), 0) / history.length).toFixed(1)
    : null;
  const approvalRate = history.length > 0 ? Math.round((approvedCount / history.length) * 100) + "%" : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-slate-400">Welcome back! Here's the latest automated credit appraisal activity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Recent Evaluations"
          value={loading ? "..." : String(history.length)}
          sub="Last 5 loaded"
          icon={Users}
          color="indigo"
        />
        <MetricCard
          title="Pending Drafts"
          value={draftCount === null ? "..." : String(draftCount)}
          sub="Awaiting review"
          icon={FileText}
          color="amber"
        />
        <MetricCard
          title="Average Risk Score"
          value={loading || !avgRisk ? "..." : String(avgRisk)}
          sub="Across recent evaluations"
          icon={Activity}
          color="purple"
        />
        <MetricCard
          title="Approval Rate"
          value={loading || !approvalRate ? "..." : approvalRate}
          sub="Of loaded evaluations"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">Credit Evaluations by Industry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CHART_DATA}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis key="x-axis" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis key="y-axis" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Line key="line-tech" type="monotone" dataKey="Technology" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line key="line-mfg" type="monotone" dataKey="Manufacturing" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line key="line-pharma" type="monotone" dataKey="Pharma" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Evaluations</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>View All</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="h-4 w-32 bg-slate-700 animate-pulse rounded"></div>
                    <div className="h-6 w-16 bg-slate-700 animate-pulse rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between pb-4 border-b border-slate-800/60 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-slate-200">{item.company_name}</p>
                      <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()} • Score: {item.risk_score}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={
                        item.decision === "APPROVE" ? "success" :
                          item.decision === "REJECT" ? "destructive" : "warning"
                      }>
                        {item.decision}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/evaluation/${item.id}`)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub, icon: Icon, color = "indigo" }: any) {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <div className={`p-1.5 rounded-md ${colorMap[color] || colorMap.indigo}`}>
          <Icon className={`h-4 w-4 ${colorMap[color]?.split(" ")[0] || "text-indigo-400"}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {sub && <p className="text-xs mt-1 text-slate-500">{sub}</p>}
      </CardContent>
    </Card>
  );
}
