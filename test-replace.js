const b64 = btoa(unescape(encodeURIComponent('<svg><foreignObject>Hello!</foreignObject></svg>')));
const html = `<img src="data:image/svg+xml;base64,${b64}" />`;
const replaced = html.replace(/<img src="data:image\/svg\+xml;base64,([^"]+)"[^>]*>/g, (match, b64Data) => {
  return decodeURIComponent(escape(atob(b64Data)));
});
console.log(replaced);
