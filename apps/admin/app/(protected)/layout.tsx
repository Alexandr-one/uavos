"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/guards/protected-route.guard";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
