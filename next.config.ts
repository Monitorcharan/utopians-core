import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  async redirects() {
    return [
      { source: "/students", destination: "/student/login", permanent: true },
      { source: "/teachers", destination: "/teacher/login", permanent: true },
      { source: "/student", destination: "/student/dashboard", permanent: true },
      { source: "/teacher", destination: "/teacher/dashboard", permanent: true },
      { source: "/teacher/edit-profile", destination: "/teacher/profile/settings", permanent: true },
      { source: "/teacher/:id([0-9a-fA-F-]{36})", destination: "/student/mentors/:id", permanent: true },
    ];
  },
};

export default nextConfig;
