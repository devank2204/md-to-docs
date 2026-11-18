export function requestWarning(code: string) {
  const descriptions: Record<string, string> = {
    "external-files":
      "Referenced files are not read. Only their names are compared.",
    "unsafe-json-number":
      "JSON numbers exceed lossless comparison precision. The body is compared as text.",
    "invalid-json-body": "The body is not valid JSON. It is compared as text.",
    "json-body-complexity":
      "The JSON body is too complex to interpret safely. It is compared as text.",
  };
  return Object.hasOwn(descriptions, code)
    ? descriptions[code]
    : `Not fully interpreted: ${code}. Review the raw command differences.`;
}
