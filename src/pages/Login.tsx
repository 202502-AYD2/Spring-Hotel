/**
 * @fileoverview Página de autenticación (login y registro)
 * @module Login
 * 
 * @description
 * Componente dual que maneja tanto el inicio de sesión como el registro
 * de nuevos usuarios. Utiliza Supabase Auth para la autenticación.
 * 
 * @design-decisions
 * - Un solo componente para login/registro evita duplicación de código
 * - Validación básica en cliente antes de enviar a Supabase
 * - Email auto-confirm habilitado en Supabase para desarrollo rápido
 * - Redirección a /dashboard después de login exitoso
 * - El nombre se guarda en metadata durante signup y se usa para crear perfil
 * - useEffect para redirección automática está comentado (puede habilitarse)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

// ============================================
// COMPONENT - Página de Login/Registro
// ============================================

/**
 * Página de autenticación con formulario dual (login/registro)
 * 
 * @description
 * El componente maneja dos flujos:
 * 1. Login: Autentica usuario existente con email/password
 * 2. Signup: Registra nuevo usuario con nombre, email y password
 * 
 * El estado `isLogin` controla qué formulario se muestra.
 * 
 * @returns {JSX.Element} Página de autenticación con formulario
 */
const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  
  // ============================================
  // STATE - Estados del formulario
  // ============================================
  
  /** Controla si se muestra login (true) o registro (false) */
  const [isLogin, setIsLogin] = useState(true);
  
  /** Campos del formulario */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  /** Estado de carga durante submit */
  const [loading, setLoading] = useState(false);

  // ============================================
  // EFFECTS - Redirección automática (opcional)
  // ============================================
  
  /**
   * Redirección automática basada en rol
   * Comentado por defecto - puede habilitarse si se desea
   * que usuarios ya autenticados no vean la página de login
   */
  /* useEffect(() => {
    if (!authLoading && !roleLoading && user && role) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);*/

  // ============================================
  // HANDLERS - Manejadores de eventos
  // ============================================

  /**
   * Procesa el envío del formulario de login/registro
   * 
   * @description
   * Flujo de validación:
   * 1. Verificar campos requeridos
   * 2. Validar formato de email
   * 3. Validar longitud de contraseña
   * 4. Llamar a Supabase Auth (signIn o signUp)
   * 5. Mostrar toast de éxito/error
   * 6. Redirigir en caso de éxito
   * 
   * @param {React.FormEvent} e - Evento del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de campos requeridos
    if (!email || !password || (!isLogin && !name)) {
      toast.error("Por favor, complete todos los campos");
      return;
    }

    // Validación básica de formato de email
    if (!email.includes("@")) {
      toast.error("Por favor, ingrese un email válido");
      return;
    }

    // Validación de longitud de contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // ============================================
        // LOGIN - Autenticación de usuario existente
        // ============================================
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("¡Bienvenido de nuevo!");
        navigate("/dashboard");
      } else {
        // ============================================
        // SIGNUP - Registro de nuevo usuario
        // ============================================
        /**
         * emailRedirectTo: URL para redirección después de confirmar email
         * data.name: Se guarda en metadata del usuario, usado por trigger
         * para crear perfil automáticamente
         */
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: name,
            }
          }
        });

        if (error) throw error;
        toast.success("¡Registro exitoso! Redirigiendo...");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER - Renderizado del componente
  // ============================================

  return (
    <div className="min-h-screen bg-background">
      {/* Navegación pública */}
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-md">
          <Card className="shadow-elegant">
            {/* ============================================ */}
            {/* HEADER - Logo y títulos */}
            {/* ============================================ */}
            <CardHeader className="text-center">
              {/* Logo circular con inicial del hotel */}
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent-foreground font-serif font-bold text-2xl">S</span>
              </div>
              
              {/* Título dinámico según modo */}
              <CardTitle className="text-3xl font-serif">
                {isLogin ? "Bienvenido" : "Crear cuenta"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Ingrese sus credenciales para continuar"
                  : "Complete el formulario para registrarse"}
              </CardDescription>
            </CardHeader>
            
            {/* ============================================ */}
            {/* CONTENT - Formulario */}
            {/* ============================================ */}
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo nombre - solo visible en registro */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="transition-smooth"
                      disabled={loading}
                    />
                  </div>
                )}
                
                {/* Campo email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="transition-smooth"
                    disabled={loading}
                  />
                </div>
                
                {/* Campo contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="transition-smooth"
                    disabled={loading}
                  />
                </div>
                
                {/* Botón submit con variante gold del tema */}
                <Button type="submit" variant="gold" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Procesando..." : (isLogin ? "Iniciar sesión" : "Registrarse")}
                </Button>
                
                {/* Toggle entre login y registro */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-muted-foreground hover:text-accent transition-smooth"
                  >
                    {isLogin
                      ? "¿No tienes cuenta? Regístrate"
                      : "¿Ya tienes cuenta? Inicia sesión"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
