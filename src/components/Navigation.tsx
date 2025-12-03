import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Navigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, isAdmin } = useUserRole(user?.id);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sesión cerrada");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-elegant">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center transition-smooth group-hover:scale-110">
            <span className="text-accent-foreground font-serif font-bold text-lg">S</span>
          </div>
          <span className="font-serif text-2xl font-bold text-foreground">Spring Hotel</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isAdmin ? (
                <>
                  <Button variant="ghost" onClick={() => navigate("/admin")}>
                    Dashboard 
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/admin/rooms")}>
                    Habitaciones
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/admin/reservations")}>
                    Reservas
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/admin/users")}>
                    Usuarios
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                    Mi Dashboard
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/rooms")}>
                    Habitaciones
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/my-reservations")}>
                    Mis Reservas
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="transition-smooth"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="gold" onClick={() => navigate("/login")}>
              <User className="h-4 w-4" />
              Iniciar sesión
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
