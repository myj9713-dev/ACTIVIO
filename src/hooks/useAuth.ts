'use client';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../lib/supabase/client';
import { getCurrentUser, AuthUser } from '../lib/auth';
import { useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (data.session) {
          getCurrentUser().then((u) => {
            setUser(u);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = getSupabaseBrowserClient().auth.onAuthStateChange(() => {
      getCurrentUser().then(setUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        getCurrentUser().then(setUser);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const logout = async () => {
    queryClient.clear();
    await getSupabaseBrowserClient().auth.signOut();
    setUser(null);
    window.location.href = '/community';
  };

  return { user, loading, logout };
}
