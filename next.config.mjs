import nextra from 'nextra'

const withNextra = nextra({
  search: { codeblocks: false }
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { 
    unoptimized: true 
  },
  trailingSlash: true,
  
  // ✅ Ключевые настройки для префикса /uavos_website
  basePath: '/uavos',
  assetPrefix: '/uavos/',
  
  // Убираем devIndicators или исправляем
  // devIndicators: {
  //   position: 'bottom-right',
  // },
}

export default withNextra(nextConfig)