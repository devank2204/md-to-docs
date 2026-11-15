// Installed Piixpal modules, bundled locally. No CDN fallback or document upload.
export async function startLogoSnow(host: HTMLElement) {
  if (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData
  )
    return;
  await import("piixpal/core");
  await import("piixpal/c/weather");
  if (!host.isConnected || !host.matches(":hover")) return;
  const weather = document.createElement("piix-weather");
  weather.setAttribute("kind", "snow");
  weather.setAttribute("amount", "0.12");
  weather.setAttribute("box", `#${host.id}`);
  weather.setAttribute("land", `#${host.id} .brand-wordmark-name`);
  weather.setAttribute("aria-hidden", "true");
  host.append(weather);
  return () => weather.remove();
}
