import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

interface Reservation {
  id: string;
  user_id: string;
  room_ids: string[];
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  guest_data: any;
  created_at: string;
  profiles: { name: string; email: string };
}

const AdminReservations = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

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
      fetchReservations();
    }
  }, [user, isAdmin]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const enrichedReservations = await Promise.all(
        (data || []).map(async (reservation) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", reservation.user_id)
            .single();

          return {
            ...reservation,
            profiles: profile || { name: "Usuario", email: "" },
          };
        })
      );

      setReservations(enrichedReservations);
    } catch (error: any) {
      console.error("Error fetching reservations:", error);
      toast.error("Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (
    reservationId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: newStatus })
        .eq("id", reservationId);

      if (error) throw error;
      toast.success(
        `Reserva ${
          newStatus === "confirmed"
            ? "confirmada"
            : newStatus === "cancelled"
            ? "cancelada"
            : "completada"
        }`
      );
      fetchReservations();
    } catch (error: any) {
      console.error("Error updating reservation:", error);
      toast.error("Error al actualizar reserva");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: any; icon: any }
    > = {
      pending: { label: "Pendiente", variant: "secondary", icon: Clock },
      confirmed: { label: "Confirmada", variant: "default", icon: CheckCircle },
      completed: { label: "Completada", variant: "outline", icon: CheckCircle },
      cancelled: { label: "Cancelada", variant: "destructive", icon: XCircle },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      variant: "secondary",
      icon: Clock,
    };
    const Icon = statusInfo.icon;

    return (
      <Badge
        variant={statusInfo.variant}
        className="flex items-center gap-1 w-fit"
      >
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const filteredReservations =
    filterStatus === "all"
      ? reservations
      : reservations.filter((r) => r.status === filterStatus);

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-serif font-bold mb-2">
                  Gestión de Reservas
                </h1>
                <p className="text-muted-foreground">
                  Administra todas las reservas del hotel
                </p>
              </div>
              <div>
              <Button variant="gold" onClick={() => navigate("/admin/roomscrearadmin")}>
              Hacer una nueva reserva
            </Button>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Reservas ({filteredReservations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Huéspedes</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-mono text-sm">
                          {reservation.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {reservation.profiles?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {reservation.profiles?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(reservation.check_in), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(reservation.check_out),
                            "dd/MM/yyyy"
                          )}
                        </TableCell>
                        <TableCell>{reservation.guests}</TableCell>
                        <TableCell className="font-medium">
                          ${reservation.total_price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(reservation.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {reservation.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    updateReservationStatus(
                                      reservation.id,
                                      "confirmed"
                                    )
                                  }
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    updateReservationStatus(
                                      reservation.id,
                                      "cancelled"
                                    )
                                  }
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
                            {reservation.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateReservationStatus(
                                    reservation.id,
                                    "completed"
                                  )
                                }
                              >
                                Completar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReservations;
