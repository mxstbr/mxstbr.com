/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './mdx-components.tsx'],
  theme: {
    extend: {
      screens: {
        xs: '500px',
      },
      colors: {
        'slate-350': '#B0BCCD',
        /* Blend 66% yellow-100, 33% slate-100 */
        'yellow-slate-100': '#FAF8D5',
      },
      typography: ({ theme }) => ({
        // "slate" has to match components/prose.tsx
        slate: {
          css: {
            a: {
              fontWeight: 'inherit',
              color: 'inherit',
            },
            code: {
              fontWeight: 'inherit',
            },
            blockquote: {
              fontWeight: 'inherit',
            },
            '--tw-prose-pre-bg': theme('colors.slate.100'),
            '--tw-prose-pre-code': theme('colors.black'),
            '--tw-prose-invert-pre-bg': theme('colors.slate.900'),
            '--tw-prose-invert-pre-code': theme('colors.white'),
            '--tw-prose-quotes': 'var(--tw-prose-body)',
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
