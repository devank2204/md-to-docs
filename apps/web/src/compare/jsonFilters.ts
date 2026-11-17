import type { Change } from "./model";
export const changeTypes = ["Added", "Removed", "Modified"] as const;
export type IgnoredPath = { path: string; segments: (string | number)[] };
// Presentation filtering only. jsondiffpatch still computes the complete delta.
// A parent replacement/addition remains visible when only its child is ignored.
export function visibleJSONChanges(
  changes: Change[],
  types: readonly string[],
  ignored: IgnoredPath[],
) {
  return changes.filter(
    (change) =>
      types.includes(change.type) &&
      !ignored.some(
        (item) =>
          item.segments.length <= change.segments.length &&
          item.segments.every((key, index) => key === change.segments[index]),
      ),
  );
}
