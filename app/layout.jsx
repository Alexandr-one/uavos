import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import { SearchWithCallback } from './search-with-callback'

const navbar = (
  <Navbar

    logo={<>
      <img src="/images/logo.svg" width="32" height="32" viewBox="0 0 32 32" />
      <span style={{ marginLeft: '.4em', fontWeight: 800 }}>
        UAVOS
      </span>
    </>}>
  </Navbar>
)

const footer = <Footer>UAVOS Email: uavos@uavos.com</Footer>

export default async function RootLayout({ children, params, searchParams, route }) {
  const pageMap = await getPageMap()

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <link rel="icon" href="/logo.svg" />
      <body>
        <Layout
          sidebar={{ autoCollapse: true }}
          docsRepositoryBase="https://github.com/shuding/nextra/tree/main/docs"
          navbar={navbar}
          pageMap={pageMap}
          footer={footer}
          feedback={{ content: null }}
          editLink={null}
          search={<SearchWithCallback />}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
