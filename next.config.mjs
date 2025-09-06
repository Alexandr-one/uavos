import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.js',
  search: { codeblocks: false }
})

/** @type {import('next').NextConfig} */
export default withNextra({
  reactStrictMode: true,
  devIndicators: { buildActivity: false }, // исправлено под Next 14
  output: 'export',       // статический экспорт
  trailingSlash: true,
  images: { unoptimized: true },
  distDir: 'out'          // папка сборки для gh-pages
})
