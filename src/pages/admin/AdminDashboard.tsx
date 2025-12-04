import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Calendar, Users, TrendingUp, Loader2 } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalReservations: 0,
    totalUsers: 0,
    pendingReservations: 0,
  });

  const [correos, setCorreos] = useState([
    "juan.jgomez@udea.edu.co",
    "andresc.areiza@udea.edu.co",
    "karen.cardonag@udea.edu.co",
    "sebas.fj@hotmail.com",
  ]);

  useEffect(() => {
    if (authLoading || roleLoading) return;

    const timer = setTimeout(() => {
      if (!user) {
        navigate("/login", { replace: true });
      } else if (!isAdmin) {
        navigate("/dashboard", { replace: true });
      }
    }, 500); // <- 150ms es suficiente para que el rol cargue

    return () => clearTimeout(timer);
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
    }
  }, [user, isAdmin]);

  const fetchStats = async () => {
    const [roomsRes, reservationsRes, usersRes, pendingRes] = await Promise.all(
      [
        supabase.from("rooms").select("id", { count: "exact", head: true }),
        supabase
          .from("reservations")
          .select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("reservations")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]
    );

    setStats({
      totalRooms: roomsRes.count || 0,
      totalReservations: reservationsRes.count || 0,
      totalUsers: usersRes.count || 0,
      pendingReservations: pendingRes.count || 0,
    });
  };

  if (authLoading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestiona todo el sistema hotelero
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Habitaciones
              </CardTitle>
              <Hotel className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRooms}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de habitaciones
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reservas</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalReservations}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de reservas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Usuarios registrados
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pendingReservations}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Reservas pendientes
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="shadow-elegant hover:shadow-gold transition-smooth cursor-pointer"
            onClick={() => navigate("/admin/rooms")}
          >
            <CardHeader>
              <CardTitle>Gestionar Habitaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Administrar habitaciones del hotel
              </p>
              <Button variant="gold" className="w-full">
                Ir a Habitaciones
              </Button>
            </CardContent>
          </Card>

          <Card
            className="shadow-elegant hover:shadow-gold transition-smooth cursor-pointer"
            onClick={() => navigate("/admin/reservations")}
          >
            <CardHeader>
              <CardTitle>Gestionar Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Ver, confirmar y gestionar todas las reservas
              </p>
              <Button variant="gold" className="w-full">
                Ir a Reservas
              </Button>
            </CardContent>
          </Card>

          <Card
            className="shadow-elegant hover:shadow-gold transition-smooth cursor-pointer"
            onClick={() => navigate("/admin/users")}
          >
            <CardHeader>
              <CardTitle>Gestionar Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Administrar usuarios y roles del sistema
              </p>
              <Button variant="gold" className="w-full">
                Ir a Usuarios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
