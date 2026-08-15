const PLATFORM_MATCHERS = [
  { platform: "mixcloud", test: (hostname) => hostname.includes("mixcloud.com") },
  { platform: "soundcloud", test: (hostname) => hostname.includes("soundcloud.com") },
  { platform: "youtube", test: (hostname) => hostname.includes("youtube.com") || hostname.includes("youtu.be") },
];

export function detectMixPlatform(url) {
  try {
    const { hostname } = new URL(url);
    return PLATFORM_MATCHERS.find((m) => m.test(hostname))?.platform ?? null;
  } catch {
    return null;
  }
}

function youtubeVideoId(url) {
  const { hostname, pathname, searchParams } = new URL(url);
  if (hostname.includes("youtu.be")) return pathname.slice(1);
  if (searchParams.get("v")) return searchParams.get("v");
  const match = pathname.match(/\/embed\/([^/?]+)/);
  return match ? match[1] : null;
}

// Each of these platforms exposes a public embed widget that can be built
// straight from the share URL — no oEmbed round-trip or API key needed.
export function getMixEmbedSrc(url, platform) {
  try {
    if (platform === "mixcloud") {
      const { pathname } = new URL(url);
      return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=${encodeURIComponent(pathname)}`;
    }
    if (platform === "soundcloud") {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff6a3d&auto_play=false&hide_related=true&show_comments=false&show_reposts=false&visual=false`;
    }
    if (platform === "youtube") {
      const id = youtubeVideoId(url);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}
