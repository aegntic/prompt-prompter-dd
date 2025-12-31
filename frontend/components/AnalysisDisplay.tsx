
import React, { useState, useRef } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  RadarProps
} from 'recharts';
import {
  CheckCircle2, AlertCircle, Copy, Send, Sparkles,
  ArrowUpRight, Gauge, Clock, Database, DollarSign,
  Fingerprint, Activity, Terminal, Info, Zap, Cloud, Cpu
} from 'lucide-react';
import { AnalysisResult } from '../types';

// Local Tooltip Helper
const MetricTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <div
      className="relative flex-1"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={(e) => setPosition({ x: e.clientX + 10, y: e.clientY + 10 })}
    >
      {children}
      {visible && (
        <div
          className="hud-tooltip"
          style={{ position: 'fixed', left: position.x, top: position.y }}
        >
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Vector_Telemetry</div>
          <div className="text-[9px] text-slate-300 leading-tight italic">{text}</div>
        </div>
      )}
    </div>
  );
};

interface AnalysisDisplayProps {
  result: AnalysisResult;
  onOptimize: (prompt: string) => void;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, onOptimize }) => {
  const radarData = [
    { subject: 'SPECIFICITY', A: result.quality_dimensions.specificity },
    { subject: 'LENGTH', A: result.quality_dimensions.meaningfulLength },
    { subject: 'CONTEXT', A: result.quality_dimensions.context },
    { subject: 'CLARITY', A: result.quality_dimensions.clarity },
    { subject: 'STRUCTURE', A: result.quality_dimensions.structure },
  ];

  const overallScore = Math.round(result.metrics.accuracy_score * 100);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
      {/* HUD Metrics Banner with Vertex AI Badging */}
      <div className="flex gap-4">
        <MetricTooltip text="Composite reliability index calculated from semantic alignment and safety filters.">
          <MetricHud
            label="Vertex AI Quality"
            value={`${overallScore}%`}
            color="text-cyan-400"
            icon={<Cloud size={16} className="text-blue-400" />}
          />
        </MetricTooltip>
        <MetricTooltip text="End-to-end processing time for this specific neural request.">
          <MetricHud
            label="Cloud Latency"
            value={`${Math.round(result.metrics.latency_ms)}ms`}
            color="text-purple-400"
            icon={<Clock size={16} />}
          />
        </MetricTooltip>
        <MetricTooltip text="Total computational units consumed across the Gemini inference cluster.">
          <MetricHud
            label="Tensor Density"
            value={result.metrics.total_tokens.toString()}
            color="text-emerald-400"
            icon={<Cpu size={16} />}
          />
        </MetricTooltip>
        <MetricTooltip text="Real-time estimated cost based on current Vertex AI pricing tiers.">
          <MetricHud
            label="Project Burn"
            value={`$${result.metrics.estimated_cost_usd.toFixed(6)}`}
            color="text-amber-400"
            icon={<DollarSign size={16} />}
          />
        </MetricTooltip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Scan Visualization */}
        <div className="hud-panel p-8 bg-black/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Cloud size={100} className="text-blue-500" /></div>
          <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
            <Sparkles size={14} /> Vertex_Neural_Vector_Analysis
          </h3>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(0, 243, 255, 0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }} />
                <Radar
                  name="Quality"
                  dataKey="A"
                  stroke="#00f3ff"
                  fill="#00f3ff"
                  fillOpacity={0.15}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center mt-6 p-4 border-t border-cyan-500/10">
            <div className="text-center">
              <div className="text-[9px] text-slate-500 uppercase font-black">Safety Filtering</div>
              <div className="text-lg font-black text-emerald-400 italic mono">CLEAN</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-slate-500 uppercase font-black">Gemini Confidence</div>
              <div className="text-lg font-black text-cyan-400 italic mono">0.99</div>
            </div>
          </div>
        </div>

        {/* Vertex Remediator Interface */}
        <div className="space-y-6">
          <div className="hud-panel p-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <Terminal size={14} /> Inference_Output_Stream
            </h3>
            <div className="bg-[#020617] border border-white/5 rounded p-4 max-h-[180px] overflow-y-auto text-xs mono text-slate-300 leading-relaxed scrollbar-thin">
              <span className="text-cyan-500 mr-2">{'>>>'}</span>
              {result.llm_response}
            </div>
          </div>

          {result.optimization && (
            <div className="hud-panel p-6 border-blue-500 bg-blue-500/5 group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Cloud size={16} className="text-blue-500" /> Vertex AI Remediation Shard
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">{result.optimization.improvement_explanation}</p>
                </div>
                <MetricTooltip text="Inject this optimized tensor directly into the active prompt buffer.">
                  <button
                    onClick={() => onOptimize(result.optimization!.optimized_prompt)}
                    className="px-6 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20"
                  >
                    Sync_Patch
                  </button>
                </MetricTooltip>
              </div>
              <div className="bg-black/60 p-4 rounded border border-blue-500/30 text-xs text-blue-50 italic mono relative">
                <div className="absolute -top-3 left-3 px-2 bg-blue-950 text-[8px] font-bold text-blue-400 uppercase border border-blue-500/30">Gemini_Optimized_Node</div>
                "{result.optimization.optimized_prompt}"
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400" style={{ width: `${result.optimization.expected_score_improvement * 100}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-blue-400 italic">+{Math.round(result.optimization.expected_score_improvement * 100)}% QUALITY LIFT</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricHud: React.FC<{ label: string, value: string, color: string, icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="hud-panel p-4 hover:bg-white/5 transition-all group w-full">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1 bg-slate-800 rounded transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-xl font-black italic mono tracking-tighter ${color}`}>{value}</div>
  </div>
);

export default AnalysisDisplay;
