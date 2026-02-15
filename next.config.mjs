const isGithubActions = process.env.GITHUB_ACTIONS === "true"
const repo = "astreae-grid"

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGithubActions ? `/${repo}` : "",
  assetPrefix: isGithubActions ? `/${repo}/` : "",
}

export default nextConfig
