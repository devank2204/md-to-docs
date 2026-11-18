import {
  compareJSON,
  changesFromDelta,
  type Change,
  type JSONScrollPair,
} from "../model";
import {
  parseCurl,
  sections,
  type ParsedCurl,
  type Section,
} from "./parseCurl";
export type RequestChange = {
  section: Section;
  change: Change;
  bodyIndex?: number;
};
export type RequestReview = {
  sources: string[];
  parsed: (ParsedCurl | undefined)[];
  errors: (string | undefined)[];
  changes: RequestChange[];
  bodyChanges: Change[];
  bodyPairs: JSONScrollPair[];
  error?: string;
};
export function reviewRequests(sources: string[]): RequestReview {
  const errors: RequestReview["errors"] = [];
  const parsed = sources.map((source, index) => {
    if (!source.trim()) return undefined;
    try {
      return parseCurl(source);
    } catch (error) {
      errors[index] =
        error instanceof Error
          ? error.message
          : "Could not interpret this command.";
      return undefined;
    }
  });
  const result: RequestReview = {
    sources,
    parsed,
    errors,
    changes: [],
    bodyChanges: [],
    bodyPairs: [],
  };
  const [a, b] = parsed;
  if (!a || !b) return result;
  try {
    for (const section of sections) {
      const body = section === "Body" && a.bodyJSON && b.bodyJSON;
      const diff = compareJSON(
        body ? a.bodySource! : JSON.stringify(a.values[section]),
        body ? b.bodySource! : JSON.stringify(b.values[section]),
      );
      const changes = changesFromDelta(diff.delta, diff.left);
      if (body) {
        result.bodyChanges = changes;
        result.bodyPairs = diff.scrollPairs;
      }
      result.changes.push(
        ...changes.map((change, index) => ({
          section,
          change,
          bodyIndex: body ? index : undefined,
        })),
      );
    }
  } catch (error) {
    result.error =
      error instanceof Error
        ? error.message
        : "Semantic comparison could not complete.";
    result.changes = [];
  }
  return result;
}
