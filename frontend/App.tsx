
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Sparkles, Terminal, Zap, Settings, RefreshCw, Trash2,
  ChevronRight, ShieldCheck, Cpu, Activity, History as HistoryIcon,
  Layout, BarChart3, Database, Clock, Crosshair, Target, Dna, Hexagon,
  Cloud, Dog, Server, RotateCcw, Cpu as CpuIcon, ShieldAlert, Binary, Eye, X, Play, MousePointer2, Info, ArrowRight, CheckCircle, Loader2
} from 'lucide-react';
import { TabType, AnalysisResult, PromptTemplate, TemplateVersion } from './types';
import { NAV_ITEMS, SAMPLE_PROMPTS, AVAILABLE_MODELS } from './constants';
import { runAnalysis } from './services/geminiService';
import { datadog } from './services/datadogService';
import AnalysisDisplay from './components/AnalysisDisplay';
import MetricsTab from './components/MetricsTab';
import TemplateManager from './components/TemplateManager';

// Tooltip Component
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({ x: e.clientX + 15, y: e.clientY + 15 });
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
      {visible && (
        <div
          className="hud-tooltip"
          style={{ position: 'fixed', left: position.x, top: position.y }}
        >
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Neural_Info</div>
          <div className="text-[9px] text-slate-300 leading-tight italic">{text}</div>
        </div>
      )}
    </div>
  );
};

// Tactical Tour HUD (Docked Panel for the Sidebar)
const TourHUD: React.FC<{
  title: string;
  description: string;
  step: number;
  total: number;
  isAuto: boolean;
  onNext: () => void;
  onClose: () => void;
}> = ({ title, description, step, total, isAuto, onNext, onClose }) => {
  return (
    <div className="animate-in slide-in-from-left-4 duration-500">
      <div className="hud-panel p-6 border-cyan-400 bg-cyan-500/5 cyber-border shadow-[0_0_20px_rgba(0,243,255,0.1)]">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Binary size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live_Demo_Step_{step + 1}/{total}</span>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <h4 className="text-lg font-black text-white italic tracking-tighter uppercase mb-1">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">{description}</p>

        <div className="space-y-4">
          <div className="flex gap-1.5 w-full">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === step ? 'bg-cyan-400 shadow-[0_0_8px_#00f3ff]' : 'bg-slate-800'}`}></div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            {!isAuto ? (
              <button
                onClick={onNext}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95"
              >
                CONTINUE_SEQUENCE <ArrowRight size={12} />
              </button>
            ) : (
              <div className="flex items-center justify-center w-full gap-3 py-3 border border-cyan-500/20 text-[9px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/5">
                <Loader2 size={12} className="animate-spin" /> Auto_Pilot_Engaged
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DataProcessingSequence: React.FC = () => {
  const [stage, setStage] = useState(0);
  const stages = [
    { title: "INITIALIZING_TENSORS", icon: <Binary className="text-cyan-400" /> },
    { title: "QUERYING_ENGINE_CLUSTER", icon: <Cloud className="text-blue-400" /> },
    { title: "EXTRACTING_SEMANTIC_WEIGHTS", icon: <Dna className="text-purple-400" /> },
    { title: "DATADOG_METRIC_FLUSH", icon: <Dog className="text-[#632CA6]" /> },
    { title: "REMEDIATION_SHARD_SYNC", icon: <ShieldCheck className="text-emerald-400" /> }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage(prev => (prev + 1) % stages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-panel p-12 bg-black/40 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="grid grid-cols-10 h-full w-full">
          {[...Array(100)].map((_, i) => (
            <div key={i} className="border border-cyan-500/20 text-[8px] mono overflow-hidden h-4">
              {Math.random().toString(16).substring(2, 8)}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 space-y-8 w-full max-w-md text-center">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 border-2 border-dashed border-cyan-500/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-flicker">
                {stages[stage].icon}
              </div>
            </div>
            <div className="absolute -inset-4 border border-cyan-500/10 rounded-full animate-ping"></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-[10px] font-black tracking-[0.2em] text-cyan-400/80 uppercase">
            <span>STG_{stage + 1}_LOG: {stages[stage].title}</span>
            <span className="mono">{Math.floor(Math.random() * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
            <div className="absolute top-0 h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 animate-bar-grow"></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {stages.map((s, i) => (
            <div key={i} className={`h-1 rounded-full transition-colors duration-500 ${i <= stage ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
          ))}
        </div>

        <div className="text-[9px] mono text-slate-500 text-left h-12 overflow-hidden bg-black/40 p-2 rounded border border-white/5 italic">
          <div className="animate-[pulse_1s_infinite]">
            [SYS] PIPE_ENGINE_INFERENCE :: CLUSTER_NODE_ZETA<br />
            [SYS] EMITTING_METRICS_TO_DATADOG_AGENT_7.51...
          </div>
        </div>
      </div>
    </div>
  );
};

const DEMO_STEPS = [
  { title: "Navigation Access", description: "The platform is organized into tactical hubs. We'll start in the Analysis Engine.", tab: TabType.ANALYSIS },
  { title: "Neural Input", description: "First, we initialize the buffer with a raw, non-optimized prompt to analyze its quality.", prompt: "write a python function to find the maximum in a list" },
  { title: "Vertex Scan", description: "We trigger a full diagnostic scan. This routes your prompt through our Gemini-3 Flash inference cluster.", action: 'analyze' },
  { title: "Metrics Analysis", description: "While processing, the system sends high-fidelity telemetry to our integrated Datadog hub.", tab: TabType.METRICS },
  { title: "Remediation Shard", description: "Returning to Analysis, we see the engine has identified quality gaps and generated an 'Evidence of Improvement' shard.", tab: TabType.ANALYSIS },
  { title: "Neural Sync", description: "Applying the remediation 'Sync Patch' instantly upgrades your prompt's structural and semantic weight.", action: 'remediate' }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.ANALYSIS);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  // Demo State
  const [demoState, setDemoState] = useState<{ isActive: boolean, isAuto: boolean, step: number }>({
    isActive: false,
    isAuto: false,
    step: 0
  });

  useEffect(() => {
    const savedHistory = localStorage.getItem('prompt_prompter_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedTemplates = localStorage.getItem('prompt_prompter_templates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setTemplates(parsed);
      } catch (e) {
        console.error("Failed to parse templates", e);
      }
    }

    const savedModel = localStorage.getItem('prompt_prompter_model');
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  const handleAnalyze = async (promptOverride?: string) => {
    const promptToUse = promptOverride || inputPrompt;
    if (!promptToUse.trim()) return;
    setIsAnalyzing(true);
    const result = await runAnalysis(promptToUse, autoOptimize, selectedModel);
    setIsAnalyzing(false);
    if (result.status === 'success') {
      setCurrentResult(result);
      const newHistory = [result, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem('prompt_prompter_history', JSON.stringify(newHistory));
      datadog.trackAnalysis(result);
    }
  };

  // Demo Controller
  useEffect(() => {
    if (!demoState.isActive) return;

    const stepData = DEMO_STEPS[demoState.step];
    if (stepData.tab) setActiveTab(stepData.tab);

    const runStep = async () => {
      if (stepData.prompt) {
        let currentText = "";
        for (const char of stepData.prompt) {
          currentText += char;
          setInputPrompt(currentText);
          await new Promise(r => setTimeout(r, 40));
        }
      }

      if (stepData.action === 'analyze') {
        await handleAnalyze();
      }

      if (stepData.action === 'remediate') {
        if (currentResult?.optimization) {
          setInputPrompt(currentResult.optimization.optimized_prompt);
          await handleAnalyze(currentResult.optimization.optimized_prompt);
        }
      }

      if (demoState.isAuto) {
        setTimeout(() => {
          if (demoState.step < DEMO_STEPS.length - 1) {
            setDemoState(prev => ({ ...prev, step: prev.step + 1 }));
          } else {
            setDemoState(prev => ({ ...prev, isActive: false }));
          }
        }, 3000);
      }
    };

    runStep();
  }, [demoState.isActive, demoState.step]);

  const handleClearData = () => {
    if (confirm("Confirm absolute system purge? All templates and history will be deleted.")) {
      setHistory([]);
      setTemplates([]);
      localStorage.clear();
      window.location.reload();
    }
  };

  const lastPrompt = useMemo(() => history[0]?.original_prompt, [history]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-cyan-500/30">
      {/* HUD Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-cyan-500/20 bg-[#020617]/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center neural-pulse">
              <Hexagon className="text-cyan-400 absolute animate-[spin_10s_linear_infinite]" size={48} strokeWidth={1} />
              <Dna className="text-cyan-400" size={24} />
            </div>
          </div>
          <div className="leading-none">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tighter text-white uppercase italic">Prompt</span>
              <span className="text-xl font-light text-cyan-400 tracking-[0.2em] uppercase">Prompter</span>
            </div>
            <div className="text-[10px] text-cyan-500/50 uppercase tracking-[0.3em] font-bold mt-1">Evidence of Improvement</div>
          </div>
        </div>

        <nav className="flex gap-4">
          {NAV_ITEMS.map(item => (
            <Tooltip key={item.id} text={`Switch viewport to ${item.label.toLowerCase()} hub.`}>
              <button
                onClick={() => setActiveTab(item.id as TabType)}
                className={`group relative flex flex-col items-center px-4 py-1 transition-all ${activeTab === item.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                <div className="mb-1">{item.icon}</div>
                <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
                {activeTab === item.id && (
                  <div className="absolute -bottom-[1.25rem] w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_#00f3ff]"></div>
                )}
              </button>
            </Tooltip>
          ))}
        </nav>

        <div className="flex items-center gap-8">
          <div className="hidden xl:flex items-center gap-6 border-l border-white/10 pl-6">
            <div className="flex flex-col items-end">
              <Tooltip text="Direct stream link to Datadog Browser SDK.">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-[#632CA6] tracking-tighter uppercase cursor-help">
                  <Dog size={10} fill="#632CA6" /> Datadog Sync
                </div>
              </Tooltip>
              <div className="text-[10px] mono text-emerald-400 uppercase font-bold">Connected</div>
            </div>
            <div className="flex flex-col items-end">
              <Tooltip text="Primary inference engine currently routing prompt tensors.">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-white tracking-tighter uppercase cursor-help">
                  <Cloud size={10} className="text-blue-400" /> Vertex AI Engine
                </div>
              </Tooltip>
              <div className="text-[10px] mono text-cyan-400 uppercase font-bold">
                {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || 'Gemini'}
              </div>
            </div>
          </div>

          <Tooltip text="Access system console for engine switching and UI overlays.">
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full border border-cyan-500/20 flex items-center justify-center hover:bg-cyan-500/10 cursor-pointer transition-colors group"
            >
              <Settings size={18} className="text-cyan-400 group-hover:rotate-45 transition-transform" />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Settings Modal HUD */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="hud-panel max-w-2xl w-full p-8 relative cyber-border max-h-[90vh] overflow-y-auto shadow-[0_0_100px_rgba(0,243,255,0.1)]">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-8 flex items-center gap-3">
              <Settings className="text-cyan-400" /> System_Settings_Console
            </h2>

            <div className="space-y-8">
              {/* Demo Mode Section */}
              <section className="bg-cyan-500/5 border border-cyan-500/20 p-6 rounded relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Play size={64} className="text-cyan-500" /></div>
                <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Play size={14} /> Neural_Simulation (Demo Mode)
                </h3>
                <p className="text-xs text-slate-400 mb-6 max-w-md">Initialize a functional walkthrough. The system will drive the interface to demonstrate remediation and metrics pipelines.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setDemoState({ isActive: true, isAuto: false, step: 0 }); setShowSettings(false); }}
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                  >
                    <MousePointer2 size={16} /> Interactive Demo
                  </button>
                  <button
                    onClick={() => { setDemoState({ isActive: true, isAuto: true, step: 0 }); setShowSettings(false); }}
                    className="flex items-center justify-center gap-3 px-6 py-4 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/10 transition-all"
                  >
                    <Play size={16} /> Auto-Pilot Mode
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4">Engine_Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AVAILABLE_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); localStorage.setItem('prompt_prompter_model', model.id); }}
                      className={`p-4 border transition-all text-left ${selectedModel === model.id ? 'border-cyan-500 bg-cyan-500/10 shadow-[inset_0_0_20px_rgba(0,243,255,0.05)]' : 'border-white/5 hover:border-cyan-500/30'
                        }`}
                    >
                      <div className="text-sm font-bold text-white uppercase">{model.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{model.description}</div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="pt-4 border-t border-white/5">
                <button
                  onClick={handleClearData}
                  className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-500 hover:text-black transition-all"
                >
                  ABSOLUTE_DATA_PURGE
                </button>
              </section>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 mt-24 px-6 pb-12 max-w-[1600px] mx-auto w-full grid grid-cols-12 gap-8">
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          <section className="hud-panel p-5 datadog-glow">
            <div className="hud-corner top-0 left-0 border-t-2 border-l-2"></div>
            <div className="hud-corner bottom-0 right-0 border-b-2 border-r-2 opacity-50"></div>
            <TemplateManager
              templates={templates}
              onSave={(name, content, description) => {
                const initialVersion: TemplateVersion = {
                  id: crypto.randomUUID(),
                  content,
                  description,
                  timestamp: Date.now(),
                  versionNumber: 1
                };
                const newTpl: PromptTemplate = { id: crypto.randomUUID(), name, versions: [initialVersion] };
                const updated = [newTpl, ...templates];
                setTemplates(updated);
                localStorage.setItem('prompt_prompter_templates', JSON.stringify(updated));
              }}
              onUpdate={(updated) => {
                const updatedTpls = templates.map(t => t.id === updated.id ? updated : t);
                setTemplates(updatedTpls);
                localStorage.setItem('prompt_prompter_templates', JSON.stringify(updatedTpls));
              }}
              onDelete={(id) => {
                const updated = templates.filter(t => t.id !== id);
                setTemplates(updated);
                localStorage.setItem('prompt_prompter_templates', JSON.stringify(updated));
              }}
              onSelect={setInputPrompt}
              currentInput={inputPrompt}
            />
          </section>

          <section className="hud-panel p-5 bg-purple-500/5 border-purple-500/20">
            <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Activity size={14} /> Vertex AI Diagnostics
            </h3>
            <div className="space-y-3">
              <DiagnosticLine label="Neural Entropy" value="2.4%" color="text-emerald-400" />
              <DiagnosticLine label="Context Buffer" value="78/128k" color="text-cyan-400" />
              <DiagnosticLine label="Cloud Quota" value="ACTIVE" color="text-emerald-400" />
              <div className="pt-2">
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[65%] h-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Demo HUD Docked Here (Yellow Box Area) */}
          {demoState.isActive && (
            <TourHUD
              title={DEMO_STEPS[demoState.step].title}
              description={DEMO_STEPS[demoState.step].description}
              step={demoState.step}
              total={DEMO_STEPS.length}
              isAuto={demoState.isAuto}
              onNext={() => setDemoState(prev => ({ ...prev, step: prev.step + 1 }))}
              onClose={() => setDemoState(prev => ({ ...prev, isActive: false }))}
            />
          )}
        </aside>

        <div className="col-span-12 lg:col-span-6 space-y-8">
          {activeTab === TabType.ANALYSIS ? (
            <>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-[#632CA6] rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className={`relative hud-panel p-1 bg-[#0f172a] ${demoState.isActive && DEMO_STEPS[demoState.step].prompt ? 'ring-2 ring-cyan-500 shadow-[0_0_20px_#00f3ff]' : ''}`}>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/10">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                      <Terminal size={14} /> Core_Inference_Buffer
                    </div>
                  </div>
                  <textarea
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="Initialize neural prompt string..."
                    className="w-full h-56 bg-transparent p-6 text-white placeholder-slate-600 focus:outline-none mono text-sm resize-none"
                  />
                  <div className="p-4 flex items-center justify-between border-t border-cyan-500/10">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group/toggle">
                        <div className={`w-8 h-4 rounded-full transition-colors relative ${autoOptimize ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoOptimize ? 'left-4.5' : 'left-0.5'}`}></div>
                          <input type="checkbox" className="hidden" checked={autoOptimize} onChange={() => setAutoOptimize(!autoOptimize)} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 group-hover/toggle:text-cyan-400 uppercase tracking-tighter">AUTO_OPTIMIZE_PROMPTS</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => lastPrompt && handleAnalyze(lastPrompt)}
                        disabled={isAnalyzing || !lastPrompt}
                        className={`group relative flex items-center gap-2 px-4 py-3 rounded-lg font-black tracking-widest transition-all overflow-hidden border border-cyan-500/30 ${isAnalyzing || !lastPrompt ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed' : 'bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10 active:scale-95'
                          }`}
                      >
                        <RotateCcw size={18} className={isAnalyzing ? 'animate-spin' : 'group-hover:-rotate-45 transition-transform'} />
                        <span className="text-[10px]">RE-RUN LAST</span>
                      </button>

                      <button
                        onClick={() => handleAnalyze()}
                        disabled={isAnalyzing || !inputPrompt.trim()}
                        className={`relative flex items-center gap-3 px-8 py-3 rounded-lg font-black tracking-[0.2em] transition-all overflow-hidden ${isAnalyzing ? 'bg-slate-800 text-slate-500' : 'bg-cyan-500 text-black hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-95'
                          } ${demoState.isActive && DEMO_STEPS[demoState.step].action === 'analyze' ? 'animate-glitch shadow-[0_0_30px_#00f3ff]' : ''}`}
                      >
                        {isAnalyzing ? (
                          <RefreshCw size={20} className="animate-spin" />
                        ) : (
                          <><Target size={20} /> RUN_VERTEX_SCAN</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {isAnalyzing && (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  <DataProcessingSequence />
                </div>
              )}

              {currentResult && !isAnalyzing && (
                <AnalysisDisplay result={currentResult} onOptimize={(opt) => {
                  setInputPrompt(opt);
                  handleAnalyze(opt);
                }} />
              )}

              {!currentResult && !isAnalyzing && (
                <div className="hud-panel p-12 text-center bg-cyan-500/5 border-dashed border-cyan-500/30">
                  <Crosshair className="mx-auto text-cyan-500/30 mb-6" size={48} />
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">No Active Pipeline</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">Input a target string to initialize the Gemini-powered remediation engine and verify quality tensors.</p>
                </div>
              )}
            </>
          ) : activeTab === TabType.METRICS ? (
            <MetricsTab />
          ) : (
            <section className="space-y-6">
              <div className="flex justify-between items-end mb-4 px-2">
                <h2 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-3 uppercase">
                  <HistoryIcon className="text-cyan-400" /> Snapshot History
                </h2>
                <button onClick={() => { setHistory([]); localStorage.removeItem('prompt_prompter_history'); }} className="text-[10px] font-bold text-red-500/60 hover:text-red-500 flex items-center gap-2 uppercase tracking-widest">
                  <Trash2 size={14} /> Wipe Session Cache
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map(item => (
                  <HistoryHex key={item.id} item={item} onClick={() => { setCurrentResult(item); setActiveTab(TabType.ANALYSIS); }} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="col-span-12 lg:col-span-3 space-y-6">
          <section className="hud-panel p-5 datadog-glow">
            <h3 className="text-[10px] font-black text-[#632CA6] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Dog size={14} fill="#632CA6" /> Datadog Intelligence
            </h3>
            <div className="space-y-4">
              <StatRow label="Inference Success" value="99.9%" />
              <StatRow label="Active Monitors" value="24" />
              <StatRow label="Service Health" value="OPTIMAL" />
            </div>
          </section>

          <section className="hud-panel p-5 overflow-hidden border-blue-500/30 bg-blue-500/5">
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Cloud size={14} /> Vertex AI Log Feed
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {history.slice(0, 8).map((h, i) => (
                <div key={i} className="text-[9px] mono text-slate-400 py-1 border-b border-white/5 flex gap-2">
                  <span className="text-blue-500 font-bold italic">INF:</span>
                  <span className="truncate">NODE_{h.id.slice(0, 8)}</span>
                </div>
              ))}
              <div className="text-[9px] mono text-cyan-500 animate-pulse">{'>>>'} POLLING_VERTEX_API_ENDPOINTS...</div>
            </div>
          </section>
        </aside>
      </main>

      <footer className="h-14 flex items-center justify-between border-t border-cyan-500/10 bg-[#020617] px-8">
        <div className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Cloud size={12} className="text-blue-500" /> Powered by Vertex AI</span>
          <span className="text-white/10">|</span>
          <span className="flex items-center gap-1.5"><Dog size={12} className="text-purple-500" /> Observed by Datadog</span>
        </div>
        <div className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">
          System Stability: <span className="text-emerald-500">99.999%</span>
        </div>
      </footer>
    </div>
  );
};

const DiagnosticLine: React.FC<{ label: string, value: string, color: string }> = ({ label, value, color }) => (
  <div className="flex justify-between items-center">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <span className={`text-[10px] font-black mono ${color}`}>{value}</span>
  </div>
);

const StatRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-end border-b border-white/5 pb-2">
    <span className="text-[10px] text-slate-500 font-bold">{label}</span>
    <span className="text-sm font-black text-white italic mono">{value}</span>
  </div>
);

const HistoryHex: React.FC<{ item: AnalysisResult, onClick: () => void }> = ({ item, onClick }) => (
  <div
    onClick={onClick}
    className="hud-panel p-4 group cursor-pointer hover:bg-cyan-500/5 hover:border-cyan-500/40 transition-all flex items-center gap-4"
  >
    <div className="w-12 h-12 flex items-center justify-center shrink-0">
      <Hexagon className={`transition-all ${item.metrics.accuracy_score > 0.8 ? 'text-emerald-500' : 'text-yellow-500'}`} size={44} strokeWidth={1} />
      <span className="absolute text-[10px] font-black">{Math.round(item.metrics.accuracy_score * 100)}</span>
    </div>
    <div className="min-w-0">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate">{new Date(item.timestamp).toLocaleTimeString()}</div>
      <div className="text-xs text-slate-200 line-clamp-1 italic mono mt-1">"{item.original_prompt}"</div>
    </div>
    <ChevronRight className="ml-auto text-slate-700 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" size={16} />
  </div>
);

export default App;
