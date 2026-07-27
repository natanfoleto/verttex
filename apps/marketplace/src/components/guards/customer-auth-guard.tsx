"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { ProfileSkeleton } from "../profile/profile-skeleton";
import { useCustomer } from "../../providers/customer-auth-provider";

export function CustomerAuthGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { customer, isLoading } = useCustomer();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !customer) {
      router.push("/?auth=login");
    }
  }, [mounted, isLoading, customer, router]);

  if (!mounted || isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <ProfileSkeleton />;
  }

  if (!customer) {
    return null;
  }

  return <>{children}</>;
}
