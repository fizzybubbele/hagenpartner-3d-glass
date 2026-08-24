/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],
  webpack: (config) => {
    // Google Drive (CloudStorage) sync corrupts Next's persistent webpack cache
    // (ENOENT rename on .pack.gz). Keep the cache in memory instead of on disk.
    config.cache = false
    return config
  },
}

module.exports = nextConfig
