/**
 * @fileoverview Página de visualización y selección de habitaciones
 * @module Rooms
 * 
 * @description
 * Permite a los usuarios autenticados explorar las habitaciones disponibles,
 * filtrarlas por tipo y agregarlas a su reserva. Las habitaciones seleccionadas
 * se persisten en localStorage para mantener el estado durante la navegación.
 * 
 * @design-decisions
 * - localStorage para persistir selección: evita pérdida de datos si el usuario
 *   navega a otras páginas antes de completar la reserva
 * - Filtro por tipo de habitación: mejora UX para hoteles con muchas habitaciones
 * - Múltiples habitaciones por reserva: permite reservas grupales o familias grandes
 * - Estado de disponibilidad visual: opacidad reducida para habitaciones no disponibles
 * - Verificación de autenticación: requiere login antes de ver habitaciones (requisito de negocio)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Bed, Check, ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ============================================
// TYPES - Definición de tipos
// ============================================

/**
 * Estructura de una habitación
 * @interface Room
 */
interface Room {
  id: string;
  name: string;
  type: string;       // 'suite' | 'doble' | 'sencilla'
  capacity: number;   // Número máximo de huéspedes
  price: number;      // Precio por noche
  status: string;     // 'available' | 'occupied' | 'maintenance'
  features: string[]; // Lista de características (WiFi, TV, etc.)
}

// ============================================
// COMPONENT - Página de habitaciones
// ============================================

/**
 * Página de exploración y selección de habitaciones
 * 
 * @description
 * Funcionalidades principales:
 * - Carga habitaciones desde Supabase ordenadas por precio
 * - Filtra por tipo de habitación (todas, suite, doble, sencilla)
 * - Permite agregar/quitar habitaciones de la selección
 * - Persiste selección en localStorage
 * - Navega a /reservation cuando el usuario confirma
 * 
 * @returns {JSX.Element} Página con grid de habitaciones y resumen de selección
 */
const Rooms = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // ============================================
  // STATE - Estados del componente
  // ============================================
  
  /** Filtro activo por tipo de habitación */
  const [selectedType, setSelectedType] = useState<string>("all");
  
  /** Habitaciones seleccionadas para la reserva */
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  
  /** Todas las habitaciones cargadas desde BD */
  const [rooms, setRooms] = useState<Room[]>([]);
  
  /** Estado de carga inicial */
  const [loading, setLoading] = useState(true);

  // ============================================
  // EFFECTS - Efectos de carga y autenticación
  // ============================================

  /**
   * Verifica autenticación y redirige si no hay usuario
   * Requisito de negocio: usuario debe estar logueado para ver habitaciones
   */
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Debe iniciar sesión para ver las habitaciones");
      navigate("/login");
      return;
    }
  }, [user, authLoading, navigate]);

  /**
   * Carga habitaciones y selección previa cuando hay usuario
   */
  useEffect(() => {
    if (user) {
      fetchRooms();
      loadSelectedRooms();
    }
  }, [user]);

  // ============================================
  // DATA FETCHING - Carga de datos
  // ============================================

  /**
   * Obtiene todas las habitaciones desde Supabase
   * Ordenadas por precio ascendente para mostrar opciones económicas primero
   */
  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      toast.error("Error al cargar habitaciones");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recupera habitaciones previamente seleccionadas de localStorage
   * Permite mantener la selección si el usuario navega fuera y vuelve
   */
  const loadSelectedRooms = () => {
    const saved = localStorage.getItem("selectedRooms");
    if (saved) {
      setSelectedRooms(JSON.parse(saved));
    }
  };

  // ============================================
  // COMPUTED VALUES - Valores calculados
  // ============================================

  /**
   * Habitaciones filtradas según el tipo seleccionado
   * Si selectedType es "all", muestra todas las habitaciones
   */
  const filteredRooms = selectedType === "all" 
    ? rooms 
    : rooms.filter(room => room.type === selectedType);

  // ============================================
  // HANDLERS - Manejadores de eventos
  // ============================================

  /**
   * Agrega una habitación a la selección
   * Solo permite agregar habitaciones disponibles
   * 
   * @param {Room} room - Habitación a agregar
   */
  const handleAddRoom = (room: Room) => {
    if (room.status !== 'available') {
      toast.error("Esta habitación no está disponible");
      return;
    }

    const newSelectedRooms = [...selectedRooms, room];
    setSelectedRooms(newSelectedRooms);
    // Persistir en localStorage para mantener selección entre navegaciones
    localStorage.setItem("selectedRooms", JSON.stringify(newSelectedRooms));
    toast.success(`${room.name} agregada a su reserva`);
  };

  /**
   * Elimina una habitación de la selección por índice
   * Usa índice en lugar de id porque puede haber duplicados
   * 
   * @param {number} roomId - Índice de la habitación en el array
   */
  const handleRemoveRoom = (roomId: number) => {
    const newSelectedRooms = selectedRooms.filter((r, idx) => idx !== roomId);
    setSelectedRooms(newSelectedRooms);
    localStorage.setItem("selectedRooms", JSON.stringify(newSelectedRooms));
    toast.success("Habitación eliminada de su reserva");
  };

  /**
   * Navega a la página de reserva
   * Valida que haya al menos una habitación seleccionada
   */
  const handleGoToReservation = () => {
    if (selectedRooms.length === 0) {
      toast.error("Debe seleccionar al menos una habitación");
      return;
    }
    navigate("/admin/admincrearreserva");
  };

  // ============================================
  // LOADING STATE - Estado de carga
  // ============================================

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  // ============================================
  // RENDER - Renderizado del componente
  // ============================================

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* ============================================ */}
        {/* HEADER - Título y descripción */}
        {/* ============================================ */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
            Nuestras habitaciones
          </h1>
          <p className="text-muted-foreground">
            Seleccione la habitación perfecta para su estadía
          </p>
        </div>

        {/* ============================================ */}
        {/* SELECTED ROOMS SUMMARY - Resumen de selección */}
        {/* Solo visible cuando hay habitaciones seleccionadas */}
        {/* ============================================ */}
        {selectedRooms.length > 0 && (
          <div className="mb-8 bg-accent/10 border border-accent/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Habitaciones seleccionadas ({selectedRooms.length})
              </h2>
              <Button variant="gold" onClick={handleGoToReservation}>
                Continuar con reserva
              </Button>
            </div>
            {/* Grid de habitaciones seleccionadas */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedRooms.map((room, index) => (
                <div key={index} className="bg-background rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{room.name}</div>
                    <div className="text-sm text-muted-foreground">${room.price}/noche</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveRoom(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* FILTERS - Botones de filtro por tipo */}
        {/* ============================================ */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            variant={selectedType === "all" ? "gold" : "outline"}
            onClick={() => setSelectedType("all")}
          >
            Todas
          </Button>
          <Button
            variant={selectedType === "suite" ? "gold" : "outline"}
            onClick={() => setSelectedType("suite")}
          >
            Suites
          </Button>
          <Button
            variant={selectedType === "doble" ? "gold" : "outline"}
            onClick={() => setSelectedType("doble")}
          >
            Dobles
          </Button>
          <Button
            variant={selectedType === "sencilla" ? "gold" : "outline"}
            onClick={() => setSelectedType("sencilla")}
          >
            Sencillas
          </Button>
        </div>

        {/* ============================================ */}
        {/* ROOMS GRID - Grid de tarjetas de habitaciones */}
        {/* ============================================ */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card
              key={room.id}
              className={`shadow-elegant hover:shadow-gold transition-smooth ${
                room.status !== 'available' ? "opacity-70" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="font-serif text-2xl">{room.name}</CardTitle>
                  {/* Badge de disponibilidad */}
                  <Badge variant={room.status === 'available' ? "default" : "secondary"}>
                    {room.status === 'available' ? "Disponible" : "No disponible"}
                  </Badge>
                </div>
                {/* Información de capacidad y tipo */}
                <CardDescription className="flex items-center gap-4 text-base">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {room.capacity} personas
                  </span>
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    {room.type}
                  </span>
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Precio destacado */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-accent mb-1">
                      ${room.price}
                    </div>
                    <div className="text-sm text-muted-foreground">por noche</div>
                  </div>

                  {/* Lista de características */}
                  {room.features && room.features.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Características:</div>
                      <ul className="space-y-1">
                        {room.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-3 w-3 text-accent" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Botón de agregar/no disponible */}
                  <Button
                    variant={room.status === 'available' ? "gold" : "outline"}
                    className="w-full"
                    onClick={() => handleAddRoom(room)}
                    disabled={room.status !== 'available'}
                  >
                    {room.status === 'available' ? "Agregar a reserva" : "No disponible"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Rooms;
