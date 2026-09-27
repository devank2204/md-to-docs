import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { DestinationType } from '@mdtodocs/capability-graph';
import { evaluateCapability } from '@mdtodocs/capability-graph';

export interface ValidationReport {
  destination: DestinationType;
  timestamp: string;
  results: ValidationResult[];
  summary: {
    total: number;
    preserved: number;
    transformed: number;
    degraded: number;
    unsupported: number;
    fidelityScore: number; // 0-100
  };
}

export interface ValidationResult {
  nodeId?: string;
  element: string; // e.g., 'Heading', 'Table', 'ImageBlock'
  status: 'preserved' | 'transformed' | 'degraded' | 'unsupported';
  message?: string;
}

export function validateDocument(doc: Root, destination: DestinationType): ValidationReport {
  const results: ValidationResult[] = [];
  
  visit(doc, (node: any) => {
    if (!node.type) return;

    const cap = evaluateCapability(node.type, node, destination);
    
    let status: ValidationResult['status'] = 'preserved';
    let message = cap.reason;

    if (cap.support === 'native') {
      status = 'preserved';
    } else if (cap.support === 'styled' || cap.support === 'image' || cap.support === 'text') {
      // Technically these are transformations to simulate support
      status = 'transformed';
    } else if (cap.support === 'transformed') {
      status = 'degraded'; // Degraded because structural integrity changed (e.g. Table -> List)
    } else {
      status = 'unsupported';
    }

    // If it's a styled element but it's fundamentally native enough (e.g., Blockquote on styled)
    // let's consider it preserved for fidelity score if it requires no polyfill
    if (!cap.requiresPolyfill && cap.support === 'styled') {
        status = 'preserved';
    }

    results.push({
      nodeId: node.id || Math.random().toString(36).substr(2, 9),
      element: node.type,
      status,
      message,
    });
  });

  const total = results.length;
  const preserved = results.filter(r => r.status === 'preserved').length;
  const transformed = results.filter(r => r.status === 'transformed').length;
  const degraded = results.filter(r => r.status === 'degraded').length;
  const unsupported = results.filter(r => r.status === 'unsupported').length;

  // Simple weighted score: preserved=100, transformed=90, degraded=50, unsupported=0
  const score = total === 0 ? 100 : Math.round(
    ((preserved * 100) + (transformed * 90) + (degraded * 50)) / total
  );

  return {
    destination,
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total,
      preserved,
      transformed,
      degraded,
      unsupported,
      fidelityScore: score,
    },
  };
}
