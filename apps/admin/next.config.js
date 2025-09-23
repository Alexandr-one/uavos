const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });


/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.symlinks = false;
    config.resolve.alias = {
      ...config.resolve.alias,
      '@uavos/shared-types': require('path').resolve(__dirname, '../../node_modules/@uavos/shared-types'),
    };
    
    return config;
  },
  transpilePackages: ['@uavos/shared-types'],
};

module.exports = nextConfig;