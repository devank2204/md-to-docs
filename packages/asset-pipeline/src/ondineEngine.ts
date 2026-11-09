import { create } from 'ondine/compiler/wasm';
import { wasm as all } from 'ondine/compiler/wasm/all';
let renderer: ReturnType<typeof create> | undefined;
export function renderOndine(source: string) {
 return (renderer ||= create({ modules: { all } })).render(source);
}
