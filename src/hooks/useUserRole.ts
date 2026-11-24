import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
export function useUserRole() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await getSupabaseBrowserClient().auth.getUser();
      if (!user) return;

      const { data } = await getSupabaseBrowserClient()
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (data) setUserRole(data.role);
    };
    fetchUserRole();
  }, []);

  return userRole;
}
