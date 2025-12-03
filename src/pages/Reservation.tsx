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
import { CalendarIcon, Users, Mail, Phone, CreditCard, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  price: number;
}

const guestSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  documentId: z.string().min(5, "El documento debe tener al menos 5 caracteres"),
});

const Reservation = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof guestSchema>>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      documentId: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Debe iniciar sesión para realizar una reserva");
      navigate("/login");
      return;
    }

    const selectedRooms = localStorage.getItem("selectedRooms");
    if (!selectedRooms) {
      toast.error("No se ha seleccionado ninguna habitación");
      navigate("/rooms");
      return;
    }

    const parsedRooms = JSON.parse(selectedRooms);
    if (parsedRooms.length === 0) {
      toast.error("No se ha seleccionado ninguna habitación");
      navigate("/rooms");
      return;
    }

    setRooms(parsedRooms);
  }, [navigate, user, authLoading]);

  const calculateTotal = () => {
    if (!checkIn || !checkOut || rooms.length === 0) return 0;
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalRate = rooms.reduce((sum, room) => sum + room.price, 0);
    return nights * totalRate;
  };

  const getTotalCapacity = () => {
    return rooms.reduce((sum, room) => sum + room.capacity, 0);
  };

  const onSubmit = async (guestData: z.infer<typeof guestSchema>) => {
    if (!user) {
      toast.error("Debe iniciar sesión para realizar una reserva");
      navigate("/login");
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error("Por favor, seleccione las fechas de su estadía");
      return;
    }

    if (checkOut <= checkIn) {
      toast.error("La fecha de salida debe ser posterior a la fecha de entrada");
      return;
    }

    if (guests > getTotalCapacity()) {
      toast.error(`Las habitaciones seleccionadas tienen capacidad para ${getTotalCapacity()} personas máximo`);
      return;
    }

    setSubmitting(true);

    try {
      // Save reservation to database
      const { data, error } = await supabase
        .from("reservations")
        .insert({
          user_id: user.id,
          room_ids: rooms.map((r) => r.id),
          check_in: format(checkIn, "yyyy-MM-dd"),
          check_out: format(checkOut, "yyyy-MM-dd"),
          guests,
          total_price: calculateTotal(),
          guest_data: guestData,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating reservation:", error);
        toast.error("Error al crear la reserva. Por favor, intente de nuevo.");
        setSubmitting(false);
        return;
      }

      // Clear selected rooms from localStorage
      localStorage.removeItem("selectedRooms");

      // Store reservation info for confirmation page
      const reservation = {
        id: data.id,
        rooms,
        checkIn,
        checkOut,
        guests,
        guestData,
        total: calculateTotal(),
        confirmationNumber: data.id.slice(0, 8).toUpperCase(),
      };
      localStorage.setItem("currentReservation", JSON.stringify(reservation));

      toast.success("¡Reserva creada exitosamente!");
      navigate("/confirmation");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la reserva");
      setSubmitting(false);
    }
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

  if (!user || rooms.length === 0) {
    return null;
  }

  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
              Completar reserva
            </h1>
            <p className="text-muted-foreground">
              Ingrese los detalles de su estadía
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              {/* Guest Information */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Datos del huésped principal</CardTitle>
                  <CardDescription>Información de contacto y documento</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                              <Input placeholder="Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <Input type="email" placeholder="juan@ejemplo.com" {...field} className="flex-1" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <Input placeholder="+34 600 000 000" {...field} className="flex-1" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="documentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Documento de identidad</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <Input placeholder="12345678A" {...field} className="flex-1" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Form>
                </CardContent>
              </Card>

              {/* Dates and Guests */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Fechas y huéspedes</CardTitle>
                  <CardDescription>Seleccione las fechas de su estadía</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        max={getTotalCapacity()}
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Capacidad máxima total: {getTotalCapacity()} personas
                    </p>
                  </div>

                  <Button 
                    type="button" 
                    variant="gold" 
                    className="w-full" 
                    size="lg"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar reserva"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Resumen de reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Habitaciones seleccionadas</div>
                    <div className="space-y-2">
                      {rooms.map((room, index) => (
                        <div key={index} className="bg-muted/50 rounded-lg p-3">
                          <div className="font-semibold">{room.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center justify-between">
                            <span>{room.capacity} personas</span>
                            <span className="font-medium">${room.price}/noche</span>
                          </div>
                        </div>
                      ))}
                    </div>
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
                              {rooms.length} {rooms.length === 1 ? "habitación" : "habitaciones"} × {nights} {nights === 1 ? "noche" : "noches"}
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
    </DashboardLayout>
  );
};

export default Reservation;
