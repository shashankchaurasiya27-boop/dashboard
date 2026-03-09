import { useState } from "react";
import {
  Download,
  Filter,
  Search,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  ShieldAlert,
  FileText
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "../components/ui/table";

const TREND_DATA = [
  { name: "Oct", Approved: 65, Rejected: 28, Pending: 15 },
  { name: "Nov", Approved: 72, Rejected: 31, Pending: 12 },
  { name: "Dec", Approved: 85, Rejected: 25, Pending: 8 },
  { name: "Jan", Approved: 92, Rejected: 42, Pending: 18 },
  { name: "Feb", Approved: 88, Rejected: 35, Pending: 22 },
  { name: "Mar", Approved: 105, Rejected: 40, Pending: 14 },
];

const RISK_DATA = [
  { name: "Low Risk (80-100)", value: 450 },
  { name: "Moderate Risk (60-79)", value: 520 },
  { name: "High Risk (40-59)", value: 180 },
  { name: "Critical (<40)", value: 98 },
];

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

const RECENT_REPORTS = [
  { id: "REP-2026-001", company: "TechNova Inc.", date: "2026-03-01", category: "Low Risk", score: 82, status: "Finalized" },
  { id: "REP-2026-002", company: "Apex Logistics", date: "2026-03-02", category: "High Risk", score: 45, status: "Finalized" },
  { id: "REP-2026-003", company: "Stellar Manufacturing", date: "2026-03-05", category: "Moderate Risk", score: 76, status: "Finalized" },
  { id: "REP-2026-004", company: "Horizon Retail", date: "2026-03-07", category: "Moderate Risk", score: 62, status: "Pending Review" },
  { id: "REP-2026-005", company: "Vanguard Properties", date: "2026-03-08", category: "Low Risk", score: 88, status: "Finalized" },
  { id: "REP-2026-006", company: "Nexus Dynamics", date: "2026-03-08", category: "Critical", score: 38, status: "Finalized" },
  { id: "REP-2026-007", company: "Global Synergies", date: "2026-03-09", category: "Moderate Risk", score: 71, status: "Draft" },
];

export function Reports() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = RECENT_REPORTS.filter(report =>
    report.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Analytics & Reports</h1>
          <p className="text-slate-400 mt-1">Portfolio risk distribution and historical performance metrics.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Evaluations</CardTitle>
            <FileText className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">1,248</div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">High Risk Entities</CardTitle>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">142</div>
            <p className="text-xs text-rose-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> +4.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Avg Credit Score</CardTitle>
            <BarChart2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">68.4</div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> +2.3 pts from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Risk Concentration</CardTitle>
            <PieChartIcon className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">Moderate</div>
            <p className="text-xs text-slate-400 flex items-center mt-1">
              41.6% of portfolio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">Decision Trends</CardTitle>
            <CardDescription className="text-slate-400">Monthly approval vs rejection rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis key="x-axis" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis key="y-axis" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }}
                    itemStyle={{ color: "#e2e8f0" }}
                    cursor={{ fill: "#334155", opacity: 0.4 }}
                  />
                  <Legend key="legend" wrapperStyle={{ paddingTop: "10px" }} />
                  <Bar key="bar-app" dataKey="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar key="bar-rej" dataKey="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar key="bar-pen" dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">Portfolio Risk Distribution</CardTitle>
            <CardDescription className="text-slate-400">Current active evaluations by risk category</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip
                    key="pie-tooltip"
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#e2e8f0" }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Legend key="pie-legend" layout="vertical" verticalAlign="middle" align="right" />
                  <Pie
                    key="pie"
                    data={RISK_DATA}
                    cx="45%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {RISK_DATA.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg text-slate-100">Detailed Report Archive</CardTitle>
            <CardDescription className="text-slate-400">View and export historical evaluation reports.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search reports..."
              className="pl-9 bg-slate-900 border-slate-700 text-slate-200 focus-visible:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-900/50">
                <TableRow className="border-slate-700 hover:bg-slate-900/50">
                  <TableHead className="text-slate-400 font-medium">Report ID</TableHead>
                  <TableHead className="text-slate-400 font-medium">Entity Name</TableHead>
                  <TableHead className="text-slate-400 font-medium">Date</TableHead>
                  <TableHead className="text-slate-400 font-medium">Risk Category</TableHead>
                  <TableHead className="text-slate-400 font-medium">Score</TableHead>
                  <TableHead className="text-slate-400 font-medium text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="border-slate-700 hover:bg-slate-800 transition-colors">
                    <TableCell className="font-medium text-indigo-400">{report.id}</TableCell>
                    <TableCell className="text-slate-200">{report.company}</TableCell>
                    <TableCell className="text-slate-400">{report.date}</TableCell>
                    <TableCell>
                      <Badge variant={
                        report.category === "Low Risk" ? "success" :
                          report.category === "High Risk" || report.category === "Critical" ? "destructive" :
                            "warning"
                      }>
                        {report.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-200">
                      <div className="flex items-center space-x-2">
                        <span>{report.score}</span>
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${report.score >= 80 ? "bg-emerald-500" :
                              report.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                            style={{ width: `${report.score}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No reports matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
