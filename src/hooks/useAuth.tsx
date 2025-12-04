/**
 * @fileoverview Hook personalizado para gestión del estado de autenticación
 * @module useAuth
 * 
 * @description
 * Proporciona acceso reactivo al estado de autenticación del usuario mediante
 * el cliente de Supabase. Gestiona tanto la sesión actual como los cambios
 * en tiempo real del estado de autenticación.
 * 
 * @design-decisions
 * - Se usa onAuthStateChange para detectar cambios en tiempo real (login, logout, refresh)
 * - getSession() se llama inicialmente para obtener la sesión existente (ej: página recargada)
 * - El cleanup del subscription previene memory leaks al desmontar el componente
 * - El estado loading permite mostrar indicadores de carga mientras se verifica la sesión
 */

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES - Definición de tipos de retorno
// ============================================

/**
 * Tipo de retorno del hook useAuth
 * @typedef {Object} UseAuthReturn
 * @property {User | null} user - Objeto de usuario de Supabase o null si no autenticado
 * @property {Session | null} session - Sesión actual o null
 * @property {boolean} loading - Estado de carga mientras se verifica la autenticación
 */

// ============================================
// HOOK - Implementación principal
// ============================================

/**
 * Hook para gestionar el estado de autenticación
 * 
 * @description
 * Este hook se encarga de:
 * 1. Escuchar cambios en el estado de autenticación (login, logout, token refresh)
 * 2. Verificar si existe una sesión activa al montar el componente
 * 3. Proporcionar el estado de carga para UX apropiado
 * 
 * @example
 * ```tsx
 * const { user, session, loading } = useAuth();
 * 
 * if (loading) return <Spinner />;
 * if (!user) return <Navigate to="/login" />;
 * return <Dashboard user={user} />;
 * ```
 * 
 * @returns {{ user: User | null, session: Session | null, loading: boolean }}
 */
export function useAuth() {
  // Estado del usuario autenticado
  const [user, setUser] = useState<User | null>(null);
  
  // Estado de la sesión completa (incluye tokens, expiration, etc.)
  const [session, setSession] = useState<Session | null>(null);
  
  // Estado de carga - true hasta que se verifique la autenticación inicial
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Listener para cambios en el estado de autenticación
     * Se ejecuta automáticamente cuando:
     * - El usuario inicia sesión
     * - El usuario cierra sesión
     * - El token se refresca
     * - La sesión expira
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Actualizar estado con la nueva sesión
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    /**
     * Verificación inicial de sesión existente
     * Necesario para recuperar la sesión si el usuario ya estaba autenticado
     * (ej: al recargar la página o volver a abrir la app)
     */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    /**
     * Cleanup: cancelar suscripción al desmontar
     * Previene memory leaks y llamadas a setState en componentes desmontados
     */
    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}
