/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './mdx-components.tsx'],
  theme: {
    extend: {
      screens: {
        xs: '500px',
      },
      typography: ({ theme }) => ({
        // "slate" has to match components/prose.tsx
        slate: {
          css: {
            a: {
              fontWeight: 'inherit',
            },
            code: {
              fontWeight: 'inherit',
            },
            '--tw-prose-pre-bg': theme('colors.slate.100'),
            '--tw-prose-pre-code': theme('colors.black'),
            '--tw-prose-invert-pre-bg': theme('colors.slate.900'),
            '--tw-prose-invert-pre-code': theme('colors.white'),
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
