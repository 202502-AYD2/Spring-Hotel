import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
  rate: number;
}

const Reservation = () => {
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
    
    if (!loggedIn) {
      toast.error("Debe iniciar sesión para realizar una reserva");
      navigate("/login");
      return;
    }

    const selectedRoom = localStorage.getItem("selectedRoom");
    if (!selectedRoom) {
      toast.error("No se ha seleccionado ninguna habitación");
      navigate("/rooms");
      return;
    }

    setRoom(JSON.parse(selectedRoom));
  }, [navigate]);

  const calculateTotal = () => {
    if (!checkIn || !checkOut || !room) return 0;
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights * room.rate;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkIn || !checkOut) {
      toast.error("Por favor, seleccione las fechas de su estadía");
      return;
    }

    if (checkOut <= checkIn) {
      toast.error("La fecha de salida debe ser posterior a la fecha de entrada");
      return;
    }

    if (guests > (room?.capacity || 1)) {
      toast.error(`Esta habitación tiene capacidad para ${room?.capacity} personas máximo`);
      return;
    }

    const reservation = {
      room,
      checkIn,
      checkOut,
      guests,
      total: calculateTotal(),
      confirmationNumber: Math.random().toString(36).substring(2, 10).toUpperCase(),
    };

    localStorage.setItem("currentReservation", JSON.stringify(reservation));
    navigate("/confirmation");
  };

  if (!isLoggedIn || !room) {
    return null;
  }

  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Completar reserva
            </h1>
            <p className="text-muted-foreground text-lg">
              Ingrese los detalles de su estadía
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Form */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Detalles de reserva</CardTitle>
                <CardDescription>Complete la información requerida</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Fecha de entrada</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkIn && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkIn ? format(checkIn, "PPP", { locale: es }) : "Seleccione una fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={setCheckIn}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de salida</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkOut && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOut ? format(checkOut, "PPP", { locale: es }) : "Seleccione una fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          disabled={(date) => date <= (checkIn || new Date())}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guests">Número de huéspedes</Label>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="guests"
                        type="number"
                        min="1"
                        max={room.capacity}
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Capacidad máxima: {room.capacity} personas
                    </p>
                  </div>

                  <Button type="submit" variant="gold" className="w-full" size="lg">
                    Confirmar reserva
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Habitación</div>
                    <div className="font-semibold">{room.name}</div>
                  </div>

                  {checkIn && checkOut && (
                    <>
                      <div className="border-t pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Fechas</div>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Entrada:</span>{" "}
                            {format(checkIn, "PPP", { locale: es })}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Salida:</span>{" "}
                            {format(checkOut, "PPP", { locale: es })}
                          </div>
                          <div className="text-sm font-semibold text-accent">
                            {nights} {nights === 1 ? "noche" : "noches"}
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Huéspedes</div>
                        <div className="font-semibold">{guests} {guests === 1 ? "persona" : "personas"}</div>
                      </div>

                      <div className="border-t pt-4 bg-muted/50 -mx-6 px-6 py-4 rounded-b-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">Total</div>
                            <div className="text-xs text-muted-foreground">
                              ${room.rate} × {nights} {nights === 1 ? "noche" : "noches"}
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-accent">
                            ${calculateTotal()}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reservation;
