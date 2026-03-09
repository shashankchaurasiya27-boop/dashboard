import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { ChevronLeft, Save, CheckCircle2, AlertCircle, FileText, Search, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { api, DraftData } from "../../lib/api";

interface FormData {
  revenue: number;
  cogs: number;
  net_profit: number;
  total_debt: number;
}

export function DraftReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<FormData>();

  useEffect(() => {
    if (id) {
      api.getDraft(Number(id)).then((res) => {
        setData(res.data);
        reset({
          revenue: res.data.financial_data.revenue,
          cogs: res.data.financial_data.cogs,
          net_profit: res.data.financial_data.net_profit,
          total_debt: res.data.financial_data.total_debt,
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, reset]);

  const onSave = async (formData: FormData) => {
    if (!id) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await api.updateDraft(Number(id), formData);
      setSaveMessage("✓ Draft saved!");
      setTimeout(() => setSaveMessage(null), 2500);
    } catch (error) {
      console.error("Failed to save draft:", error);
      setSaveMessage("✗ Error saving draft.");
    } finally {
      setSaving(false);
    }
  };

  const onFinalize = async (formData: FormData) => {
    if (!id) return;
    setSaving(true);
    try {
      // 1. Save any pending changes
      await api.updateDraft(Number(id), formData);
      // 2. Finalize
      const finalizeRes = await api.finalizeDraft(Number(id));

      // The API returns the evaluation id, we navigate there
      const evalId = finalizeRes.evaluation_id || finalizeRes.id || Number(id);
      navigate(`/evaluation/${evalId}`);
    } catch (error) {
      console.error("Failed to finalize evaluation:", error);
      alert("Error finalizing evaluation.");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center text-slate-400">Loading evaluation data...</div>;
  }

  if (!data) return <div className="text-rose-400">Failed to load draft data.</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/drafts')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
              Reviewing Draft #{data.draft_id}
              <Badge variant="warning" className="ml-3 mt-1">DRAFT</Badge>
            </h1>
            <p className="text-slate-400 text-sm">Verify AI extracted data from {data.filename}</p>
          </div>
        </div>
        <div className="flex space-x-3 items-center">
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
              {saveMessage}
            </span>
          )}
          <Button variant="outline" onClick={handleSubmit(onSave)} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSubmit(onFinalize)} disabled={saving}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Finalize Evaluation
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* PDF Viewer Mock */}
        <Card className="flex flex-col h-full overflow-hidden border-slate-700 bg-slate-900/50">
          <div className="h-12 border-b border-slate-800 bg-slate-800/80 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center text-sm font-medium text-slate-300">
              <FileText className="w-4 h-4 mr-2 text-indigo-400" />
              {data.filename}
            </div>
            <div className="flex space-x-1 text-slate-400">
              <Button variant="ghost" size="icon" className="w-8 h-8"><Search className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="w-8 h-8"><ZoomOut className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="w-8 h-8"><ZoomIn className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="flex-1 bg-slate-800/30 overflow-y-auto p-8 flex justify-center custom-scrollbar">
            {/* Mock PDF Page */}
            <div className="w-full max-w-[600px] bg-white text-slate-800 shadow-xl shadow-black/20 p-12 min-h-[800px]">
              <div className="border-b-2 border-slate-200 pb-4 mb-8">
                <h2 className="text-3xl font-serif font-bold text-slate-900">{data.filename.split('.')[0].toUpperCase()}</h2>
                <p className="text-slate-500">Consolidated Financial Statements 2025</p>
              </div>

              <div className="space-y-6 text-sm">
                <div className="bg-yellow-100 border border-yellow-300 p-2 rounded -mx-2">
                  <div className="flex justify-between font-bold border-b border-slate-300 pb-2 mb-2">
                    <span>Revenue</span>
                    <span>${data.financial_data.revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between text-slate-600 pl-4">
                  <span>Cost of Goods Sold</span>
                  <span>${(watch("cogs") || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between font-bold border-t border-slate-300 pt-2">
                  <span>Gross Profit</span>
                  <span>${((watch("revenue") || 0) - (watch("cogs") || 0)).toLocaleString()}</span>
                </div>

                <div className="bg-yellow-100 border border-yellow-300 p-2 rounded -mx-2 mt-8">
                  <div className="flex justify-between font-bold border-b border-slate-300 pb-2 mb-2">
                    <span>Net Income (Profit)</span>
                    <span>${data.financial_data.net_profit.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-12 mb-4 font-bold text-lg">Balance Sheet Highlights</div>

                <div className="bg-yellow-100 border border-yellow-300 p-2 rounded -mx-2">
                  <div className="flex justify-between font-bold border-b border-slate-300 pb-2 mb-2">
                    <span>Total Liabilities (Debt)</span>
                    <span>${data.financial_data.total_debt.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Extraction Form */}
        <div className="flex flex-col h-full space-y-4 overflow-y-auto custom-scrollbar pr-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                Financial Data Extraction
                <Badge variant="success" className="ml-3 font-normal"><CheckCircle2 className="w-3 h-3 mr-1" /> High Confidence</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-300">Revenue (USD)</label>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 rounded-full py-0.5">94% match</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      {...register("revenue")}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md pl-8 pr-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-300">Net Profit (USD)</label>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 rounded-full py-0.5">88% match</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      {...register("net_profit")}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md pl-8 pr-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-300">Cost of Goods Sold (USD)</label>
                    <span className="text-xs text-slate-400 bg-slate-500/10 px-2 rounded-full py-0.5">85% match</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      {...register("cogs")}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md pl-8 pr-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-300">Total Debt (USD)</label>
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 rounded-full py-0.5">72% match</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      {...register("total_debt")}
                      className="w-full bg-slate-900 border border-amber-500/50 rounded-md pl-8 pr-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-xs flex items-center text-amber-500/80 mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" /> AI is less confident about debt classification. Please verify.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-indigo-500/30 bg-indigo-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-indigo-300">AI Preliminary Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 leading-relaxed">
                Based on extracted data, <strong>{data.company_name}</strong> shows healthy revenue but elevated debt levels. Preliminary models suggest an <strong>APPROVE</strong> decision, but human verification of the total debt figure is required before finalization.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
