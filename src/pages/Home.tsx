import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import hotelHero from "@/assets/hotel-hero.jpg";

const Home = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState("1");
  const [rooms, setRooms] = useState("1");

  const handleSearch = () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    
    if (!isLoggedIn) {
      toast.error("Debe iniciar sesión para realizar una reserva");
      navigate("/login");
      return;
    }

    navigate("/rooms");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img
          src={hotelHero}
          alt="Spring Hotel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-hero" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-4">
            SPRING
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl">
            Experimente el lujo y la elegancia en cada detalle
          </p>

          {/* Search Card */}
          <Card className="bg-background/95 backdrop-blur-sm shadow-elegant p-6 max-w-4xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de llegada - Fecha de salida
                </label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => navigate("/rooms")}
                >
                  Selecciona una fecha
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Habitaciones y huéspedes
                </label>
                <div className="flex gap-2">
                  <select
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="1">1 Habitación</option>
                    <option value="2">2 Habitaciones</option>
                    <option value="3">3 Habitaciones</option>
                  </select>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="1">1 Huésped</option>
                    <option value="2">2 Huéspedes</option>
                    <option value="3">3 Huéspedes</option>
                    <option value="4">4 Huéspedes</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="gold"
                  className="w-full h-10"
                  onClick={handleSearch}
                >
                  Buscar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl font-bold mb-4">Servicios exclusivos</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Disfrute de una experiencia incomparable con nuestros servicios de primer nivel
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Habitaciones de lujo",
              description: "Espacios elegantes diseñados para su comodidad y descanso",
            },
            {
              title: "Servicio premium",
              description: "Atención personalizada las 24 horas del día",
            },
            {
              title: "Experiencias únicas",
              description: "Actividades y servicios exclusivos para nuestros huéspedes",
            },
          ].map((feature, index) => (
            <Card key={index} className="p-6 shadow-elegant hover:shadow-gold transition-smooth">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <div className="w-6 h-6 bg-accent rounded-full" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
