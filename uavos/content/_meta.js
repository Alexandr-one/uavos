export default {
    index: {
        title: 'Home',
        type: 'page',
        theme: {
            toc: false // Hide toc on this page
        }
    },
    products: {
        title: 'Products',
        type: 'page'
    },
    services: {
        title: 'Services',
        type: 'page',
    },
    media: {
        title: 'Media',
        type: 'menu',
        items: {
            coverage: {
                title: 'Media Coverage',
                href: '/media/coverage'
            },
            releases: {
                title: 'Press Releases',
                href: '/media/releases'
            },
            ceo: {
                title: 'CEO Tech Commentary',
                href: '/media/ceo'
            }
        }
    },
    clientArea: {
        title: 'Client Area',
        type: 'page',
        href: 'mailto:hi@example.com',

    },
    contactus: {
        title: 'Contact us',
        type: 'page'
    },
    about: {
        title: 'About Us',
        type: 'menu',
        items: {
            "1-coverage": {
                title: 'Managed Services',
                href: '/about/services'
            },
            "2-releases": {
                title: 'Quality Policy',
                href: '/about/policy'
            },
        }
    }
}