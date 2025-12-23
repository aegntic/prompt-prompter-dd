
import React, { useState, useEffect } from 'react';
import { analyzePrompt } from './services/geminiService';
import { AnalysisResult, PromptExample } from './types';
import { DatadogLogo, GeminiLogo } from './components/Icons';
import ExampleTable from './components/ExampleTable';
import { MainChart, MetricsMiniChart, RadialProgressBar } from './components/Visualization';
import HistorySidebar from './components/HistorySidebar';

const downloadFile = (content: string, fileName: string, contentType: string) => {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="p-1.5 rounded-md hover:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all flex items-center gap-1 group"
    >
      {copied ? (
        <span className="text-[10px] font-tech uppercase text-green-600 dark:text-green-400">Copied!</span>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )}
    </button>
  );
};

const ThemeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({ isDark, onToggle }) => (
  <button
    onClick={onToggle}
    className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:ring-2 hover:ring-blue-500/50 transition-all shadow-md"
    title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
  >
    {isDark ? (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    )}
  </button>
);

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [expected, setExpected] = useState('');
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // History and config state
  const [activeTab, setActiveTab] = useState<'analysis' | 'metrics'>('analysis');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [config, setConfig] = useState<{ dd_dashboard_url?: string; service?: string; env?: string }>({});

  // Fetch config on mount
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Failed to fetch config", err));
  }, []);

  // Apply theme class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('prompt_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('prompt_history', JSON.stringify(history));
  }, [history]);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setIsInputCollapsed(true); // Collapse input when analyzing
    try {
      const data = await analyzePrompt(prompt, expected, autoOptimize);
      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 50));
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (selected: AnalysisResult) => {
    setResult(selected);
    setPrompt(selected.originalPrompt);
    setExpected(selected.expectedResponse || '');
    setAutoOptimize(selected.autoOptimized || false);
    setIsSidebarOpen(false);
    setIsInputCollapsed(true); // Collapse input when viewing history
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your entire analysis history?')) {
      setHistory([]);
    }
  };

  const handleSelectExample = (ex: PromptExample) => {
    setPrompt(ex.prompt);
    setExpected(ex.expected);
    setAutoOptimize(ex.autoOptimize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportIndividualAsJSON = () => {
    if (!result) return;
    downloadFile(JSON.stringify(result, null, 2), `analysis-${result.id}.json`, 'application/json');
  };

  const defaultMetrics = [
    { name: 'Clarity', score: 0 },
    { name: 'Context', score: 0 },
    { name: 'Constraints', score: 0 },
    { name: 'Structure', score: 0 },
    { name: 'Tone', score: 0 }
  ];

  return (
    <div className="min-h-screen relative transition-colors duration-300">
      <HistorySidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        history={history}
        onSelect={handleSelectHistory}
        onClear={handleClearHistory}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 relative">
        <div className="absolute top-8 right-4 flex items-center gap-4 z-10">
          <ThemeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
        </div>

        {/* Header */}
        <header className="flex flex-col items-center justify-center mb-8 gap-2">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-tech tracking-wider text-slate-800 dark:text-white glow-text uppercase leading-tight">
              YOUR PROMPTS FAVOURITE PROMPTER
            </h1>
            <p className="text-blue-600 dark:text-blue-400 font-tech text-xs md:text-sm tracking-[0.3em] opacity-80 mt-1 uppercase">
              - proof of prompt improvement -
            </p>
          </div>
          <div className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mt-4"></div>
        </header>

        {/* Tabs */}
        <div className="flex justify-center gap-8 mb-8 border-b border-slate-200 dark:border-blue-900/20 pb-4">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`font-tech text-sm tracking-widest transition-all ${activeTab === 'analysis' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-2' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}
          >
            ANALYSIS ENGINE 📝
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`font-tech text-sm tracking-widest transition-all ${activeTab === 'metrics' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-2' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}
          >
            LIVE METRICS 💹
          </button>
        </div>

        {activeTab === 'analysis' ? (
          <div className="space-y-6">
            {/* Collapsible Input Section */}
            <div className={`bg-white/80 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl dark:shadow-2xl relative overflow-hidden transition-all duration-500 ease-in-out ${isInputCollapsed ? 'p-4' : 'p-6'}`}>
              {isInputCollapsed ? (
                /* Collapsed: Compact Input Bar */
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-slate-500 dark:text-blue-500 font-tech uppercase tracking-wider">Your Prompt</span>
                      {autoOptimize && <span className="text-[8px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-tech uppercase">Auto-Optimize</span>}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-mono truncate">{prompt}</p>
                  </div>
                  <button
                    onClick={() => setIsInputCollapsed(false)}
                    className="px-4 py-2 text-[10px] font-tech uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2 border border-slate-200 dark:border-blue-900/50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Prompt
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || !prompt}
                    className={`px-6 py-2 rounded-lg font-tech text-sm tracking-widest transition-all ${loading ? 'bg-slate-300 dark:bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:scale-[1.02] active:scale-[0.98] glow-blue'}`}
                  >
                    {loading ? 'ANALYZING...' : 'RE-ANALYZE'}
                  </button>
                </div>
              ) : (
                /* Expanded: Full Input Form */
                <>
                  <div className="absolute top-0 right-0 p-2 opacity-5 dark:opacity-10 pointer-events-none">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                      <path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.57 21.82C12.41 21.94 12.21 22 12 22C11.79 22 11.59 21.94 11.43 21.82L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.43 2.18C11.59 2.06 11.79 2 12 2C12.21 2 12.41 2.06 12.57 2.18L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5Z" />
                    </svg>
                  </div>

                  <label className="block text-slate-600 dark:text-blue-400 font-medium mb-2 text-sm uppercase tracking-wide">Your Prompt</label>
                  <textarea
                    className="w-full h-36 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-blue-900/40 rounded-xl p-4 text-slate-800 dark:text-blue-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 resize-none font-mono"
                    placeholder="Enter your prompt here for analysis and optimization..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 dark:text-blue-400 font-medium mb-2 text-sm uppercase tracking-wide">Expected Response (Optional)</label>
                      <textarea
                        className="w-full h-20 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-blue-900/40 rounded-xl p-4 text-slate-800 dark:text-blue-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 resize-none font-mono text-sm"
                        placeholder="If you have an expected response, enter it here."
                        value={expected}
                        onChange={(e) => setExpected(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setAutoOptimize(!autoOptimize)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${autoOptimize ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoOptimize ? 'left-7' : 'left-1'}`} />
                        </button>
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-tech text-[10px] uppercase">Auto-optimize if score below 80%</span>
                      </div>

                      <button
                        onClick={handleAnalyze}
                        disabled={loading || !prompt}
                        className={`mt-4 w-full py-3 rounded-xl font-tech text-lg tracking-widest transition-all relative overflow-hidden group shadow-lg ${loading ? 'bg-slate-300 dark:bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:scale-[1.01] active:scale-[0.99] glow-blue'}`}
                      >
                        {loading && <div className="scanner absolute inset-0"></div>}
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          {loading ? 'ANALYZING...' : 'ANALYZE PROMPT'}
                          {!loading && (
                            <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11 15h2v2h-2v-2m0-8h2v6h-2V7m1-5C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8.59 8 8 8-3.59 8-8 8z" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Results Section - Full Width when collapsed */}
            <div className={`transition-all duration-500 ${isInputCollapsed ? '' : 'lg:grid lg:grid-cols-2 lg:gap-8'}`}>
              {/* Performance Profile */}
              <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl dark:shadow-2xl relative mb-6 lg:mb-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-700 dark:text-blue-400 font-tech uppercase tracking-wider text-sm">Prompt Performance Profile</h3>
                  {result && (
                    <button
                      onClick={exportIndividualAsJSON}
                      className="text-[10px] font-tech text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1 border border-slate-200 dark:border-blue-900/50 px-2 py-1 rounded bg-slate-50 dark:bg-slate-950/50"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      EXPORT JSON
                    </button>
                  )}
                </div>

                <MainChart data={result?.metrics || defaultMetrics} />

                {/* Overall Strength - Prominent when collapsed */}
                <div className={`mt-6 ${isInputCollapsed ? 'flex items-center justify-center gap-8' : ''}`}>
                  <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-blue-900/30 p-6 rounded-xl flex flex-col items-center justify-center overflow-hidden shadow-inner">
                    <h4 className="text-xs text-slate-500 dark:text-blue-500 font-tech mb-2 uppercase">Overall Strength</h4>
                    <RadialProgressBar score={result?.confidenceScore || 0} loading={loading} />
                  </div>
                  {isInputCollapsed && (
                    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-blue-900/30 p-4 rounded-xl shadow-inner flex-1">
                      <h4 className="text-xs text-slate-500 dark:text-blue-500 font-tech mb-2 uppercase">Scatter Overview</h4>
                      <MetricsMiniChart data={result?.metrics || defaultMetrics} />
                    </div>
                  )}
                </div>
              </div>

              {/* Response & Optimization Panel */}
              <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl dark:shadow-2xl">
                <h3 className="text-slate-700 dark:text-blue-400 font-tech uppercase tracking-wider text-sm mb-4">Analysis Results</h3>

                {/* Response Text - More space when collapsed */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-blue-900/30 p-4 rounded-xl relative group shadow-inner mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs text-slate-500 dark:text-blue-500 font-tech uppercase">Response Text</h4>
                    {result?.responseText && <CopyButton text={result.responseText} />}
                  </div>
                  <div className={`text-sm text-slate-700 dark:text-slate-300 overflow-y-auto font-mono scrollbar-hide ${isInputCollapsed ? 'h-40' : 'h-24'}`}>
                    {loading ? 'Calculating...' : result?.responseText || 'Awaiting analysis...'}
                  </div>
                </div>

                {/* Optimization Suggestion - More space when collapsed */}
                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-blue-900/30 p-4 rounded-xl relative group shadow-inner">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs text-slate-500 dark:text-blue-500 font-tech uppercase">Optimization Suggestion</h4>
                    {result?.optimizationSuggestion && <CopyButton text={result.optimizationSuggestion} />}
                  </div>
                  <div className={`text-sm text-blue-700 dark:text-blue-300 font-medium overflow-y-auto ${isInputCollapsed ? 'h-40' : 'h-24'}`}>
                    {loading ? 'Generating suggestions...' : result?.optimizationSuggestion || 'N/A'}
                  </div>
                </div>

                {!isInputCollapsed && (
                  <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-blue-900/30 p-4 rounded-xl shadow-inner mt-4">
                    <h4 className="text-xs text-slate-500 dark:text-blue-500 font-tech mb-2 uppercase">Scatter Overview</h4>
                    <MetricsMiniChart data={result?.metrics || defaultMetrics} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Live Metrics Tab */
          <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl dark:shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-tech text-slate-800 dark:text-blue-400 tracking-wider uppercase">Datadog Performance Dashboard</h2>
              <div className="text-[10px] font-tech text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Service: {config.service || '...'} | Env: {config.env || '...'}
              </div>
            </div>
            <div className="w-full h-[800px] border border-slate-200 dark:border-blue-900/40 rounded-xl overflow-hidden bg-slate-950/20 shadow-inner">
              {config.dd_dashboard_url ? (
                <iframe
                  src={config.dd_dashboard_url}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  title="Datadog Dashboard"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-500 animate-pulse">
                  <DatadogLogo />
                  <p className="font-tech text-xs tracking-widest">LOADING TELEMETRY DATA...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && <ExampleTable onSelect={handleSelectExample} />}

        <footer className="mt-16 flex items-center justify-center gap-12 pb-8 border-t border-slate-200 dark:border-blue-900/20 pt-8">
          <DatadogLogo />
          <GeminiLogo />
        </footer>
      </div>
    </div>
  );
};

export default App;
