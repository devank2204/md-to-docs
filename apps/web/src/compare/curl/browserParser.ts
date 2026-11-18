import Parser from "web-tree-sitter";
import runtimeURL from "web-tree-sitter/tree-sitter.wasm?url";
import bashURL from "curlconverter/dist/tree-sitter-bash.wasm?url";

let initializationTimer: ReturnType<typeof setTimeout> | undefined;
const language = await Promise.race([
  (async () => {
    await Parser.init({ locateFile: () => runtimeURL });
    return Parser.Language.load(bashURL);
  })(),
  new Promise<never>((_resolve, reject) => {
    initializationTimer = setTimeout(
      () => reject(new Error("Local parser assets did not load.")),
      8_000,
    );
  }),
]).finally(() => clearTimeout(initializationTimer));
const parser = new Parser();
parser.setLanguage(language);
parser.setTimeoutMicros(50_000);
// Upstream tokenize returns Words carrying AST nodes. Retain trees only during
// one synchronous interpretation, then release their WASM allocations.
const trees: Parser.Tree[] = [];
export function releaseParseTrees() {
  trees.splice(0).forEach((tree) => tree.delete());
}
export default {
  parse(input: string) {
    try {
      const tree = parser.parse(input);
      if (!tree) throw new Error("Parsing exceeded its time limit.");
      trees.push(tree);
      return tree;
    } catch (error) {
      parser.reset();
      throw error;
    }
  },
};
