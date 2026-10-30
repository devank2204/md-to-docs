import type { DestinationType } from '@mdtodocs/capability-graph';

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export interface DiagnosticFixAction {
  label: string;
  description: string;
  autoFixable: boolean;
  apply?: (tree: any) => void;
}

export interface DocumentDiagnostic {
  id: string;
  ruleId: string;
  severity: DiagnosticSeverity;
  destination: DestinationType;
  message: string;
  nodeType?: string;
  nodeId?: string;
  position?: { line: number; column: number };
  suggestedAction?: string;
  fixAction?: DiagnosticFixAction;
  requiresVisualVerification?: boolean;
}

export * from './mermaidFix';
export * from './rescue';

// Backward-compatible alias for existing consumers
export type Diagnostic = DocumentDiagnostic;

export class DiagnosticsCollector {
  private diagnostics: DocumentDiagnostic[] = [];

  public add(diagnostic: Partial<DocumentDiagnostic> & { severity: DiagnosticSeverity; message: string }) {
    this.diagnostics.push({
      id: diagnostic.id || Math.random().toString(36).substring(2, 11),
      ruleId: diagnostic.ruleId || 'general',
      severity: diagnostic.severity,
      destination: diagnostic.destination || 'word',
      message: diagnostic.message,
      nodeType: diagnostic.nodeType,
      nodeId: diagnostic.nodeId,
      position: diagnostic.position,
      suggestedAction: diagnostic.suggestedAction,
      fixAction: diagnostic.fixAction,
    });
  }

  public getAll(): DocumentDiagnostic[] {
    return this.diagnostics;
  }

  public getDiagnostics(): DocumentDiagnostic[] {
    return this.diagnostics;
  }

  public getBySeverity(severity: DiagnosticSeverity): DocumentDiagnostic[] {
    return this.diagnostics.filter(d => d.severity === severity);
  }

  public getWarnings(): DocumentDiagnostic[] {
    return this.getBySeverity('warning');
  }

  public getErrors(): DocumentDiagnostic[] {
    return this.getBySeverity('error');
  }

  public hasWarnings(): boolean {
    return this.diagnostics.some(d => d.severity === 'warning');
  }

  public hasErrors(): boolean {
    return this.diagnostics.some(d => d.severity === 'error');
  }

  public clear() {
    this.diagnostics = [];
  }
}

