import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Download, Home, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  price: number;
}

interface GuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentId: string;
}

interface Reservation {
  rooms: Room[];
  checkIn: string;
  checkOut: string;
  guests: number;
  guestData: GuestData;
  total: number;
  confirmationNumber: string;
}

const Confirmation = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [reservation, setReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    const currentReservation = localStorage.getItem("currentReservation");
    if (!currentReservation) {
      toast.error("No se encontró información de reserva");
      navigate("/rooms");
      return;
    }

    setReservation(JSON.parse(currentReservation));
  }, [navigate, user, authLoading]);

  const handleDownload = () => {
    toast.success("Descargando confirmación de reserva...");
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!reservation) {
    return null;
  }

  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-6">
              <CheckCircle2 className="w-10 h-10 text-accent" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              ¡Reserva confirmada!
            </h1>
            <p className="text-muted-foreground">
              Su reserva ha sido procesada exitosamente
            </p>
          </div>

          <Card className="shadow-elegant">
            <CardHeader className="text-center border-b">
              <CardTitle className="font-serif text-2xl">Detalles de la reserva</CardTitle>
              <CardDescription>
                Número de confirmación:{" "}
                <span className="font-mono font-bold text-accent text-lg">
                  {reservation.confirmationNumber}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-4 pb-6 border-b">
                  <div className="text-sm text-muted-foreground mb-2">Información del huésped</div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nombre:</span>{" "}
                      <span className="font-medium">{reservation.guestData.firstName} {reservation.guestData.lastName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="font-medium">{reservation.guestData.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>{" "}
                      <span className="font-medium">{reservation.guestData.phone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Documento:</span>{" "}
                      <span className="font-medium">{reservation.guestData.documentId}</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Habitaciones</div>
                      <div className="space-y-2">
                        {reservation.rooms.map((room, index) => (
                          <div key={index} className="bg-muted/50 rounded p-2">
                            <div className="font-semibold">{room.name}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {room.type} - {room.capacity} personas
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Huéspedes</div>
                      <div className="font-semibold">
                        {reservation.guests} {reservation.guests === 1 ? "persona" : "personas"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Check-in</div>
                      <div className="font-semibold">
                        {format(checkIn, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                      </div>
                      <div className="text-sm text-muted-foreground">A partir de las 15:00</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Check-out</div>
                      <div className="font-semibold">
                        {format(checkOut, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                      </div>
                      <div className="text-sm text-muted-foreground">Hasta las 12:00</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="bg-muted/50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-muted-foreground">
                        {nights} {nights === 1 ? "noche" : "noches"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${Math.round(reservation.total / nights)} por noche
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-lg">Total pagado</div>
                      <div className="text-3xl font-bold text-accent">
                        ${reservation.total}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-3">
                  <Button
                    variant="gold"
                    className="w-full"
                    size="lg"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar confirmación
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => navigate("/dashboard")}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Volver al inicio
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Hemos enviado un correo de confirmación a su dirección registrada.
              <br />
              Si tiene alguna pregunta, no dude en contactarnos.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Confirmation;
