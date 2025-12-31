
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ExternalLink, ListFilter, Search, Terminal, RefreshCw, CheckCircle, AlertTriangle, ShieldAlert, ShieldCheck, Activity, Database, Zap, Dog, Info } from 'lucide-react';
import { datadog, DatadogLog, DatadogAlert } from '../services/datadogService';

const generateMockData = () => Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  latency: 1200 + Math.random() * 800,
  accuracy: (0.7 + Math.random() * 0.25) * 100,
  tokens: Math.round(400 + Math.random() * 1000),
}));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="hud-panel p-4 border-[#632CA6] bg-[#0f172a]/95 backdrop-blur-md shadow-2xl">
        <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 border-b border-purple-500/20 pb-1">
          Telemetry Snapshot: {label}
        </div>
        <div className="space-y-3">
          <div className="group">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Activity size={10} className="text-purple-400" /> Latency
              </span>
              <span className="text-xs font-black mono text-purple-300">{data.latency.toFixed(1)}ms</span>
            </div>
            <p className="text-[8px] text-slate-600 mt-1 leading-tight italic max-w-[180px]">
              Total round-trip time for neural inference through Vertex AI routing layers.
            </p>
          </div>
          <div className="group">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Zap size={10} className="text-emerald-400" /> Accuracy
              </span>
              <span className="text-xs font-black mono text-emerald-400">{data.accuracy.toFixed(1)}%</span>
            </div>
            <p className="text-[8px] text-slate-600 mt-1 leading-tight italic max-w-[180px]">
              Composite confidence score derived from semantic alignment and structural validity.
            </p>
          </div>
          <div className="group">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Database size={10} className="text-cyan-400" /> Tokens
              </span>
              <span className="text-xs font-black mono text-cyan-300">{data.tokens}</span>
            </div>
            <p className="text-[8px] text-slate-600 mt-1 leading-tight italic max-w-[180px]">
              Quantized computational units consumed by the Gemini-3 Flash inference cluster.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const MetricsTab: React.FC = () => {
  const [logs, setLogs] = useState<DatadogLog[]>(datadog.getRecentLogs());
  const [alerts, setAlerts] = useState<DatadogAlert[]>(datadog.getAlerts());
  const [isSyncing, setIsSyncing] = useState(false);
  const [chartData, setChartData] = useState(generateMockData());
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = datadog.subscribe((newLog) => {
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await datadog.syncMetrics();
    setChartData(generateMockData()); 
    setAlerts(datadog.getAlerts());
    setLastSync(new Date().toLocaleTimeString());
    setIsSyncing(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Tactical Datadog Header */}
      <div className="flex flex-col md:row-span-1 md:flex-row justify-between items-start md:items-end gap-4 border-b border-purple-500/20 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#632CA6] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,44,166,0.3)]">
            <Dog className="text-white" size={32} fill="white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
               Datadog Observability Hub
            </h2>
            <p className="text-purple-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">
              Unified Platform Telemetry Stream | Cloud Cluster: US-EAST-1
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`px-6 py-2 border text-[10px] font-black uppercase tracking-widest transition-all ${
              isSyncing ? 'border-purple-500 text-purple-400 cursor-wait' : 'border-[#632CA6] text-white bg-[#632CA6]/20 hover:bg-[#632CA6]/40 active:scale-95'
            }`}
          >
            {isSyncing ? 'POLLING_AGENT...' : 'FORCE_RE-SYNC'}
          </button>
          <div className="flex flex-col items-end">
             <div className="text-[9px] font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-widest">
               <ShieldCheck size={10} /> Agent API: v7.51
             </div>
             <div className="text-[10px] mono text-slate-600 uppercase">Stream Integrity: 100%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Latency Radar HUD */}
        <div className="hud-panel p-8 lg:col-span-2 relative min-h-[400px] border-purple-500/20">
          {isSyncing && (
            <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-sm flex items-center justify-center z-10">
              <RefreshCw className="text-[#632CA6] animate-spin" size={48} />
            </div>
          )}
          <div className="flex justify-between items-start mb-10">
            <div>
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Datadog_P95_Neural_Latency</h3>
               <div className="text-3xl font-black text-purple-400 italic mono tracking-tighter">1,452.3 <span className="text-sm font-light text-slate-500">MS</span></div>
            </div>
            <div className="text-right flex flex-col items-end">
               <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Peak</div>
               <div className="text-lg font-black text-purple-500 italic mono">92.4%</div>
               <div className="text-[8px] font-bold text-purple-400/60 uppercase mt-1 flex items-center gap-1">
                 <Info size={10} /> Hover node for detailed metrics
               </div>
            </div>
          </div>
          <div className="h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#632CA6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#632CA6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 44, 166, 0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="stepAfter" dataKey="latency" stroke="#632CA6" strokeWidth={3} fillOpacity={1} fill="url(#colorHud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tactical Log Feed */}
        <div className="hud-panel flex flex-col h-[400px] lg:h-auto border-purple-500/20">
          <div className="p-4 border-b border-purple-500/10 flex items-center justify-between bg-purple-500/5">
            <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal size={14} /> Datadog_Log_Explorer
            </h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]"></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 mono text-[10px] scrollbar-thin">
            {logs.map((log, idx) => (
              <div key={idx} className="border-l border-purple-500/30 pl-3 py-1 hover:bg-purple-500/10 transition-colors group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`font-black uppercase tracking-widest ${log.status === 'warn' ? 'text-amber-500' : 'text-purple-400'}`}>
                    {log.status}
                  </span>
                </div>
                <div className="text-slate-400 group-hover:text-white transition-colors">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monitor Alert Grid with Datadog Styling */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <ShieldAlert size={14} className="text-red-500" /> Active Datadog Monitors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alerts.map(alert => (
            <MonitorHud key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
};

const MonitorHud: React.FC<{ alert: DatadogAlert }> = ({ alert }) => {
  const isHealthy = alert.status === 'Healthy';
  const isAlert = alert.status === 'Alert';
  
  return (
    <div className={`hud-panel p-6 border-l-4 transition-all ${
      isAlert ? 'border-l-red-500 bg-red-500/5' : 
      isHealthy ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-amber-500 bg-amber-500/5'
    }`}>
      <div className="flex justify-between items-start">
        <div className="min-w-0 pr-4">
          <h4 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-2">
            {isHealthy ? <ShieldCheck size={14} className="text-emerald-500" /> : <ShieldAlert size={14} />}
            {alert.title}
          </h4>
          <div className="mt-2 p-2 bg-black/40 rounded border border-white/5 mono text-[9px] text-slate-500 truncate">
            {alert.query}
          </div>
          {alert.lastTriggered && !isHealthy && (
             <div className="text-[9px] font-bold text-slate-600 uppercase mt-3 tracking-widest italic">
               Alert_Trigger_Timestamp: {new Date(alert.lastTriggered).toLocaleTimeString()}
             </div>
          )}
        </div>
        <div className="text-right">
          <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded flex items-center gap-2 ${
            isAlert ? 'bg-red-500 text-black' : isHealthy ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black'
          }`}>
            {alert.status}
          </div>
          <div className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-tighter mono">SEV_{alert.severity}</div>
        </div>
      </div>
    </div>
  );
};

export default MetricsTab;
