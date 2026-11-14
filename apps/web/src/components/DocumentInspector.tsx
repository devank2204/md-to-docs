import type { ValidationReport } from "@mdtodocs/validation";
import type { DocumentDiagnostic } from "@mdtodocs/compiler-core";
import type { DestinationType } from "@mdtodocs/capability-graph";
import { WorkspaceSheet } from "./WorkspaceSheet";
import { LinkedReview } from "./LinkedReview";
export function DocumentInspector({
  isOpen,
  onClose,
  diagnostics,
}: {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: DocumentDiagnostic[];
  report: ValidationReport | null;
  stats: unknown;
  destination?: DestinationType;
  onDestinationChange?: (d: DestinationType) => void;
}) {
  if (!isOpen) return null;
  return (
    <WorkspaceSheet title="Document issues" onClose={onClose}>
      <LinkedReview
        notes={diagnostics.filter(
          (d) => d.severity === "warning" || d.severity === "error",
        )}
        pending={false}
        onNavigate={() => onClose()}
      />
    </WorkspaceSheet>
  );
}
