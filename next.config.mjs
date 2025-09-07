import nextra from 'nextra'

const withNextra = nextra({
  // Здесь можно добавить конфигурацию Nextra при необходимости
})

/** @type {import('next').NextConfig} */
export default withNextra({
  reactStrictMode: true,
  output: 'export',            // статический экспорт
  images: { unoptimized: true },
  trailingSlash: true,         // важно для GitHub Pages
})
