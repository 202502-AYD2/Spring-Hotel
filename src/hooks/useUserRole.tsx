import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'cliente' | 'admin';

export function useUserRole(userId: string | undefined) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        setRole(data.role as UserRole);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('cliente'); // Default to cliente on error
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId]);

  return { role, loading, isAdmin: role === 'admin' };
}
