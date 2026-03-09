import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Eye, FileSearch, Search, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { api, DraftItem } from "../../lib/api";

export function Drafts() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.getDrafts()
      .then((res) => {
        setDrafts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load drafts:", err);
        setLoading(false);
      });
  }, []);

  const filteredDrafts = drafts.filter((draft) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Check if the query matches ID (like "# 101" or "101")
    const idMatch = `#${draft.id}`.includes(query.replace(/\s+/g, '')) || String(draft.id).includes(query);
    const companyMatch = draft.company_name.toLowerCase().includes(query);
    const industryMatch = draft.industry.toLowerCase().includes(query);
    const statusMatch = draft.status.toLowerCase().includes(query);

    return idMatch || companyMatch || industryMatch || statusMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Pending Drafts</h1>
          <p className="text-slate-400">Review AI extractions before finalizing the credit appraisal memo.</p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search drafts..."
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
                  <th className="px-6 py-4 font-medium">Draft ID</th>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Industry</th>
                  <th className="px-6 py-4 font-medium">Date Created</th>
                  <th className="px-6 py-4 font-medium">AI Confidence</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse bg-slate-900/50">
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-5 w-16 bg-slate-700 rounded-full"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-24 bg-slate-700 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredDrafts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <FileSearch className="mx-auto h-8 w-8 mb-3 opacity-20" />
                      <p>No matching pending drafts found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredDrafts.map((draft) => (
                    <tr key={draft.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-300">#{draft.id}</td>
                      <td className="px-6 py-4 text-slate-200">{draft.company_name}</td>
                      <td className="px-6 py-4 text-slate-400">{draft.industry}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(draft.date_created).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={draft.ai_confidence > 80 ? 'text-emerald-400' : 'text-amber-400'}>
                            {draft.ai_confidence}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${draft.ai_confidence > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${draft.ai_confidence}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/10">
                          {draft.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="secondary" size="sm" asChild>
                          <Link to={`/drafts/${draft.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Link>
                        </Button>
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
