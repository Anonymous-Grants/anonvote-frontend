/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // @noir-lang/noir_js's ACVM runs as a WASM module; async WebAssembly
    // needs to be enabled explicitly for both the browser and server (SSR)
    // bundles since this app imports it from client components.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
