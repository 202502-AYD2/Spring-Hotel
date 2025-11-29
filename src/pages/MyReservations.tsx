import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Reservation {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  guest_data: any;
  created_at: string;
  room_ids: string[];
}

const MyReservations = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error: any) {
      console.error("Error fetching reservations:", error);
      toast.error("Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string, checkIn: string) => {
    const checkInDate = new Date(checkIn);
    const today = new Date();

    if (checkInDate <= today) {
      toast.error("No se puede cancelar una reserva que ya ha iniciado");
      return;
    }

    if (!confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

      if (error) throw error;
      toast.success("Reserva cancelada exitosamente");
      fetchReservations();
    } catch (error: any) {
      console.error("Error cancelling reservation:", error);
      toast.error("Error al cancelar la reserva");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: "Pendiente", variant: "secondary" },
      confirmed: { label: "Confirmada", variant: "default" },
      completed: { label: "Completada", variant: "outline" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-2">Mis Reservas</h1>
            <p className="text-muted-foreground">Gestiona tus reservas de hotel</p>
          </div>

          {reservations.length === 0 ? (
            <Card className="shadow-elegant">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No tienes reservas aún</p>
                <Button variant="gold" onClick={() => navigate("/rooms")}>
                  Hacer una reserva
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <Card key={reservation.id} className="shadow-elegant">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          Reserva #{reservation.id.slice(0, 8)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Creada el {format(new Date(reservation.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Check-in</p>
                        <p className="font-medium">{format(new Date(reservation.check_in), "dd 'de' MMMM, yyyy", { locale: es })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Check-out</p>
                        <p className="font-medium">{format(new Date(reservation.check_out), "dd 'de' MMMM, yyyy", { locale: es })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Huéspedes</p>
                        <p className="font-medium">{reservation.guests} persona(s)</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-medium text-accent">${reservation.total_price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Datos del huésped</p>
                      <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                        <p className="text-sm"><span className="font-medium">Nombre:</span> {reservation.guest_data.firstName} {reservation.guest_data.lastName}</p>
                        <p className="text-sm"><span className="font-medium">Email:</span> {reservation.guest_data.email}</p>
                        <p className="text-sm"><span className="font-medium">Teléfono:</span> {reservation.guest_data.phone}</p>
                        <p className="text-sm"><span className="font-medium">Documento:</span> {reservation.guest_data.documentId}</p>
                      </div>
                    </div>

                    {reservation.status === "pending" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelReservation(reservation.id, reservation.check_in)}
                      >
                        Cancelar reserva
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReservations;
