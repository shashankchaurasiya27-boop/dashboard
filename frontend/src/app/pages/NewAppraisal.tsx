import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { api } from "../../lib/api";

export function NewAppraisal() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 5,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const [statusMessage, setStatusMessage] = useState("Processing documents...");

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(10);
    setStatusMessage("Uploading to server...");

    try {
      // Setup a fake progress interval while we wait for the synchronous backend endpoint
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return 90; // hold at 90% until done
          return p + 10;
        });
        setStatusMessage("Extracting financial data...");
      }, 1000);

      // 1. Send files to draft endpoint directly (no Celery required)
      const uploadRes = await api.uploadDraftDocument(files);
      const result = Array.isArray(uploadRes) ? uploadRes[0] : uploadRes;

      clearInterval(interval);
      setProgress(100);
      setStatusMessage("Complete!");

      setTimeout(() => {
        // Redirect to draft review page for manual analyst review
        const nextId = result.draft_id || result.id || 1;
        navigate(`/drafts/${nextId}`);
      }, 800);

    } catch (error) {
      console.error("Upload failed", error);
      setUploading(false);
      setProgress(0);
      setStatusMessage("Upload failed.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Initiate New Credit Evaluation</h1>
        <p className="text-slate-400">Upload financial documents to begin the AI appraisal process.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}
              ${uploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                <UploadCloud className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-200">
                  {isDragActive ? "Drop files here..." : "Drag & drop financial PDFs"}
                </p>
                <p className="text-sm text-slate-500 mt-1">or click to browse from your computer</p>
              </div>
              <p className="text-xs text-slate-600">Supports PDF format up to 50MB</p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Selected Files ({files.length})</h4>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                    <div className="flex items-center space-x-3 truncate">
                      <FileIcon className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span className="text-sm text-slate-200 truncate">{file.name}</span>
                      <span className="text-xs text-slate-500 shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    {!uploading && (
                      <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-rose-400 transition-colors p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-sm text-slate-300">
                <span>{statusMessage}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress === 100 && (
                <div className="flex items-center text-emerald-400 text-sm mt-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Upload complete, redirecting...
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Documents
                </>
              ) : (
                "Start Evaluation"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
