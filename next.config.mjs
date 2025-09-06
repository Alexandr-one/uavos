import nextra from 'nextra'

const withNextra = nextra({
  search: { codeblocks: false }
})

/** @type {import('next').NextConfig} */
export default withNextra({
  reactStrictMode: true,
  devIndicators: false,
  output: 'export',        // статический экспорт
  images: { unoptimized: true },
  trailingSlash: true,

  // 🚀 добавь эти строки
  basePath: '/uavos',
  assetPrefix: '/uavos/',
})