import type { DocumentSnapshot } from "@mdtodocs/renderers/src/documentManager";
export const SAFETY_KEY = "md-to-docs-recovery";
export function safetyVersions(): DocumentSnapshot[] {
  try {
    return JSON.parse(localStorage.getItem(SAFETY_KEY) || "[]");
  } catch {
    return [];
  }
}
export function persistSafety(snapshot: DocumentSnapshot): boolean {
  try {
    const versions = safetyVersions();
    const value = JSON.stringify([snapshot, ...versions]);
    localStorage.setItem(SAFETY_KEY, value);
    return localStorage.getItem(SAFETY_KEY) === value;
  } catch {
    return false;
  }
}
