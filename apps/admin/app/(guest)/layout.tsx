'use client';

import React, { ReactNode } from "react";
import GuestRoute from "@/components/auth/GuestRoute";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <GuestRoute>{children}</GuestRoute>;
}
