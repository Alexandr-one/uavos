'use client';

import React, { ReactNode } from "react";
import GuestRoute from "@/components/guards/guest-route.guard";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <GuestRoute>{children}</GuestRoute>;
}
