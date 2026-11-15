// Retain an explicit click while the deferred repair tool is loading.
let pending: { detail?: unknown } | undefined;
export function requestDiagramReview() {
  pending = {};
  window.dispatchEvent(new CustomEvent('mdtodocs:mermaid-review'));
}
export function takeDiagramReviewRequest() {
  const request = pending;
  pending = undefined;
  return request;
}
