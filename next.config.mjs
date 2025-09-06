import nextra from 'nextra'

const withNextra = nextra({
})

/** @type {import('next').NextConfig} */
export default withNextra({
  reactStrictMode: true,
  output: 'export',            // статический экспорт
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: '/uavos',          // имя репозитория
  assetPrefix: '/uavos/',      // обязательно со слэшем в конце
})
