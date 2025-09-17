"use client";

import GuestRoute from "@/components/auth/GuestRoute";


export default function ProtectedLayout({ children }) {
  return <GuestRoute>{children}</GuestRoute>;
}