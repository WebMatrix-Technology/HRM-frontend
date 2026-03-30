'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';

export default function PerformancePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect to the performance reviews page for all users to see history
    router.replace('/performance/reviews');
  }, [router]);

  return null;
}
