/**
 * @fileoverview Componente de sidebar principal de la aplicación
 * @module AppSidebar
 * 
 * @description
 * Sidebar responsivo que muestra la navegación de la aplicación adaptada al rol del usuario.
 * Incluye información del perfil, menú de navegación y botón de cerrar sesión.
 * 
 * @design-decisions
 * - La navegación se adapta dinámicamente según el rol (cliente vs admin)
 * - El sidebar usa el estado collapsed de shadcn/ui para modo compacto
 * - Los items de navegación están definidos como constantes para fácil mantenimiento
 * - El avatar muestra iniciales como fallback si no hay imagen
 * - La función isActive maneja rutas exactas vs prefijos para resaltar correctamente
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Bed, Calendar, User, Users, LogOut, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

// ============================================
// TYPES - Definición de tipos
// ============================================

/**
 * Estructura del perfil de usuario para el sidebar
 * Solo incluye campos necesarios para la visualización
 */
interface Profile {
  name: string;
  email: string;
  avatar_url: string | null;
}

// ============================================
// CONSTANTS - Items de navegación por rol
// ============================================

/**
 * Items de navegación para usuarios con rol 'cliente'
 * Orden: Perfil, Dashboard, Habitaciones, Mis Reservas
 */
const clientItems = [
  { title: "Mi Perfil", url: "/profile", icon: User },
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Habitaciones", url: "/rooms", icon: Bed },
  { title: "Mis Reservas", url: "/my-reservations", icon: Calendar },
  
];

/**
 * Items de navegación para usuarios con rol 'admin'
 * Incluye gestión de habitaciones, reservas y usuarios
 */
const adminItems = [
  { title: "Mi Perfil", url: "/profile", icon: User },
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Habitaciones", url: "/admin/rooms", icon: Bed },
  { title: "Reservas", url: "/admin/reservations", icon: Calendar },
  { title: "Usuarios", url: "/admin/users", icon: Users },

];

// ============================================
// COMPONENT - Sidebar principal
// ============================================

/**
 * Componente de sidebar con navegación adaptativa por rol
 * 
 * @description
 * Renderiza un sidebar con:
 * - Header: Avatar y datos del usuario
 * - Content: Menú de navegación basado en rol
 * - Footer: Botón de cerrar sesión
 * 
 * @example
 * ```tsx
 * // Se usa dentro de SidebarProvider en DashboardLayout
 * <SidebarProvider>
 *   <AppSidebar />
 *   <main>{children}</main>
 * </SidebarProvider>
 * ```
 * 
 * @returns {JSX.Element} Sidebar con navegación y acciones de usuario
 */
export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  
  // Estado collapsed del sidebar desde el context
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  // Estado local para datos del perfil
  const [profile, setProfile] = useState<Profile | null>(null);

  // ============================================
  // EFFECTS - Carga de datos del perfil
  // ============================================
  
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  /**
   * Obtiene los datos del perfil del usuario desde Supabase
   * Solo carga los campos necesarios para el sidebar
   */
  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("name, email, avatar_url")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  // ============================================
  // HANDLERS - Funciones de interacción
  // ============================================

  /**
   * Cierra la sesión del usuario y redirige a login
   */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // ============================================
  // HELPER FUNCTIONS - Funciones auxiliares
  // ============================================

  /**
   * Selecciona items de navegación según el rol del usuario
   */
  const items = isAdmin ? adminItems : clientItems;
  const currentPath = location.pathname;

  /**
   * Determina si un item de navegación está activo
   * 
   * @description
   * Para dashboard ("/dashboard" o "/admin") usa comparación exacta
   * Para otras rutas usa startsWith para incluir sub-rutas
   * 
   * @param {string} path - Ruta a verificar
   * @returns {boolean} true si la ruta está activa
   */
  const isActive = (path: string) => {
    // Rutas dashboard requieren match exacto para evitar false positives
    if (path === "/dashboard" || path === "/admin") {
      return currentPath === path;
    }
    // Otras rutas usan prefijo para incluir sub-rutas
    return currentPath.startsWith(path);
  };

  /**
   * Genera iniciales a partir del nombre del usuario
   * Usado como fallback cuando no hay avatar
   * 
   * @param {string} name - Nombre completo del usuario
   * @returns {string} Máximo 2 caracteres en mayúsculas
   * 
   * @example
   * getInitials("Juan Pérez") // "JP"
   * getInitials("María") // "M"
   */
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ============================================
  // RENDER - Renderizado del componente
  // ============================================

  return (
    <Sidebar className="border-r border-border">
      {/* ============================================ */}
      {/* HEADER - Información del usuario */}
      {/* ============================================ */}
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Avatar con borde dorado (accent color) */}
          <Avatar className="h-10 w-10 border-2 border-accent">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
              {profile?.name ? getInitials(profile.name) : "U"}
            </AvatarFallback>
          </Avatar>
          
          {/* Nombre y email - ocultos cuando sidebar está collapsed */}
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-foreground truncate">
                {profile?.name || "Usuario"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {profile?.email || user?.email}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* ============================================ */}
      {/* CONTENT - Menú de navegación */}
      {/* ============================================ */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            {isAdmin ? "Administración" : "Navegación"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <a
                      href={item.url}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(item.url);
                      }}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ============================================ */}
      {/* FOOTER - Botón de cerrar sesión */}
      {/* ============================================ */}
      <SidebarFooter className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Cerrar sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
