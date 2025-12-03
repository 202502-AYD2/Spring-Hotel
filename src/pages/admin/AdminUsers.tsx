import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, User } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  user_roles: { role: string }[];
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [correos, setCorreos] = useState([
    "juan.jgomez@udea.edu.co",
    "andresc.areiza@udea.edu.co",
    "karen.cardonag@udea.edu.co",
    "sebas.fj@hotmail.com",
  ]);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/login");
      } else if (!isAdmin) {
        if (!correos.includes(user.email)) {
          navigate("/dashboard");
        }
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch roles separately for each user
      const enrichedUsers = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          return {
            ...profile,
            user_roles: rolesData || [],
          };
        })
      );

      setUsers(enrichedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (
    userId: string,
    newRole: "cliente" | "admin"
  ) => {
    try {
      // First, delete existing role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Then insert new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast.success(`Rol actualizado a ${newRole}`);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar rol");
    }
  };

  const getUserRole = (userRoles: { role: string }[]): "admin" | "cliente" => {
    return userRoles.find((r) => r.role === "admin") ? "admin" : "cliente";
  };

  if (authLoading || roleLoading || loading) {
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
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-4xl font-serif font-bold mb-2">
                Gestión de Usuarios
              </h1>
              <p className="text-muted-foreground">
                Administra usuarios y roles del sistema
              </p>
            </div>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Usuarios ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Fecha de registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userProfile) => {
                      const currentRole = getUserRole(userProfile.user_roles);
                      const isCurrentUser = userProfile.id === user?.id;

                      return (
                        <TableRow key={userProfile.id}>
                          <TableCell className="font-medium">
                            {userProfile.name}
                          </TableCell>
                          <TableCell>{userProfile.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                currentRole === "admin"
                                  ? "default"
                                  : "secondary"
                              }
                              className="flex items-center gap-1 w-fit"
                            >
                              {currentRole === "admin" ? (
                                <Shield className="w-3 h-3" />
                              ) : (
                                <User className="w-3 h-3" />
                              )}
                              {currentRole === "admin" ? "Admin" : "Cliente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(userProfile.created_at),
                              "dd 'de' MMMM, yyyy",
                              { locale: es }
                            )}
                          </TableCell>
                          <TableCell>
                            {!isCurrentUser && (
                              <Select
                                value={currentRole}
                                onValueChange={(value) =>
                                  updateUserRole(
                                    userProfile.id,
                                    value as "cliente" | "admin"
                                  )
                                }
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cliente">
                                    Cliente
                                  </SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {isCurrentUser && (
                              <span className="text-sm text-muted-foreground italic">
                                Tu cuenta
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
