// Simple hand-drawn line icons per category (no external image files needed).
// Each is a self-contained 24x24 SVG path set, colored via currentColor.

const CATEGORY_ICONS = {
  "Electronics": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="12" rx="1.5"/>
    <path d="M8 20h8"/>
    <path d="M12 16v4"/>
    <path d="M7 8h4"/><path d="M7 11h6"/>
  </svg>`,

  "Apparel": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 4l4 2 4-2 4 4-3 3v9H7v-9L4 8z"/>
  </svg>`,

  "Home & Living": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 11l8-6 8 6"/>
    <path d="M6 10v9h12v-9"/>
    <path d="M10 19v-5h4v5"/>
  </svg>`,

  "Beauty": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 3h6l1 4H8z"/>
    <path d="M8 7h8l1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/>
    <path d="M9 12h6"/>
  </svg>`,

  "Sports": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="8"/>
    <path d="M4 12h16"/>
    <path d="M12 4a11 11 0 0 1 0 16"/>
    <path d="M12 4a11 11 0 0 0 0 16"/>
  </svg>`
};

// Fallback icon for any category not in the map above
const DEFAULT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="4" width="16" height="16" rx="2"/>
</svg>`;
