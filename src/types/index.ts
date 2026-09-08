export interface NavItem {
  title: string;
  href: string;
  isExternal?: boolean;
  badge?: string;
}

export interface FeatureModule {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: "Architecture" | "Performance" | "Ecosystem" | "Security";
  icon: string;
  metrics: { label: string; value: string };
  badge?: string;
}

export interface TelemetryMetric {
  id: string;
  name: string;
  value: string;
  numericValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  change: string;
  status: "optimal" | "nominal" | "warning";
  description: string;
}

export interface ArchitectureLayer {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  technologies: string[];
  status: "active" | "standby" | "scaling";
  latency: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  version: string;
  status: "Mainnet Beta" | "Active" | "Operational";
  navItems: NavItem[];
  socialLinks: {
    github: string;
    docs: string;
    discord: string;
    x: string;
  };
}

export * from "./database";
