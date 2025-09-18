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
  
  basePath: '/uavos',
  assetPrefix: '/uavos/',
  
  // Важные фиксы для GitHub Pages
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  
  // Отключаем оптимизации которые могут ломать сборку
  swcMinify: false,
  compress: false,
  optimizeFonts: false,

  webpack: (config, { isServer }) => {
    config.optimization.minimize = false
    config.optimization.moduleIds = 'named'
    config.optimization.chunkIds = 'named'

    config.module.rules.push({
      test: /pagefind\/.*\.(js|wasm|json)$/,
      type: 'asset/resource',
      generator: {
        filename: 'pagefind/[name][ext]'
      }
    })

    // Фикс для динамических импортов
    config.output.chunkLoadingGlobal = 'webpackJsonpNextraApp'

    return config
  },

  // Отключаем экспериментальные фичи
  experimental: {
    optimizeCss: false,
    scrollRestoration: false
  },

  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

export default withNextra(nextConfig)