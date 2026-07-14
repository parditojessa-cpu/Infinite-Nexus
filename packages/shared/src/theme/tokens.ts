export interface PalettePair {
  id: string;
  label: string;
  primary: string;
  accent: string;
}

export const PALETTES: PalettePair[] = [
  { id: "navy-teal", label: "Navy / Teal", primary: "#0f4c81", accent: "#2ba39c" },
  { id: "plum-gold", label: "Plum / Gold", primary: "#5b3a6d", accent: "#c98a1e" },
  { id: "forest-amber", label: "Forest / Amber", primary: "#1f5c4a", accent: "#d98e3c" },
  { id: "slate-coral", label: "Slate / Coral", primary: "#33475b", accent: "#e0654f" },
];

export const DEFAULT_PALETTE_ID = "navy-teal";

export const COLORS = {
  background: "#f5f3ee",
  surface: "#ffffff",
  textPrimary: "#1a2430",
  textSecondary: "rgba(26,36,48,0.6)",
  textMuted: "rgba(26,36,48,0.5)",
  border: "rgba(26,36,48,0.08)",
  borderStrong: "rgba(26,36,48,0.15)",
  success: "#2f6f4f",
  warning: "#c98a1e",
  danger: "#c1443b",
  info: "#8b5cf6",
  infoAlt: "#0ea5a4",
} as const;

export const RISK_TIER_COLORS: Record<string, string> = {
  excellent: "#2f6f4f",
  satisfactory: "#5a8f3f",
  needs_monitoring: "#c98a1e",
  at_risk: "#c1443b",
  critical: "#8b1538",
};

export const INTERVENTION_STATUS_META: Record<string, { label: string; emoji: string; color: string }> = {
  no_intervention_required: { label: "No Intervention Required", emoji: "🟢", color: "#2f6f4f" },
  under_monitoring: { label: "Under Monitoring", emoji: "🟡", color: "#c98a1e" },
  under_intervention: { label: "Under Intervention", emoji: "🟠", color: "#d9772e" },
  intensive_intervention: { label: "Intensive Intervention", emoji: "🔴", color: "#c1443b" },
  completed: { label: "Completed", emoji: "🔵", color: "#0ea5a4" },
};

export const RADIUS = {
  card: 12,
  control: 9,
  pill: 20,
} as const;

export const SPACING = {
  cardPaddingMin: 18,
  cardPaddingMax: 24,
  gridGapMin: 14,
  gridGapMax: 22,
} as const;

export const TYPOGRAPHY = {
  headingFont: "'Manrope', sans-serif",
  bodyFont: "'Public Sans', sans-serif",
  baseSize: 14,
  statValueSize: 22,
  pageTitleSize: 19,
} as const;

export const SIDEBAR = {
  expandedWidth: 240,
  collapsedWidth: 72,
  transition: "width 0.18s ease",
} as const;
