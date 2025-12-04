/**
 * @fileoverview Página de completar reserva con datos del huésped
 * @module Reservation
 * 
 * @description
 * Permite a los usuarios completar su reserva ingresando datos del huésped,
 * seleccionando fechas y número de huéspedes. Guarda la reserva en Supabase
 * y redirige a la página de confirmación.
 * 
 * @design-decisions
 * - Validación con Zod: proporciona mensajes de error claros y type-safety
 * - React Hook Form: manejo eficiente de formularios con validación
 * - Cálculo dinámico de precio: actualiza en tiempo real según fechas y habitaciones
 * - localStorage para habitaciones: permite persistir selección entre páginas
 * - Validación de capacidad: previene reservas que excedan capacidad máxima
 * - Número de confirmación: primeros 8 caracteres del UUID para fácil referencia
 */

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

// ============================================
// TYPES - Definición de tipos
// ============================================

/**
 * Estructura de habitación para el resumen
 * Versión reducida con solo campos necesarios para cálculos
 */
interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  price: number;
}

// ============================================
// VALIDATION SCHEMA - Esquema de validación Zod
// ============================================

/**
 * Esquema de validación para datos del huésped principal
 * 
 * @description
 * Validaciones aplicadas:
 * - firstName/lastName: mínimo 2 caracteres
 * - email: formato válido de email
 * - phone: mínimo 10 dígitos
 * - documentId: mínimo 5 caracteres (DNI, pasaporte, etc.)
 */
const guestSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  documentId: z.string().min(5, "El documento debe tener al menos 5 caracteres"),
});

// ============================================
// COMPONENT - Página de reserva
// ============================================

/**
 * Página para completar datos de reserva
 * 
 * @description
 * Flujo del componente:
 * 1. Carga habitaciones seleccionadas de localStorage
 * 2. Usuario completa formulario de huésped
 * 3. Usuario selecciona fechas check-in/check-out
 * 4. Usuario indica número de huéspedes
 * 5. Sistema valida y guarda en Supabase
 * 6. Redirección a página de confirmación
 * 
 * @returns {JSX.Element} Formulario de reserva con resumen
 */
const Reservation = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // ============================================
  // STATE - Estados del componente
  // ============================================
  
  /** Habitaciones seleccionadas (cargadas de localStorage) */
  const [rooms, setRooms] = useState<Room[]>([]);
  
  /** Fecha de entrada */
  const [checkIn, setCheckIn] = useState<Date>();
  
  /** Fecha de salida */
  const [checkOut, setCheckOut] = useState<Date>();
  
  /** Número de huéspedes */
  const [guests, setGuests] = useState(1);
  
  /** Estado de envío del formulario */
  const [submitting, setSubmitting] = useState(false);

  // ============================================
  // FORM SETUP - Configuración de React Hook Form
  // ============================================

  /**
   * Hook de formulario con validación Zod
   * zodResolver integra el esquema de validación con react-hook-form
   */
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

  // ============================================
  // EFFECTS - Carga inicial y validaciones
  // ============================================

  /**
   * Verifica autenticación y carga habitaciones seleccionadas
   * Redirige si no hay usuario o no hay habitaciones seleccionadas
   */
  useEffect(() => {
    // Verificar autenticación
    if (!authLoading && !user) {
      toast.error("Debe iniciar sesión para realizar una reserva");
      navigate("/login");
      return;
    }

    // Cargar habitaciones de localStorage
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

  // ============================================
  // CALCULATIONS - Funciones de cálculo
  // ============================================

  /**
   * Calcula el precio total de la reserva
   * 
   * @description
   * Fórmula: (suma de precios por noche) × número de noches
   * 
   * @returns {number} Precio total en la moneda del sistema
   */
  const calculateTotal = () => {
    if (!checkIn || !checkOut || rooms.length === 0) return 0;
    
    // Calcular número de noches
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    // Sumar tarifa diaria de todas las habitaciones
    const totalRate = rooms.reduce((sum, room) => sum + room.price, 0);
    
    return nights * totalRate;
  };

  /**
   * Calcula la capacidad total de las habitaciones seleccionadas
   * 
   * @returns {number} Número máximo de huéspedes permitidos
   */
  const getTotalCapacity = () => {
    return rooms.reduce((sum, room) => sum + room.capacity, 0);
  };

  // ============================================
  // HANDLERS - Manejador de envío
  // ============================================

  /**
   * Procesa el envío del formulario de reserva
   * 
   * @description
   * Pasos:
   * 1. Validar usuario autenticado
   * 2. Validar fechas seleccionadas
   * 3. Validar capacidad vs huéspedes
   * 4. Insertar reserva en Supabase
   * 5. Limpiar localStorage
   * 6. Guardar datos para confirmación
   * 7. Redirigir a /confirmation
   * 
   * @param {z.infer<typeof guestSchema>} guestData - Datos validados del huésped
   */
  const onSubmit = async (guestData: z.infer<typeof guestSchema>) => {
    // Validar usuario
    if (!user) {
      toast.error("Debe iniciar sesión para realizar una reserva");
      navigate("/login");
      return;
    }

    // Validar fechas
    if (!checkIn || !checkOut) {
      toast.error("Por favor, seleccione las fechas de su estadía");
      return;
    }

    if (checkOut <= checkIn) {
      toast.error("La fecha de salida debe ser posterior a la fecha de entrada");
      return;
    }

    // Validar capacidad
    if (guests > getTotalCapacity()) {
      toast.error(`Las habitaciones seleccionadas tienen capacidad para ${getTotalCapacity()} personas máximo`);
      return;
    }

    setSubmitting(true);

    try {
      // ============================================
      // DATABASE INSERT - Guardar reserva en Supabase
      // ============================================
      const { data, error } = await supabase
        .from("reservations")
        .insert({
          user_id: user.id,                           // ID del usuario autenticado
          room_ids: rooms.map((r) => r.id),          // Array de IDs de habitaciones
          check_in: format(checkIn, "yyyy-MM-dd"),   // Fecha formato ISO
          check_out: format(checkOut, "yyyy-MM-dd"), // Fecha formato ISO
          guests,                                     // Número de huéspedes
          total_price: calculateTotal(),             // Precio calculado
          guest_data: guestData,                     // Datos del huésped (JSONB)
          status: "pending",                         // Estado inicial
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating reservation:", error);
        toast.error("Error al crear la reserva. Por favor, intente de nuevo.");
        setSubmitting(false);
        return;
      }

      // ============================================
      // CLEANUP - Limpiar selección de localStorage
      // ============================================
      localStorage.removeItem("selectedRooms");

      // ============================================
      // CONFIRMATION DATA - Preparar datos para página de confirmación
      // ============================================
      /**
       * Número de confirmación: primeros 8 caracteres del UUID
       * Más fácil de comunicar que un UUID completo
       */
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

  // ============================================
  // LOADING STATE - Estado de carga
  // ============================================

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  // Retornar null si no hay datos necesarios (redirección en useEffect)
  if (!user || rooms.length === 0) {
    return null;
  }

  // Calcular noches para mostrar en resumen
  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // ============================================
  // RENDER - Renderizado del componente
  // ============================================

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* ============================================ */}
          {/* HEADER - Título y descripción */}
          {/* ============================================ */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
              Completar reserva
            </h1>
            <p className="text-muted-foreground">
              Ingrese los detalles de su estadía
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* ============================================ */}
            {/* FORM SECTION - Formularios de datos */}
            {/* ============================================ */}
            <div className="space-y-6">
              {/* Formulario de datos del huésped */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Datos del huésped principal</CardTitle>
                  <CardDescription>Información de contacto y documento</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <div className="space-y-4">
                      {/* Campo: Nombre */}
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
                      
                      {/* Campo: Apellido */}
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
                      
                      {/* Campo: Email */}
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
                      
                      {/* Campo: Teléfono */}
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
                      
                      {/* Campo: Documento de identidad */}
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

              {/* Formulario de fechas y huéspedes */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Fechas y huéspedes</CardTitle>
                  <CardDescription>Seleccione las fechas de su estadía</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selector: Fecha de entrada */}
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
                          disabled={(date) => date < new Date()} // No permitir fechas pasadas
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Selector: Fecha de salida */}
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
                          disabled={(date) => date <= (checkIn || new Date())} // Debe ser posterior a check-in
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Input: Número de huéspedes */}
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

                  {/* Botón de confirmación */}
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

            {/* ============================================ */}
            {/* SUMMARY SECTION - Resumen de la reserva */}
            {/* ============================================ */}
            <div className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Resumen de reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lista de habitaciones seleccionadas */}
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

                  {/* Detalles de fechas y total (solo si hay fechas seleccionadas) */}
                  {checkIn && checkOut && (
                    <>
                      {/* Fechas seleccionadas */}
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

                      {/* Número de huéspedes */}
                      <div className="border-t pt-4">
                        <div className="text-sm text-muted-foreground mb-1">Huéspedes</div>
                        <div className="font-semibold">{guests} {guests === 1 ? "persona" : "personas"}</div>
                      </div>

                      {/* Total de la reserva */}
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
