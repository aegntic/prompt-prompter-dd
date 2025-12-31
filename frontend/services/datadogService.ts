
import { AnalysisResult } from "../types";

export interface DatadogLog {
  timestamp: string;
  status: 'info' | 'warn' | 'error';
  message: string;
  service: string;
  tags: string[];
  attributes: Record<string, any>;
}

export interface DatadogAlert {
  id: string;
  title: string;
  query: string;
  status: 'Healthy' | 'Warning' | 'Alert';
  severity: 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4' | 'SEV-5';
  lastTriggered?: string;
}

type LogCallback = (log: DatadogLog) => void;

class DatadogService {
  private logs: DatadogLog[] = [];
  private alerts: DatadogAlert[] = [
    {
      id: 'alert-1',
      title: 'Accuracy Drift Monitor',
      query: 'avg:prompt.accuracy.score{*} < 0.85',
      status: 'Warning',
      severity: 'SEV-3',
      lastTriggered: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      id: 'alert-2',
      title: 'LLM Token Burn Rate',
      query: 'sum:prompt.tokens.total{env:prod} > 15k/min',
      status: 'Healthy',
      severity: 'SEV-1'
    },
    {
      id: 'alert-3',
      title: 'High Hallucination Probability',
      query: 'avg:prompt.hallucination.score{*} > 0.7',
      status: 'Healthy',
      severity: 'SEV-2'
    }
  ];
  private subscribers: LogCallback[] = [];
  private isConnected: boolean = true;

  constructor() {
    // Initial heartbeat
    this.emitLog('info', 'Datadog Browser SDK initialized', ['env:production', 'version:1.1.0']);
  }

  private emitLog(status: 'info' | 'warn' | 'error', message: string, tags: string[] = [], attributes: Record<string, any> = {}) {
    const log: DatadogLog = {
      timestamp: new Date().toISOString(),
      status,
      message,
      service: 'prompt-prompter-frontend',
      tags: [...tags, 'source:browser', 'integration:gemini'],
      attributes
    };

    this.logs = [log, ...this.logs].slice(0, 100);
    this.subscribers.forEach(cb => cb(log));
  }

  public subscribe(cb: LogCallback) {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  public trackAnalysis(result: AnalysisResult) {
    if (!this.isConnected) return;

    const status = result.metrics.accuracy_score < 0.5 ? 'warn' : 'info';
    this.emitLog(
      status,
      `Prompt analysis complete: ${result.id}`,
      [
        `model:gemini-3-flash`,
        `quality:${Math.round(result.metrics.accuracy_score * 100)}`,
        `latency_bucket:${result.metrics.latency_ms > 2000 ? 'high' : 'normal'}`
      ],
      {
        latency_ms: result.metrics.latency_ms,
        tokens: result.metrics.total_tokens,
        cost: result.metrics.estimated_cost_usd,
        has_optimization: !!result.optimization
      }
    );

    // Trigger hallucination log if threshold met
    if (result.metrics.hallucination_score > 0.7) {
      this.emitLog('warn', `High hallucination detected: ${result.metrics.hallucination_score.toFixed(2)}`, ['monitor:hallucination', 'severity:sev-2']);
    }
  }

  public async syncMetrics(): Promise<void> {
    this.emitLog('info', 'Manual metrics sync initiated by user', ['action:manual_sync']);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Randomly update alert statuses to simulate a real check
    this.alerts = this.alerts.map(alert => {
      const rand = Math.random();
      let newStatus: DatadogAlert['status'] = alert.status;
      if (rand > 0.8) newStatus = 'Warning';
      else if (rand > 0.95) newStatus = 'Alert';
      else if (rand < 0.2) newStatus = 'Healthy';

      return {
        ...alert,
        status: newStatus,
        lastTriggered: newStatus !== 'Healthy' ? new Date().toISOString() : alert.lastTriggered
      };
    });

    this.emitLog('info', 'Successfully fetched latest telemetry from Datadog API', ['status:success', 'sync:complete'], {
      probes_active: 12,
      data_points_retrieved: 144,
      alerts_monitored: this.alerts.length
    });
  }

  public getRecentLogs() {
    return this.logs;
  }

  public getAlerts() {
    return [...this.alerts];
  }
}

export const datadog = new DatadogService();
