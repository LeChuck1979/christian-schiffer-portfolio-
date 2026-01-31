import { WorkItem } from './types';

export const PORTFOLIO_OWNER = "Alex Mustermann";
export const EMAIL = "hello@alexmustermann.com";

export const WORK_HISTORY: WorkItem[] = [
  {
    client: "Berlin Architecture Co.",
    services: ["Brand Strategy", "Copywriting", "Art Direction"],
    description: "Redefined the tone of voice for one of Berlin's leading sustainable architecture firms. Created a comprehensive brand book and website copy that emphasizes their commitment to green urban living.",
    website: "berlin-arch.example.com"
  },
  {
    client: "Lumina Tech",
    services: ["UX Writing", "Product Messaging"],
    description: "Simplified complex technical jargon for a B2B SaaS platform. Developed in-app messaging, onboarding flows, and marketing collateral to increase user retention by 25%.",
    website: "lumina.example.com"
  },
  {
    client: "Muse Gallery",
    services: ["Social Media Strategy", "Content Creation"],
    description: "Curated a digital presence for a contemporary art space. Managed a 6-month campaign for their summer exhibition resulting in record attendance.",
  },
  {
    client: "Velvet Coffee",
    services: ["Packaging Copy", "Brand Story"],
    description: "Crafted the origin stories for single-origin roasts. The goal was to transport the drinker to the farm through evocative storytelling on sustainable packaging.",
  }
];