export interface WorkItem {
  client: string;
  services: string[];
  description: string;
  website?: string;
}

export interface NavItem {
  label: string;
  href: string;
}