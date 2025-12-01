import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Bed, Check, ShoppingCart, Trash2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  price: number;
  status: string;
  features: string[];
}

const Rooms = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Debe iniciar sesión para ver las habitaciones");
      navigate("/login");
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRooms();
      loadSelectedRooms();
    }
  }, [user]);

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

  const loadSelectedRooms = () => {
    const saved = localStorage.getItem("selectedRooms");
    if (saved) {
      setSelectedRooms(JSON.parse(saved));
    }
  };

  const filteredRooms = selectedType === "all" 
    ? rooms 
    : rooms.filter(room => room.type === selectedType);

  const handleAddRoom = (room: Room) => {
    if (room.status !== 'available') {
      toast.error("Esta habitación no está disponible");
      return;
    }

    const newSelectedRooms = [...selectedRooms, room];
    setSelectedRooms(newSelectedRooms);
    localStorage.setItem("selectedRooms", JSON.stringify(newSelectedRooms));
    toast.success(`${room.name} agregada a su reserva`);
  };

  const handleRemoveRoom = (roomId: number) => {
    const newSelectedRooms = selectedRooms.filter((r, idx) => idx !== roomId);
    setSelectedRooms(newSelectedRooms);
    localStorage.setItem("selectedRooms", JSON.stringify(newSelectedRooms));
    toast.success("Habitación eliminada de su reserva");
  };

  const handleGoToReservation = () => {
    if (selectedRooms.length === 0) {
      toast.error("Debe seleccionar al menos una habitación");
      return;
    }
    navigate("/reservation");
  };

  if (authLoading || loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Nuestras habitaciones
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Seleccione la habitación perfecta para su estadía
            </p>
          </div>

          {/* Selected Rooms Summary */}
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

          {/* Filters */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
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

          {/* Rooms Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    <Badge variant={room.status === 'available' ? "default" : "secondary"}>
                      {room.status === 'available' ? "Disponible" : "No disponible"}
                    </Badge>
                  </div>
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
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-3xl font-bold text-accent mb-1">
                        ${room.price}
                      </div>
                      <div className="text-sm text-muted-foreground">por noche</div>
                    </div>

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
      </div>
    </div>
  );
};

export default Rooms;
