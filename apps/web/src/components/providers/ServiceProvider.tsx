"use client";

import { createContext, useContext } from "react";

import { mockServices } from "@/lib/services/mock";
import { httpServices } from "@/lib/services/http";
import type { Services } from "@/lib/services/types";

/**
 * The single switch point between Phase 1 (mock) and Phase 2 (real API)
 * data. Controlled by NEXT_PUBLIC_API_URL: set it (e.g. in .env.local) to
 * point at a running backend and the whole app switches to live data with
 * no component changes. Unset it to fall back to mock data for frontend-only
 * demos.
 */
const activeServices: Services = process.env.NEXT_PUBLIC_API_URL ? httpServices : mockServices;

const ServiceContext = createContext<Services>(activeServices);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  return <ServiceContext.Provider value={activeServices}>{children}</ServiceContext.Provider>;
}

export function useServices(): Services {
  return useContext(ServiceContext);
}
