import { parse, isSafeNumber } from "lossless-json";
// Keep unsafe numeric lexemes as literal body text instead of allowing native
// floating-point rounding to turn distinct API IDs into a false match.
export function inspectJSONBody(source: string): {
  value: unknown;
  semantic: boolean;
  limitation?: string;
} {
  let unsafe = false;
  try {
    const value = parse(source, undefined, {
      parseNumber(number) {
        if (!isSafeNumber(number)) unsafe = true;
        return Number(number);
      },
      // Match the existing JSON tool's explicit last-property-wins policy.
      onDuplicateKey: ({ newValue }) => newValue,
    });
    return unsafe
      ? { value: source, semantic: false, limitation: "unsafe-json-number" }
      : { value, semantic: true };
  } catch (error) {
    return {
      value: source,
      semantic: false,
      limitation:
        error instanceof SyntaxError
          ? "invalid-json-body"
          : "json-body-complexity",
    };
  }
}
