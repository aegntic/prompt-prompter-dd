
import React from 'react';
import { AnalysisResult } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  history: AnalysisResult[];
  onSelect: (result: AnalysisResult) => void;
  onClear: () => void;
}

const downloadFile = (content: string, fileName: string, contentType: string) => {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
};

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onToggle, history, onSelect, onClear }) => {
  
  const exportAllAsJSON = () => {
    if (history.length === 0) return;
    downloadFile(JSON.stringify(history, null, 2), `prompt-iteration-history.json`, 'application/json');
  };

  const exportAllAsCSV = () => {
    if (history.length === 0) return;
    
    const headers = ["ID", "Timestamp", "Prompt", "Expected", "Score", "Response", "Suggestion"];
    const rows = history.map(item => [
      item.id,
      new Date(item.timestamp).toISOString(),
      `"${item.originalPrompt.replace(/"/g, '""')}"`,
      `"${(item.expectedResponse || '').replace(/"/g, '""')}"`,
      item.confidenceScore,
      `"${item.responseText.replace(/"/g, '""')}"`,
      `"${item.optimizationSuggestion.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    downloadFile(csvContent, `prompt-iteration-history.csv`, 'text/csv');
  };

  return (
    <>
      {/* Sidebar Container */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl border-r border-slate-200 dark:border-blue-900/50 z-50 sidebar-transition flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-200 dark:border-blue-900/30 flex items-center justify-between">
          <h2 className="font-tech text-slate-700 dark:text-blue-400 uppercase tracking-widest text-sm">Iteration History</h2>
          <button onClick={onToggle} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="text-slate-400 dark:text-slate-600 text-center mt-10 text-sm font-tech uppercase opacity-50">No iterations yet</div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                onClick={() => onSelect(item)}
                className="group p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-blue-900/20 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 dark:hover:bg-blue-900/10 transition-all shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-slate-500 font-tech">
                    {new Date(item.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-tech ${
                    item.confidenceScore > 70 
                      ? 'border-green-500/30 text-green-600 dark:text-green-400' 
                      : 'border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {item.confidenceScore}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic font-mono opacity-80 group-hover:opacity-100">"{item.originalPrompt}"</p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-blue-900/30 space-y-2">
          {history.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button 
                onClick={exportAllAsJSON}
                className="py-2 text-[10px] font-tech text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-widest bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded shadow-sm"
              >
                Export JSON
              </button>
              <button 
                onClick={exportAllAsCSV}
                className="py-2 text-[10px] font-tech text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-widest bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded shadow-sm"
              >
                Export CSV
              </button>
            </div>
          )}
          <button 
            onClick={onClear}
            className="w-full py-2 text-[10px] font-tech text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors uppercase tracking-widest"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Toggle Handle (Floating Tab) */}
      <button 
        onClick={onToggle}
        className={`fixed left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-blue-600/20 border border-slate-200 dark:border-blue-500/40 border-l-0 p-2 rounded-r-xl z-40 transition-all hover:bg-slate-50 dark:hover:bg-blue-600/40 group shadow-lg ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="w-1 h-6 bg-blue-400/50 rounded-full group-hover:bg-blue-500 transition-colors"></div>
          <div className="w-1 h-2 bg-blue-400/50 rounded-full group-hover:bg-blue-500 transition-colors"></div>
        </div>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 backdrop-blur-sm"
        />
      )}
    </>
  );
};

export default HistorySidebar;
