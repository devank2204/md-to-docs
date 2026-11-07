/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {"primary-fixed": "rgb(var(--app-primary-fixed) / <alpha-value>)", "on-tertiary-fixed": "rgb(var(--app-on-tertiary-fixed) / <alpha-value>)", "surface-container-low": "rgb(var(--app-surface-container-low) / <alpha-value>)", "surface-container-high": "rgb(var(--app-surface-container-high) / <alpha-value>)", "on-tertiary-container": "rgb(var(--app-on-tertiary-container) / <alpha-value>)", "surface-dim": "rgb(var(--app-surface-dim) / <alpha-value>)", "surface": "rgb(var(--app-surface) / <alpha-value>)", "on-error": "rgb(var(--app-on-error) / <alpha-value>)", "secondary-container": "rgb(var(--app-secondary-container) / <alpha-value>)", "secondary-fixed": "rgb(var(--app-secondary-fixed) / <alpha-value>)", "outline": "rgb(var(--app-outline) / <alpha-value>)", "on-surface": "rgb(var(--app-on-surface) / <alpha-value>)", "primary-container": "rgb(var(--app-primary-container) / <alpha-value>)", "tertiary-fixed-dim": "rgb(var(--app-tertiary-fixed-dim) / <alpha-value>)", "on-surface-variant": "rgb(var(--app-on-surface-variant) / <alpha-value>)", "surface-variant": "rgb(var(--app-surface-variant) / <alpha-value>)", "surface-container-highest": "rgb(var(--app-surface-container-highest) / <alpha-value>)", "on-secondary-fixed": "rgb(var(--app-on-secondary-fixed) / <alpha-value>)", "on-secondary-fixed-variant": "rgb(var(--app-on-secondary-fixed-variant) / <alpha-value>)", "on-primary": "rgb(var(--app-on-primary) / <alpha-value>)", "primary-fixed-dim": "rgb(var(--app-primary-fixed-dim) / <alpha-value>)", "surface-container": "rgb(var(--app-surface-container) / <alpha-value>)", "on-primary-fixed-variant": "rgb(var(--app-on-primary-fixed-variant) / <alpha-value>)", "on-error-container": "rgb(var(--app-on-error-container) / <alpha-value>)", "on-secondary": "rgb(var(--app-on-secondary) / <alpha-value>)", "inverse-primary": "rgb(var(--app-inverse-primary) / <alpha-value>)", "tertiary-container": "rgb(var(--app-tertiary-container) / <alpha-value>)", "background": "rgb(var(--app-background) / <alpha-value>)", "error": "rgb(var(--app-error) / <alpha-value>)", "secondary-fixed-dim": "rgb(var(--app-secondary-fixed-dim) / <alpha-value>)", "tertiary-fixed": "rgb(var(--app-tertiary-fixed) / <alpha-value>)", "surface-tint": "rgb(var(--app-surface-tint) / <alpha-value>)", "surface-bright": "rgb(var(--app-surface-bright) / <alpha-value>)", "error-container": "rgb(var(--app-error-container) / <alpha-value>)", "on-primary-fixed": "rgb(var(--app-on-primary-fixed) / <alpha-value>)", "tertiary": "rgb(var(--app-tertiary) / <alpha-value>)", "inverse-surface": "rgb(var(--app-inverse-surface) / <alpha-value>)", "on-tertiary": "rgb(var(--app-on-tertiary) / <alpha-value>)", "primary": "rgb(var(--app-primary) / <alpha-value>)", "surface-container-lowest": "rgb(var(--app-surface-container-lowest) / <alpha-value>)", "inverse-on-surface": "rgb(var(--app-inverse-on-surface) / <alpha-value>)", "on-tertiary-fixed-variant": "rgb(var(--app-on-tertiary-fixed-variant) / <alpha-value>)", "outline-variant": "rgb(var(--app-outline-variant) / <alpha-value>)", "on-primary-container": "rgb(var(--app-on-primary-container) / <alpha-value>)", "on-background": "rgb(var(--app-on-background) / <alpha-value>)", "secondary": "rgb(var(--app-secondary) / <alpha-value>)", "on-secondary-container": "rgb(var(--app-on-secondary-container) / <alpha-value>)", "success": "rgb(var(--app-success) / <alpha-value>)"},
      "borderRadius": { "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem" },
      "spacing": { "margin-desktop": "2rem", "space-xxs": "0.125rem", "space-xs": "0.25rem", "space-lg": "1rem", "space-sm": "0.5rem", "margin-tablet": "1.5rem", "space-xl": "1.5rem", "space-md": "0.75rem", "gutter": "1rem", "margin": "1rem", "space-xxl": "2rem", "gutter-desktop": "1.5rem" },
      "fontFamily": {
        "label-sm": [ "JetBrains Mono" ], "code-lg": [ "JetBrains Mono" ], "display-lg": [ ["Söhne", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"] ], "display-lg-mobile": [ ["Söhne", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"] ], "headline-lg": [ ["Söhne", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"] ], "headline-xl": [ ["Söhne", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"] ], "body-sm": [ ["Söhne", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"] ], "label-md": [ "JetBrains Mono" ], "headline-xl-mobile": [ ["Söhne", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"] ], "body-lg": [ ["Söhne", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"] ], "code-md": [ "JetBrains Mono" ], "headline-md": [ ["Söhne", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"] ], "headline-sm": [ ["Söhne", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"] ], "body-md": [ ["Söhne", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif"] ], "code-sm": [ "JetBrains Mono" ], "serif": [ "Newsreader", "serif" ]
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
      },
      "keyframes": {
        "background-pan": {
          "0%": { "backgroundPosition": "0% 50%" },
          "100%": { "backgroundPosition": "-200% 50%" }
        }
      },
      "animation": {
        "background-pan": "background-pan 2.5s linear infinite"
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': '#1b1c1a',
            '--tw-prose-headings': '#000000',
            '--tw-prose-links': '#000000',
            '--tw-prose-bold': '#000000',
            '--tw-prose-code': '#1b1c1a',
            '--tw-prose-pre-code': '#1b1c1a',
            '--tw-prose-pre-bg': '#f4f3f0',
            '--tw-prose-quotes': '#44474a',
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            code: {
              backgroundColor: '#f4f3f0',
              padding: '0.2rem 0.4rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
              fontFamily: '"JetBrains Mono", monospace',
            },
            pre: {
              backgroundColor: '#f4f3f0',
              color: '#1b1c1a',
              fontFamily: '"JetBrains Mono", monospace',
              border: '1px solid #e3e2df',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
            },
            table: {
              fontSize: '13px',
              fontFamily: '"JetBrains Mono", monospace',
            },
            'thead th': {
              backgroundColor: '#f4f3f0',
              padding: '0.5rem',
              borderBottom: '2px solid #e3e2df',
            },
            'tbody td': {
              padding: '0.5rem',
              borderBottom: '1px solid #e3e2df',
            },
            blockquote: {
              borderLeftWidth: '4px',
              borderLeftColor: '#c5c6c9',
              backgroundColor: '#f4f3f0',
              padding: '1rem',
              fontStyle: 'normal',
              color: '#1b1c1a',
              fontWeight: '400',
              quotes: 'none'
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:last-of-type::after': { content: 'none' }
          }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
