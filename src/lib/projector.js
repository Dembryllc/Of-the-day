export const PROJECTOR_THEMES = {
  Calm:        { label: "Calm",          background: "#062A28", top: "#0F766E", accent: "#99F6E4", text: "#FFFFFF", surface: "rgba(255,255,255,0.10)", homeAccent: "#0F766E", homeSoft: "#E6FFFA" },
  Bright:      { label: "Bright",        background: "#7C2D12", top: "#EA580C", accent: "#FDE047", text: "#FFFFFF", surface: "rgba(255,255,255,0.12)", homeAccent: "#EA580C", homeSoft: "#FFF7ED" },
  Minimal:     { label: "Minimal",       background: "#050505", top: "#111827", accent: "#FFFFFF", text: "#FFFFFF", surface: "rgba(255,255,255,0.08)", homeAccent: "#111827", homeSoft: "#F3F4F6" },
  Primary:     { label: "Primary",       background: "#082F49", top: "#0369A1", accent: "#BAE6FD", text: "#FFFFFF", surface: "rgba(255,255,255,0.12)", homeAccent: "#0369A1", homeSoft: "#E0F2FE" },
  Focus:       { label: "Focus",         background: "#2E1065", top: "#7C3AED", accent: "#DDD6FE", text: "#FFFFFF", surface: "rgba(255,255,255,0.12)", homeAccent: "#7C3AED", homeSoft: "#F3E8FF" },
  Chalkboard:  { label: "Chalkboard",    background: "#064E3B", top: "#022C22", accent: "#FACC15", text: "#FFF7D6", surface: "rgba(255,255,255,0.10)", homeAccent: "#047857", homeSoft: "#ECFDF5" },
  Celebration: { label: "Celebration",   background: "#831843", top: "#BE123C", accent: "#FDE047", text: "#FFFFFF", surface: "rgba(255,255,255,0.14)", homeAccent: "#BE123C", homeSoft: "#FFF1F2" },
};

export const THEME_BACKGROUND_PRESETS = {
  Calm:        "CalmGradient",
  Bright:      "Rainbow",
  Minimal:     "Solid",
  Primary:     "SoftClouds",
  Focus:       "Stars",
  Chalkboard:  "Chalkboard",
  Celebration: "Confetti",
};

export const PROJECTOR_BACKGROUNDS = {
  Solid:        { label: "Solid",         image: "none" },
  CalmGradient: { label: "Calm Gradient", image: "radial-gradient(circle at 10% 20%, rgba(20,184,166,1) 0 0, transparent 26%), radial-gradient(circle at 90% 18%, rgba(45,212,191,.86) 0 0, transparent 24%), radial-gradient(circle at 54% 92%, rgba(15,118,110,.92) 0 0, transparent 30%), linear-gradient(135deg, #042F2E 0%, #0F766E 48%, #020617 100%)" },
  Chalkboard:   { label: "Chalkboard",    image: "repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 2px, transparent 2px 19px), repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 2px, transparent 2px 23px), radial-gradient(circle at 85% 18%, rgba(250,204,21,.44), transparent 22%), linear-gradient(135deg, #065F46, #022C22)" },
  Notebook:     { label: "Notebook",      image: "linear-gradient(rgba(186,230,253,.58) 2px, transparent 2px), linear-gradient(90deg, rgba(248,113,113,.95) 0 5px, transparent 5px), linear-gradient(135deg, #0C4A6E, #082F49)" },
  Stars:        { label: "Stars",         image: "radial-gradient(circle at 10% 18%, #FFFFFF 0 3px, transparent 4px), radial-gradient(circle at 30% 44%, #FDE047 0 3px, transparent 4px), radial-gradient(circle at 72% 24%, #FFFFFF 0 3px, transparent 4px), radial-gradient(circle at 58% 76%, #DDD6FE 0 5px, transparent 6px), radial-gradient(circle at 90% 70%, #BAE6FD 0 4px, transparent 5px), linear-gradient(135deg, #020617 0%, #4C1D95 58%, #111827 100%)" },
  SoftClouds:   { label: "Soft Clouds",   image: "radial-gradient(circle at 16% 24%, rgba(255,255,255,.95), transparent 22%), radial-gradient(circle at 66% 18%, rgba(255,255,255,.78), transparent 20%), radial-gradient(circle at 80% 76%, rgba(186,230,253,.76), transparent 24%), linear-gradient(135deg, #075985, #0284C7 52%, #0C4A6E)" },
  Rainbow:      { label: "Rainbow",       image: "linear-gradient(115deg, #E11D48 0%, #F97316 16%, #FACC15 31%, #22C55E 48%, #06B6D4 64%, #2563EB 80%, #7C3AED 100%)" },
  Confetti:     { label: "Confetti",      image: "radial-gradient(circle at 8% 18%, #FDE047 0 10px, transparent 11px), radial-gradient(circle at 84% 16%, #2DD4BF 0 9px, transparent 10px), radial-gradient(circle at 32% 74%, #FB7185 0 11px, transparent 12px), radial-gradient(circle at 84% 80%, #BAE6FD 0 10px, transparent 11px), radial-gradient(circle at 54% 36%, #FFFFFF 0 7px, transparent 8px), conic-gradient(from 45deg at 50% 50%, #831843, #BE123C, #EA580C, #7C3AED, #831843)" },
  CustomUrl:    { label: "Direct URL",    image: "" },
};

export const DEFAULT_PROJECTOR_STYLE = {
  className: "",
  motto: "",
  theme: "Calm",
  backgroundColor: "",
  topColor: "",
  accentColor: "",
  textColor: "",
  backgroundPreset: "Solid",
  backgroundUrl: "",
  overlayOpacity: 42,
  textSize: "Large",
  showTimer: true,
  showStarter: true,
  homeAccent: "",
  homeSoft: "",
};

export function normalizeColor(value, fallback) {
  return /^#[0-9A-Fa-f]{6}$/.test(value || "") ? value : fallback;
}

export function normalizeBackgroundUrl(value = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(https?:\/\/|data:image\/)/i.test(url)) return url.slice(0, 1200);
  return "";
}

export function isLikelyDirectImageUrl(url = "") {
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url) || /^data:image\//i.test(url);
}

export function getProjectorBackgroundImage(style) {
  const preset = PROJECTOR_BACKGROUNDS[style.backgroundPreset] ? style.backgroundPreset : "Solid";
  if (preset === "CustomUrl") {
    return style.backgroundUrl
      ? `linear-gradient(rgba(0,0,0,${style.overlayOpacity / 100}), rgba(0,0,0,${style.overlayOpacity / 100})), url("${style.backgroundUrl}")`
      : "none";
  }
  const image = PROJECTOR_BACKGROUNDS[preset]?.image || "none";
  return image === "none"
    ? "none"
    : `linear-gradient(rgba(0,0,0,${style.overlayOpacity / 100}), rgba(0,0,0,${style.overlayOpacity / 100})), ${image}`;
}

export function normalizeProjectorStyle(style = {}, account = null) {
  const fallbackName = account?.name ? account.name + "'s Class" : "Our Class";
  const themeKey = PROJECTOR_THEMES[style.theme] ? style.theme : DEFAULT_PROJECTOR_STYLE.theme;
  const theme = PROJECTOR_THEMES[themeKey] || PROJECTOR_THEMES.Calm;
  const overlay = Math.max(0, Math.min(85, Number(style.overlayOpacity ?? DEFAULT_PROJECTOR_STYLE.overlayOpacity)));
  return {
    ...DEFAULT_PROJECTOR_STYLE,
    className: style.className || fallbackName,
    motto: style.motto || "",
    theme: themeKey,
    backgroundColor: normalizeColor(style.backgroundColor, theme.background),
    topColor: normalizeColor(style.topColor, theme.top),
    accentColor: normalizeColor(style.accentColor, theme.accent),
    textColor: normalizeColor(style.textColor, theme.text || "#FFFFFF"),
    backgroundPreset: PROJECTOR_BACKGROUNDS[style.backgroundPreset] ? style.backgroundPreset : DEFAULT_PROJECTOR_STYLE.backgroundPreset,
    backgroundUrl: normalizeBackgroundUrl(style.backgroundUrl),
    overlayOpacity: overlay,
    textSize: ["Normal", "Large", "Extra Large"].includes(style.textSize) ? style.textSize : DEFAULT_PROJECTOR_STYLE.textSize,
    showTimer: style.showTimer !== false,
    showStarter: style.showStarter !== false,
    homeAccent: normalizeColor(style.homeAccent, theme.homeAccent || theme.accent),
    homeSoft: normalizeColor(style.homeSoft, theme.homeSoft || "#EBF5F2"),
  };
}

export function readProjectorStyle(account = null) {
  try {
    return normalizeProjectorStyle(JSON.parse(localStorage.getItem("ofd:projectorStyle") || "{}"), account);
  } catch {
    return normalizeProjectorStyle({}, account);
  }
}

export function persistProjectorStyle(style) {
  try { localStorage.setItem("ofd:projectorStyle", JSON.stringify(style)); } catch {}
}
