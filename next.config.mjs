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
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
      }
    }

    config.plugins.push({
      apply: (compiler) => {
        compiler.hooks.afterEmit.tapAsync('CopyPagefindPlugin', (compilation, callback) => {
          try {
            const pagefindPath = path.dirname(require.resolve('pagefind-web'))
            const sourceDir = path.join(pagefindPath, 'pagefind')
            const targetDir = path.join(compiler.options.output.path, 'pagefind')

            const { execSync } = require('child_process')
            execSync(`mkdir -p ${targetDir} && cp -r ${sourceDir}/* ${targetDir}/`)
            console.log('Pagefind files copied successfully!')
          } catch (error) {
            console.warn('Could not copy Pagefind files:', error.message)
          }
          callback()
        })
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