export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export interface Diagnostic {
  id: string;
  severity: DiagnosticSeverity;
  message: string;
  nodeId?: string;
  suggestedAction?: string;
}

export class DiagnosticsCollector {
  private diagnostics: Diagnostic[] = [];

  public add(diagnostic: Omit<Diagnostic, 'id'>) {
    this.diagnostics.push({
      id: Math.random().toString(36).substr(2, 9),
      ...diagnostic
    });
  }

  public getAll(): Diagnostic[] {
    return this.diagnostics;
  }
  
  public clear() {
    this.diagnostics = [];
  }
}
