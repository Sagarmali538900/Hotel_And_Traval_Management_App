/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow your local network IP in development mode
  allowedDevOrigins: ['172.16.10.167', '172.16.10.167:3000', 'localhost:3000']
};

export default nextConfig;
