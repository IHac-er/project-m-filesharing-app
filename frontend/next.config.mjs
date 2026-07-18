/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Intercept all Socket.io traffic
        source: '/socket.io/:path*',
        // Forward it to your local Node backend!
        destination: 'http://localhost:5000/socket.io/:path*' 
      }
    ]
  }
};

export default nextConfig;