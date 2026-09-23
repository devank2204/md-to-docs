/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": { "primary-fixed": "#e3e2e3", "on-tertiary-fixed": "#3e0501", "surface-container-low": "#f4f3f0", "surface-container-high": "#e9e8e5", "on-tertiary-container": "#c46b59", "surface-dim": "#dbdad7", "surface": "#faf9f6", "on-error": "#ffffff", "secondary-container": "#d7e4f3", "secondary-fixed": "#d7e4f3", "outline": "#75777a", "on-surface": "#1b1c1a", "primary-container": "#1b1c1d", "tertiary-fixed-dim": "#ffb4a5", "on-surface-variant": "#44474a", "surface-variant": "#e3e2df", "surface-container-highest": "#e3e2df", "on-secondary-fixed": "#111d27", "on-secondary-fixed-variant": "#3c4854", "on-primary": "#ffffff", "primary-fixed-dim": "#c7c6c7", "surface-container": "#efeeeb", "on-primary-fixed-variant": "#464748", "on-error-container": "#93000a", "on-secondary": "#ffffff", "inverse-primary": "#c7c6c7", "tertiary-container": "#3e0501", "background": "#faf9f6", "error": "#ba1a1a", "secondary-fixed-dim": "#bbc8d6", "tertiary-fixed": "#ffdad3", "surface-tint": "#5e5e5f", "surface-bright": "#faf9f6", "error-container": "#ffdad6", "on-primary-fixed": "#1b1c1d", "tertiary": "#000000", "inverse-surface": "#2f312f", "on-tertiary": "#ffffff", "primary": "#000000", "surface-container-lowest": "#ffffff", "inverse-on-surface": "#f2f1ee", "on-tertiary-fixed-variant": "#783022", "outline-variant": "#c5c6c9", "on-primary-container": "#848485", "on-background": "#1b1c1a", "secondary": "#53606c", "on-secondary-container": "#596672" },
      "borderRadius": { "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem" },
      "spacing": { "margin-desktop": "2rem", "space-xxs": "0.125rem", "space-xs": "0.25rem", "space-lg": "1rem", "space-sm": "0.5rem", "margin-tablet": "1.5rem", "space-xl": "1.5rem", "space-md": "0.75rem", "gutter": "1rem", "margin": "1rem", "space-xxl": "2rem", "gutter-desktop": "1.5rem" },
      "fontFamily": {
        "label-sm": [ "JetBrains Mono" ], "code-lg": [ "JetBrains Mono" ], "display-lg": [ "Newsreader" ], "display-lg-mobile": [ "Newsreader" ], "headline-lg": [ "Newsreader" ], "headline-xl": [ "Newsreader" ], "body-sm": [ "Newsreader" ], "label-md": [ "JetBrains Mono" ], "headline-xl-mobile": [ "Newsreader" ], "body-lg": [ "Newsreader" ], "code-md": [ "JetBrains Mono" ], "headline-md": [ "Newsreader" ], "headline-sm": [ "Newsreader" ], "body-md": [ "Newsreader" ], "code-sm": [ "JetBrains Mono" ]
      },
      "fontSize": {
        "label-sm": [ "10px", { "lineHeight": "14px", "letterSpacing": "0.04em", "fontWeight": "500" } ],
        "code-lg": [ "14px", { "lineHeight": "22px", "letterSpacing": "-0.01em", "fontWeight": "400" } ],
        "display-lg": [ "44px", { "lineHeight": "52px", "letterSpacing": "-0.02em", "fontWeight": "400" } ],
        "display-lg-mobile": [ "32px", { "lineHeight": "40px", "letterSpacing": "-0.015em", "fontWeight": "400" } ],
        "headline-lg": [ "24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "500" } ],
        "headline-xl": [ "32px", { "lineHeight": "40px", "letterSpacing": "-0.015em", "fontWeight": "400" } ],
        "body-sm": [ "13px", { "lineHeight": "20px", "fontWeight": "400" } ],
        "label-md": [ "12px", { "lineHeight": "16px", "letterSpacing": "0.02em", "fontWeight": "500" } ],
        "headline-xl-mobile": [ "26px", { "lineHeight": "34px", "letterSpacing": "-0.01em", "fontWeight": "400" } ],
        "body-lg": [ "18px", { "lineHeight": "28px", "fontWeight": "400" } ],
        "code-md": [ "12px", { "lineHeight": "18px", "fontWeight": "400" } ],
        "headline-md": [ "20px", { "lineHeight": "28px", "fontWeight": "500" } ],
        "headline-sm": [ "17px", { "lineHeight": "24px", "fontWeight": "600" } ],
        "body-md": [ "15px", { "lineHeight": "24px", "fontWeight": "400" } ],
        "code-sm": [ "11px", { "lineHeight": "16px", "fontWeight": "400" } ]
      }
    }
  },
  plugins: [],
};
