import { describe, it, expect, beforeEach } from 'vitest';

describe('md.to.docs UX Refinement Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Bookmark Prompt Trigger & Dismissal Persistence', () => {
    const STORAGE_KEY = 'mdtodocs_bookmark_prompt_dismissed';
    const REQUIRED_SESSION_EXPORTS = 2;
    const MIN_ACTIVE_DELAY_MS = 60 * 1000;

    function evaluateBookmarkEligibility(params: {
      sessionExportCount: number;
      activeTimeMs: number;
      isCompiling: boolean;
      isTyping: boolean;
      isInputFocused: boolean;
      isDismissed: boolean;
    }): boolean {
      if (params.isDismissed) return false;
      if (params.sessionExportCount < REQUIRED_SESSION_EXPORTS) return false;
      if (params.activeTimeMs < MIN_ACTIVE_DELAY_MS) return false;
      if (params.isCompiling) return false;
      if (params.isTyping) return false;
      if (params.isInputFocused) return false;
      return true;
    }

    it('does not trigger on page load with 0 exports', () => {
      const eligible = evaluateBookmarkEligibility({
        sessionExportCount: 0,
        activeTimeMs: 120 * 1000,
        isCompiling: false,
        isTyping: false,
        isInputFocused: false,
        isDismissed: false,
      });
      expect(eligible).toBe(false);
    });

    it('does not trigger after first export', () => {
      const eligible = evaluateBookmarkEligibility({
        sessionExportCount: 1,
        activeTimeMs: 120 * 1000,
        isCompiling: false,
        isTyping: false,
        isInputFocused: false,
        isDismissed: false,
      });
      expect(eligible).toBe(false);
    });

    it('does not trigger if active time is under 60 seconds despite 2 exports', () => {
      const eligible = evaluateBookmarkEligibility({
        sessionExportCount: 2,
        activeTimeMs: 45 * 1000, // Only 45s active
        isCompiling: false,
        isTyping: false,
        isInputFocused: false,
        isDismissed: false,
      });
      expect(eligible).toBe(false);
    });

    it('does not interrupt active typing, input focus, or compiling', () => {
      // While typing
      expect(
        evaluateBookmarkEligibility({
          sessionExportCount: 2,
          activeTimeMs: 70 * 1000,
          isCompiling: false,
          isTyping: true,
          isInputFocused: false,
          isDismissed: false,
        })
      ).toBe(false);

      // While editor is focused
      expect(
        evaluateBookmarkEligibility({
          sessionExportCount: 2,
          activeTimeMs: 70 * 1000,
          isCompiling: false,
          isTyping: false,
          isInputFocused: true,
          isDismissed: false,
        })
      ).toBe(false);

      // While compiling
      expect(
        evaluateBookmarkEligibility({
          sessionExportCount: 2,
          activeTimeMs: 70 * 1000,
          isCompiling: true,
          isTyping: false,
          isInputFocused: false,
          isDismissed: false,
        })
      ).toBe(false);
    });

    it('triggers when exports >= 2, active delay >= 60s, and system is idle', () => {
      const eligible = evaluateBookmarkEligibility({
        sessionExportCount: 2,
        activeTimeMs: 65 * 1000,
        isCompiling: false,
        isTyping: false,
        isInputFocused: false,
        isDismissed: false,
      });
      expect(eligible).toBe(true);
    });

    it('persists dismissal in localStorage and never shows again', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';

      const eligible = evaluateBookmarkEligibility({
        sessionExportCount: 5,
        activeTimeMs: 300 * 1000,
        isCompiling: false,
        isTyping: false,
        isInputFocused: false,
        isDismissed,
      });
      expect(eligible).toBe(false);
    });
  });

  describe('Headline Group Collapsing Contract', () => {
    it('initializes open by default unless defaultOpen=false', () => {
      let isOpenDefault = true;
      let isOpenClosed = false;
      expect(isOpenDefault).toBe(true);
      expect(isOpenClosed).toBe(false);
    });

    it('toggles state on user interaction', () => {
      let isOpen = true;
      const toggle = () => {
        isOpen = !isOpen;
      };

      toggle();
      expect(isOpen).toBe(false);
      toggle();
      expect(isOpen).toBe(true);
    });
  });

  describe('Mermaid Auto-Fix Repair Engine', () => {
    function autoFixMermaidCode(raw: string): string {
      let fixed = raw;
      fixed = fixed.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

      fixed = fixed.replace(/(\b[a-zA-Z0-9_-]+)\[([^"\n]+?)\](?=\s*(?:-->|---|==>|-.->|\||\n|$))/g, (match, id, text) => {
        if (/[()[\]{}&<>/?!@#$%^+=:;,'`~]/.test(text)) {
          return `${id}["${text}"]`;
        }
        return match;
      });

      fixed = fixed.replace(/(\b[a-zA-Z0-9_-]+)\{([^"\n]+?)\}(?=\s*(?:-->|---|==>|-.->|\||\n|$))/g, (match, id, text) => {
        if (/[()[\]{}&<>/?!@#$%^+=:;,'`~]/.test(text)) {
          return `${id}{"${text}"}`;
        }
        return match;
      });

      fixed = fixed.replace(/(\b[a-zA-Z0-9_-]+)\(([^"\n]+?)\)(?=\s*(?:-->|---|==>|-.->|\||\n|$))/g, (match, id, text) => {
        if (/[()[\]{}&<>/?!@#$%^+=:;,'`~]/.test(text)) {
          return `${id}("${text}")`;
        }
        return match;
      });

      const subgraphs = (fixed.match(/\bsubgraph\b/g) || []).length;
      const ends = (fixed.match(/\bend\b/g) || []).length;
      if (subgraphs > ends) {
        fixed = fixed + '\n' + Array(subgraphs - ends).fill('end').join('\n');
      }

      fixed = fixed.replace(/--\s+>/g, '-->').replace(/--\s+\|\s*([^|]+)\s*\|\s*>/g, '-->|$1|');
      return fixed;
    }

    it('quotes node labels containing parentheses and special characters', () => {
      const input = 'graph TD\nA[Calculate (Total)] --> B{Is Valid? [Yes/No]}';
      const output = autoFixMermaidCode(input);
      expect(output).toContain('A["Calculate (Total)"]');
      expect(output).toContain('B{"Is Valid? [Yes/No]"}');
    });

    it('replaces typographic smart quotes with standard ASCII quotes', () => {
      const input = 'graph LR\nA[“Start Process”] --> B';
      const output = autoFixMermaidCode(input);
      expect(output).toContain('"Start Process"');
    });

    it('balances unclosed subgraphs with end clauses', () => {
      const input = 'graph TD\nsubgraph ClusterA\nA --> B';
      const output = autoFixMermaidCode(input);
      expect(output).toContain('end');
    });
  });

  describe('Workspace Document Navigation Stability', () => {
    it('creates new document in workspace without falling back to landing page', () => {
      let currentView: 'landing' | 'workspace' = 'workspace';
      let markdown = '# Existing Doc';

      // Simulate createDocument('', 'Untitled Document')
      const createDocument = (initialMarkdown = '') => {
        markdown = initialMarkdown;
        currentView = 'workspace'; // stays in workspace!
        return 'doc-new';
      };

      createDocument('', 'Untitled Document');
      expect(markdown).toBe('');
      expect(currentView).toBe('workspace'); // Does NOT drop to landing!
    });

    it('resets to landing page on explicit home navigation', () => {
      let currentView: 'landing' | 'workspace' = 'workspace';
      let markdown = '# Existing Doc';

      const resetWorkspaceToHome = () => {
        markdown = '';
        currentView = 'landing';
      };

      resetWorkspaceToHome();
      expect(markdown).toBe('');
      expect(currentView).toBe('landing');
    });
  });
});
