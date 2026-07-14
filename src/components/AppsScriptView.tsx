import { useState, useEffect } from "react";
import { Copy, Check, Download, FileText, Code2, AlertCircle } from "lucide-react";

interface CodeFiles {
  [filename: string]: string;
}

export default function AppsScriptView() {
  const [codeFiles, setCodeFiles] = useState<CodeFiles>({});
  const [activeFile, setActiveFile] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [fileTypeTab, setFileTypeTab] = useState<"all" | "gs" | "html">("all");

  useEffect(() => {
    fetch("/api/apps-script-code")
      .then((res) => res.json())
      .then((data) => {
        setCodeFiles(data);
        const keys = Object.keys(data);
        if (keys.length > 0) {
          setActiveFile(keys[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching code files:", err);
        setLoading(false);
      });
  }, []);

  const filteredFilenames = Object.keys(codeFiles).filter((filename) => {
    if (fileTypeTab === "gs") return filename.endsWith(".gs");
    if (fileTypeTab === "html") return filename.endsWith(".html");
    return true;
  });

  // Keep activeFile valid when tab changes
  useEffect(() => {
    if (filteredFilenames.length > 0 && !filteredFilenames.includes(activeFile)) {
      setActiveFile(filteredFilenames[0]);
    }
  }, [fileTypeTab, codeFiles]);

  const handleCopy = () => {
    if (!activeFile || !codeFiles[activeFile]) return;
    navigator.clipboard.writeText(codeFiles[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeFile || !codeFiles[activeFile]) return;
    const blob = new Blob([codeFiles[activeFile]], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeFile;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-indigo-500/10">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Code2 className="h-6 w-6" />
          Google Apps Script Code Center
        </h2>
        <p className="text-indigo-100 mt-2 text-sm max-w-3xl leading-relaxed">
          Semua file Google Apps Script yang Anda butuhkan untuk menjalankan sistem database ini secara langsung di 
          Google Sheets Anda telah kami persiapkan. Cukup salin kode dari setiap file di bawah ini ke editor Apps Script Anda!
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-xl text-yellow-800 dark:text-yellow-200 flex gap-3 text-sm">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Petunjuk Penggunaan Spreadsheet:</span>
          <ol className="list-decimal list-inside space-y-1 mt-1 font-sans">
            <li>Buka Google Spreadsheet baru atau yang sudah ada di akun Google Anda.</li>
            <li>Klik menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
            <li>Buat file baru di Apps Script dengan nama yang persis sama dengan tab di bawah (termasuk ekstensinya, misalnya <code>Code.gs</code> atau <code>index.html</code>).</li>
            <li>Salin masing-masing kode di bawah ini dan rekatkan ke dalam file yang sesuai.</li>
            <li>Jalankan fungsi <code>initDatabase()</code> di file <code>Config.gs</code> sekali untuk membuat lembar sheet database secara otomatis.</li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Navigator */}
        <div className="lg:col-span-1 space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider px-2 mb-2">
              Kategori File
            </h3>
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                onClick={() => setFileTypeTab("all")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                  fileTypeTab === "all"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFileTypeTab("gs")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                  fileTypeTab === "gs"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                .gs (Script)
              </button>
              <button
                onClick={() => setFileTypeTab("html")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                  fileTypeTab === "html"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                .html (UI)
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider px-2 py-1">
              Daftar File ({filteredFilenames.length})
            </h3>
            <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
              {filteredFilenames.map((filename) => {
                const isGs = filename.endsWith(".gs");
                return (
                  <button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group ${
                      activeFile === filename
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-l-4 border-indigo-500 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className={`h-4 w-4 shrink-0 ${activeFile === filename ? "text-indigo-500" : "text-slate-400"}`} />
                      <span className="truncate">{filename}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                      isGs
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                        : "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30"
                    }`}>
                      {isGs ? "GS" : "HTML"}
                    </span>
                  </button>
                );
              })}
              {filteredFilenames.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Tidak ada file dalam kategori ini.</p>
              )}
            </div>
          </div>
        </div>

        {/* Code Previewer */}
        <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden flex flex-col h-[550px]">
          {/* Editor Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              <span className="ml-2 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                {activeFile}
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeFile.endsWith(".gs")
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                    : "bg-sky-950 text-sky-400 border border-sky-900"
                }`}>
                  {activeFile.endsWith(".gs") ? "SERVER SCRIPT (.gs)" : "CLIENT INTERFACE (.html)"}
                </span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Salin Kode"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-green-400">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Unduh File"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh</span>
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-slate-900/90 selection:bg-indigo-500/30">
            <pre className="whitespace-pre-wrap">{codeFiles[activeFile] || "// Pilih file untuk melihat kodenya"}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
