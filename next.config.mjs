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
  basePath: process.env.NODE_ENV === 'production' ? '/uavos' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/uavos' : '',
  swcMinify: false,
  compress: false,

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

    return config
  },

  experimental: {
    optimizeCss: false
  },

  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

export default withNextra(nextConfig)