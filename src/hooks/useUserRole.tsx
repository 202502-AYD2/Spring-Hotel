/**
 * @fileoverview Hook personalizado para obtener el rol del usuario
 * @module useUserRole
 * 
 * @description
 * Obtiene el rol del usuario desde la tabla user_roles en Supabase.
 * Los roles se almacenan en una tabla separada por razones de seguridad,
 * evitando ataques de escalación de privilegios.
 * 
 * @design-decisions
 * - Los roles se almacenan en tabla separada (user_roles), NO en profiles
 *   Razón: Evitar que usuarios modifiquen su propio rol vía RLS policies
 * - Se usa el enum app_role ('cliente' | 'admin') definido en la base de datos
 * - En caso de error, se asigna rol 'cliente' por defecto (fail-safe)
 * - El hook es reactivo al userId para actualizar rol cuando cambia el usuario
 * 
 * @security
 * IMPORTANTE: Los roles NUNCA deben verificarse desde localStorage o sessionStorage
 * ya que pueden ser manipulados por usuarios malintencionados. Siempre usar
 * verificación server-side a través de RLS policies.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES - Definición de tipos
// ============================================

/**
 * Roles disponibles en el sistema
 * - 'cliente': Usuario regular que puede hacer reservas
 * - 'admin': Administrador con acceso completo al sistema
 */
export type UserRole = 'cliente' | 'admin';

/**
 * Tipo de retorno del hook useUserRole
 * @typedef {Object} UseUserRoleReturn
 * @property {UserRole | null} role - Rol del usuario o null si no determinado
 * @property {boolean} loading - Estado de carga mientras se obtiene el rol
 * @property {boolean} isAdmin - Helper booleano para verificar si es admin
 */

// ============================================
// HOOK - Implementación principal
// ============================================

/**
 * Hook para obtener el rol del usuario autenticado
 * 
 * @description
 * Consulta la tabla user_roles para obtener el rol asignado al usuario.
 * La tabla user_roles está protegida por RLS policies que solo permiten
 * lectura del propio rol y modificación solo por administradores.
 * 
 * @example
 * ```tsx
 * const { user } = useAuth();
 * const { role, isAdmin, loading } = useUserRole(user?.id);
 * 
 * if (loading) return <Spinner />;
 * if (isAdmin) return <AdminDashboard />;
 * return <ClientDashboard />;
 * ```
 * 
 * @param {string | undefined} userId - ID del usuario autenticado
 * @returns {{ role: UserRole | null, loading: boolean, isAdmin: boolean }}
 */
export function useUserRole(userId: string | undefined) {
  // Estado del rol del usuario
  const [role, setRole] = useState<UserRole | null>(null);
  
  // Estado de carga
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si no hay userId, resetear estado y salir
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    /**
     * Función asíncrona para obtener el rol desde la base de datos
     * Consulta la tabla user_roles que tiene RLS habilitado
     */
    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single(); // Esperamos un único registro por usuario

        if (error) throw error;
        
        // Castear a UserRole (validado por el enum en BD)
        setRole(data.role as UserRole);
      } catch (error) {
        console.error('Error fetching user role:', error);
        
        /**
         * Fail-safe: Asignar rol 'cliente' por defecto en caso de error
         * Esto evita bloquear al usuario pero no le da privilegios de admin
         */
        setRole('cliente');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId]); // Re-ejecutar cuando cambie el userId

  return { 
    role, 
    loading, 
    /**
     * Helper booleano para verificar rol de administrador
     * Útil para condicionales simples en componentes
     */
    isAdmin: role === 'admin' 
  };
}
