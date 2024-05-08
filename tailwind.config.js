/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './mdx-components.tsx'],
  theme: {
    extend: {
      typography: ({ theme }) => ({
        gray: {
          css: {
            '--tw-prose-pre-bg': theme('colors.neutral.50'),
            '--tw-prose-pre-code': theme('colors.black'),
            '--tw-prose-invert-pre-bg': theme('colors.neutral.900'),
            '--tw-prose-invert-pre-code': theme('colors.white'),
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
