/**
 * @fileoverview Página de perfil de usuario
 * @module Profile
 * 
 * @description
 * Permite a los usuarios ver y editar su información personal, incluyendo
 * nombre, teléfono y foto de perfil. El email no es editable por seguridad.
 * 
 * @design-decisions
 * - Email no editable: previene problemas de autenticación y seguridad
 * - Avatar en Supabase Storage: permite imágenes de cualquier tamaño hasta 2MB
 * - Limpieza de avatares antiguos: evita acumulación de archivos no usados
 * - Formato de avatar: organizado por user_id para fácil gestión
 * - Iniciales como fallback: UX amigable cuando no hay foto
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";

// ============================================
// TYPES - Definición de tipos
// ============================================

/**
 * Estructura completa del perfil de usuario
 * @interface Profile
 */
interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

// ============================================
// COMPONENT - Página de perfil
// ============================================

/**
 * Página de gestión del perfil de usuario
 * 
 * @description
 * Funcionalidades:
 * - Ver información del perfil actual
 * - Editar nombre y teléfono
 * - Subir/cambiar foto de perfil
 * - El email se muestra pero no se puede modificar
 * 
 * @returns {JSX.Element} Página de perfil con formulario y avatar
 */
const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // ============================================
  // STATE - Estados del componente
  // ============================================
  
  /** Datos completos del perfil */
  const [profile, setProfile] = useState<Profile | null>(null);
  
  /** Estado de carga inicial */
  const [loading, setLoading] = useState(true);
  
  /** Estado de guardado de cambios */
  const [saving, setSaving] = useState(false);
  
  /** Estado de subida de avatar */
  const [uploading, setUploading] = useState(false);
  
  /** Campos editables del formulario */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // ============================================
  // EFFECTS - Carga y autenticación
  // ============================================

  /**
   * Redirige a login si no hay usuario autenticado
   */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  /**
   * Carga el perfil cuando hay usuario
   */
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // ============================================
  // DATA FETCHING - Carga de datos
  // ============================================

  /**
   * Obtiene los datos del perfil desde Supabase
   * Inicializa los campos editables con los valores actuales
   */
  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      toast.error("Error al cargar el perfil");
    } else if (data) {
      setProfile(data);
      setName(data.name || "");
      setPhone(data.phone || "");
    }
    setLoading(false);
  };

  // ============================================
  // HANDLERS - Manejadores de eventos
  // ============================================

  /**
   * Guarda los cambios del perfil (nombre y teléfono)
   * El email no se puede modificar por razones de seguridad
   */
  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name, phone })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      toast.error("Error al guardar los cambios");
    } else {
      toast.success("Perfil actualizado correctamente");
      fetchProfile(); // Recargar datos actualizados
    }
    setSaving(false);
  };

  /**
   * Maneja la subida de una nueva foto de perfil
   * 
   * @description
   * Proceso:
   * 1. Validar tipo de archivo (solo imágenes)
   * 2. Validar tamaño (máximo 2MB)
   * 3. Eliminar avatares anteriores
   * 4. Subir nuevo archivo a Storage
   * 5. Actualizar URL en el perfil
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} event - Evento de cambio del input file
   */
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, seleccione una imagen válida");
      return;
    }

    // Validar tamaño (2MB máximo)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 2MB");
      return;
    }

    setUploading(true);

    // Construir nombre de archivo con extensión original
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // ============================================
    // CLEANUP - Eliminar avatares anteriores
    // ============================================
    /**
     * Elimina posibles avatares anteriores con diferentes extensiones
     * Evita acumulación de archivos no usados en Storage
     */
    await supabase.storage.from("avatars").remove([
      `${user.id}/avatar.jpg`, 
      `${user.id}/avatar.png`, 
      `${user.id}/avatar.webp`
    ]);

    // ============================================
    // UPLOAD - Subir nuevo avatar
    // ============================================
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      toast.error("Error al subir la imagen");
      setUploading(false);
      return;
    }

    // ============================================
    // UPDATE PROFILE - Actualizar URL del avatar
    // ============================================
    
    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // Actualizar perfil con nueva URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating avatar URL:", updateError);
      toast.error("Error al actualizar el perfil");
    } else {
      toast.success("Foto de perfil actualizada");
      fetchProfile(); // Recargar para mostrar nuevo avatar
    }

    setUploading(false);
  };

  // ============================================
  // HELPER FUNCTIONS - Funciones auxiliares
  // ============================================

  /**
   * Genera iniciales a partir del nombre
   * 
   * @param {string} name - Nombre completo
   * @returns {string} Máximo 2 caracteres en mayúsculas
   */
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
      <div className="p-6 max-w-2xl mx-auto">
        {/* ============================================ */}
        {/* HEADER - Título de la página */}
        {/* ============================================ */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal</p>
        </div>

        <div className="space-y-6">
          {/* ============================================ */}
          {/* AVATAR SECTION - Foto de perfil */}
          {/* ============================================ */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Foto de perfil</CardTitle>
              <CardDescription>Personaliza tu avatar</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              {/* Avatar con botón de cámara superpuesto */}
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-accent">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-semibold">
                    {profile?.name ? getInitials(profile.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                
                {/* Botón de subir foto */}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 text-primary-foreground" />
                  )}
                </label>
                
                {/* Input file oculto */}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </div>
              
              {/* Información resumida del usuario */}
              <div>
                <p className="font-medium">{profile?.name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* PROFILE FORM - Información personal */}
          {/* ============================================ */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Información personal</CardTitle>
              <CardDescription>Actualiza tus datos de contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campo: Nombre (editable) */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Campo: Email (solo lectura) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="flex-1 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
              </div>

              {/* Campo: Teléfono (editable) */}
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Botón guardar */}
              <Button
                variant="gold"
                className="w-full"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
