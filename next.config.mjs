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
  
  // ✅ Настройки для префикса
  basePath: process.env.NODE_ENV === 'production' ? '/uavos_website' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/uavos_website' : '',
  
  // ✅ ОТКЛЮЧАЕМ МИНИФИКАЦИЮ И ОПТИМИЗАЦИЮ
  swcMinify: false,
  compress: false,
  
  // ✅ Отключаем все оптимизации
  webpack: (config, { isServer }) => {
    // Отключаем минификацию JS
    config.optimization.minimize = false
    
    // Сохраняем оригинальные имена файлов
    config.optimization.moduleIds = 'named'
    config.optimization.chunkIds = 'named'
    
    // Отключаем хеширование в именах файлов
    if (!isServer) {
      config.output.filename = 'static/js/[name].js'
      config.output.chunkFilename = 'static/js/[name].js'
      
      // Для CSS
      const cssRule = config.module.rules.find(rule => 
        rule.test && rule.test.toString().includes('css')
      )
      if (cssRule) {
        cssRule.use = cssRule.use.map(loader => {
          if (loader.loader && loader.loader.includes('css-loader')) {
            return {
              ...loader,
              options: {
                ...loader.options,
                modules: {
                  ...loader.options.modules,
                  exportLocalsConvention: 'asIs',
                  localIdentName: '[name]__[local]'
                }
              }
            }
          }
          return loader
        })
      }
    }
    
    return config
  },
  
  // ✅ Отключаем оптимизацию CSS
  experimental: {
    optimizeCss: false
  },
  
  // ✅ Сохраняем оригинальные имена файлов
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

export default withNextra(nextConfig)