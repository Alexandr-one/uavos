import nextra from 'nextra'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: { buildActivity: false }, // объект, а не boolean
  output: 'export',       // статический экспорт
  trailingSlash: true,
  images: { unoptimized: true },
  distDir: 'out'
}
 
// Nextra wrapper
export default nextra({
  search: { codeblocks: false }
})(nextConfig)
