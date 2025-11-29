import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import hotelHero from "@/assets/hotel-hero.jpg";

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);

  useEffect(() => {
    if (!authLoading && !roleLoading && user && role) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
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

          <Button variant="gold" size="lg" onClick={() => navigate("/login")}>
            Comenzar
          </Button>
        </div>
      </div>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-serif font-bold text-center mb-12">
            Bienvenido a Spring Hotel
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent text-2xl">★</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Lujo incomparable</h3>
              <p className="text-muted-foreground">Habitaciones diseñadas para su máximo confort</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent text-2xl">★</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Servicio excepcional</h3>
              <p className="text-muted-foreground">Atención personalizada las 24 horas</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent text-2xl">★</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ubicación privilegiada</h3>
              <p className="text-muted-foreground">En el corazón de la ciudad</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
