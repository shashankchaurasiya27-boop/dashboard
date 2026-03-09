import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  CheckCircle2, XCircle, AlertTriangle, Download,
  ChevronLeft, FileText, Activity, TrendingDown, Percent,
  Newspaper, ShieldCheck
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { api, EvaluationData } from "../../lib/api";

const RISK_SCORE_MAX = 100;

export function EvaluationResult() {
  const { id } = useParams();
  const [data, setData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      api.getEvaluation(Number(id))
        .then((res) => {
          setData(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-slate-400">Loading evaluation report...</div>;
  if (error || !data) return (
    <div className="flex h-[80vh] flex-col items-center justify-center text-center space-y-3">
      <p className="text-rose-400 text-lg font-semibold">Evaluation not found</p>
      <p className="text-slate-500 text-sm">This evaluation may have been deleted or the ID is invalid.</p>
    </div>
  );

  const decision = data.credit_decision.decision;
  const isApproved = decision === "APPROVE";
  const isRejected = decision === "REJECT";
  const isConditional = decision === "APPROVE_WITH_CONDITIONS";
  const isHighRisk = decision === "HIGH_RISK_APPROVAL";

  // Decision badge variant helper
  const decisionVariant = isApproved ? "success" : isRejected ? "destructive" : "warning";

  // Label shown in badge
  const decisionLabel = {
    APPROVE: "APPROVED",
    APPROVE_WITH_CONDITIONS: "CONDITIONAL",
    HIGH_RISK_APPROVAL: "HIGH RISK",
    REJECT: "REJECTED",
    PENDING: "PENDING",
  }[decision] ?? decision;

  // Use real risk score from backend (0-100), with decision-based fallback for old records
  const riskScore = data.credit_decision.risk_score ?? (isApproved ? 75 : isRejected ? 35 : 55);

  const gaugeData = [
    { name: "Score", value: riskScore },
    { name: "Remaining", value: RISK_SCORE_MAX - riskScore }
  ];

  const gaugeColor = isApproved ? "#10b981" : isRejected ? "#ef4444" : isConditional ? "#f59e0b" : "#f97316";

  const handleDownload = () => {
    // Relying directly on the browser's download capability using our API token
    // Since it's an authenticated endpoint, we pass the token via a direct fetch and triggering a blob download
    const t = localStorage.getItem("intelli_token");
    fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/download/${data.evaluation_id}`, {
      headers: t ? { Authorization: `Bearer ${t}` } : {}
    })
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <Link to="/history" className="flex items-center text-sm text-slate-400 hover:text-slate-200 mb-2 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to History
          </Link>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {data.filename.replace('.pdf', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h1>
            <Badge variant={decisionVariant} className="text-sm px-3 py-1">
              {isApproved && <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              {isRejected && <XCircle className="w-4 h-4 mr-1.5" />}
              {(isConditional || isHighRisk || decision === "PENDING") && <AlertTriangle className="w-4 h-4 mr-1.5" />}
              {decisionLabel}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1 flex items-center text-sm">
            <FileText className="w-4 h-4 mr-2" /> Evaluation #{data.evaluation_id} • Generated today
          </p>
        </div>
        <Button className="shrink-0" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download CAM PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Score Gauge */}
        <Card className="flex flex-col items-center justify-center p-6 bg-slate-900/50">
          <CardHeader className="pb-0 w-full text-center">
            <CardTitle className="text-lg text-slate-300">Final Risk Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-4 pb-2 w-full">
            <div className="h-[200px] w-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    startAngle={180}
                    endAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell key="cell-0" fill={gaugeColor} />
                    <Cell key="cell-1" fill="#1e293b" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pb-8">
                <span className="text-5xl font-bold text-white tracking-tighter">{riskScore}</span>
                <span className="text-sm text-slate-400 font-medium">/ 100</span>
              </div>
            </div>
            <p className="text-sm text-center mt-2 text-slate-400 max-w-[200px]">
              {isApproved ? "Low risk profile. Favorable for credit extension."
                : isConditional ? "Moderate risk. Approval with additional conditions."
                  : isHighRisk ? "High risk. Approval at management discretion."
                    : "High risk profile. Does not meet criteria."}
            </p>
          </CardContent>
        </Card>

        {/* Risk Breakdown */}
        <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
          <Card className="h-full bg-slate-800/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-400" /> AI Decision Rationale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-md bg-slate-900/60 border border-slate-700/50 text-slate-300 leading-relaxed min-h-[120px]">
                {data.explanation.summary}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">Suggested Interest Rate</div>
                  <div className="text-2xl font-semibold text-white">{data.credit_decision.interest_rate_percent}%</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-1">Suggested Loan Limit</div>
                  <div className="text-2xl font-semibold text-white">${data.credit_decision.suggested_loan_limit.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Metrics */}
      <h2 className="text-xl font-bold text-slate-200 pt-4">Extracted Financial Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricBox icon={TrendingDown} label="Revenue" value={`₹${data.financial_data.revenue.toLocaleString()}`} />
        <MetricBox icon={TrendingDown} label="COGS" value={`₹${data.financial_data.cogs.toLocaleString()}`} />
        <MetricBox icon={TrendingDown} label="Net Profit" value={`₹${data.financial_data.net_profit.toLocaleString()}`}
          valueClass={data.financial_data.net_profit < 0 ? "text-rose-400" : ""} />
        <MetricBox icon={Percent} label="Gross Margin" value={`${(data.ratios.gross_margin * 100).toFixed(1)}%`}
          valueClass={data.ratios.gross_margin < 0 ? "text-rose-400" : ""} />
        <MetricBox icon={Percent} label="Profit Margin" value={`${(data.ratios.profit_margin * 100).toFixed(1)}%`}
          valueClass={data.ratios.profit_margin < 0 ? "text-rose-400" : ""} />
        <MetricBox icon={Activity} label="Debt to Revenue" value={`${data.ratios.debt_to_revenue.toFixed(2)}x`}
          valueClass={data.ratios.debt_to_revenue > 2 ? "text-amber-400" : ""} />
      </div>

      {/* Risk Intelligence — CIBIL + News signals (previously hidden) */}
      {(data.bureau_data || data.news_risk) && (
        <>
          <h2 className="text-xl font-bold text-slate-200 pt-2">Risk Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CIBIL Score */}
            {data.bureau_data && (
              <Card className="bg-slate-800/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    Credit Bureau Score (CIBIL)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 mb-3">
                    <span className="text-5xl font-bold text-white">{data.bureau_data.cibil_score}</span>
                    <span className="text-slate-400 text-sm mb-1">/ 900</span>
                  </div>
                  <div className="flex gap-3">
                    <span className={`text-sm font-semibold px-2 py-1 rounded ${data.bureau_data.rating === "Excellent" ? "bg-emerald-500/10 text-emerald-400" :
                        data.bureau_data.rating === "Good" ? "bg-blue-500/10 text-blue-400" :
                          data.bureau_data.rating === "Fair" ? "bg-amber-500/10 text-amber-400" :
                            "bg-rose-500/10 text-rose-400"
                      }`}>{data.bureau_data.rating}</span>
                    <span className="text-xs text-slate-500 self-center">Source: {data.bureau_data.source}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* News Sentiment */}
            {data.news_risk && (
              <Card className="bg-slate-800/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-indigo-400" />
                    News Sentiment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-sm font-semibold px-2 py-1 rounded capitalize ${data.news_risk.sentiment === "positive" ? "bg-emerald-500/10 text-emerald-400" :
                        data.news_risk.sentiment === "negative" ? "bg-rose-500/10 text-rose-400" :
                          "bg-slate-700 text-slate-400"
                      }`}>{data.news_risk.sentiment}</span>
                    {data.news_risk.news_risk_score > 0 && (
                      <span className="text-xs text-rose-400">-{data.news_risk.news_risk_score} risk penalty applied</span>
                    )}
                  </div>
                  {data.news_risk.news_flags.length > 0 && (
                    <ul className="space-y-1">
                      {data.news_risk.news_flags.slice(0, 3).map((flag, i) => (
                        <li key={i} className="text-xs text-slate-400 flex gap-2">
                          <span className="text-rose-400 mt-0.5 shrink-0">⚠</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {data.news_risk.news_flags.length === 0 && (
                    <p className="text-xs text-slate-500">No negative news signals detected.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MetricBox({ icon: Icon, label, value, valueClass = "text-white" }: any) {
  return (
    <Card className="bg-slate-800/30">
      <CardContent className="p-5 flex flex-col items-start">
        <div className="p-2 bg-slate-800 rounded-md mb-3 border border-slate-700">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <p className="text-sm text-slate-400 mb-1 font-medium">{label}</p>
        <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
