import { APILogEntry, AIProvider } from '../types';

type LogListener = (logs: APILogEntry[]) => void;

class LoggerService {
  private logs: APILogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 60;

  constructor() {
    // Load existing logs from session if any
    try {
      const saved = sessionStorage.getItem('scrolllearn_api_logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch {
      this.logs = [];
    }
  }

  public getLogs(): APILogEntry[] {
    return [...this.logs];
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = this.getLogs();
    try {
      sessionStorage.setItem('scrolllearn_api_logs', JSON.stringify(copy.slice(0, 30)));
    } catch {
      // ignore
    }
    this.listeners.forEach((fn) => fn(copy));
  }

  public startCall(
    provider: AIProvider,
    model: string,
    action: APILogEntry['action'],
    requestSnippet: string,
    fullPayload?: any
  ): string {
    const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const entry: APILogEntry = {
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      provider,
      model,
      action,
      status: 'pending',
      requestSnippet,
      fullPayload
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.notify();
    return id;
  }

  public completeCall(
    id: string,
    statusCode: number,
    latencyMs: number,
    responseSnippet: string,
    fullResponse?: any
  ) {
    const entry = this.logs.find((l) => l.id === id);
    if (entry) {
      entry.status = statusCode >= 200 && statusCode < 300 ? 'success' : 'error';
      entry.statusCode = statusCode;
      entry.latencyMs = latencyMs;
      entry.responseSnippet = responseSnippet;
      if (fullResponse) {
        entry.fullPayload = { ...entry.fullPayload, response: fullResponse };
      }
      this.notify();
    }
  }

  public failCall(id: string, errorMessage: string, latencyMs?: number, statusCode?: number) {
    const entry = this.logs.find((l) => l.id === id);
    if (entry) {
      entry.status = 'error';
      entry.errorMessage = errorMessage;
      entry.statusCode = statusCode || 500;
      entry.latencyMs = latencyMs;
      this.notify();
    }
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  public hasInFlightCalls(): boolean {
    return this.logs.some((l) => l.status === 'pending');
  }

  public hasRecentErrors(): boolean {
    return this.logs.slice(0, 5).some((l) => l.status === 'error');
  }
}

export const loggerService = new LoggerService();
