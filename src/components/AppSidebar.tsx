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

interface Profile {
  name: string;
  email: string;
  avatar_url: string | null;
}

const clientItems = [
  { title: "Mi Perfil", url: "/profile", icon: User },
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Habitaciones", url: "/rooms", icon: Bed },
  { title: "Mis Reservas", url: "/my-reservations", icon: Calendar },
  
];

const adminItems = [
  { title: "Mi Perfil", url: "/profile", icon: User },
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Habitaciones", url: "/admin/rooms", icon: Bed },
  { title: "Reservas", url: "/admin/reservations", icon: Calendar },
  { title: "Usuarios", url: "/admin/users", icon: Users },

];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const items = isAdmin ? adminItems : clientItems;
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/dashboard" || path === "/admin") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-accent">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
              {profile?.name ? getInitials(profile.name) : "U"}
            </AvatarFallback>
          </Avatar>
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
