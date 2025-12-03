import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  price: number;
  description: string;
  status: string;
  image_url: string | null;
  features: string[];
}

const AdminRooms = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "suite",
    capacity: 2,
    price: 0,
    description: "",
    status: "available",
    features: "",
  });

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
      fetchRooms();
    }
  }, [user, isAdmin]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      toast.error("Error al cargar habitaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const roomData = {
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
        price: formData.price,
        description: formData.description,
        status: formData.status,
        features: formData.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      };

      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update(roomData)
          .eq("id", editingRoom.id);

        if (error) throw error;
        toast.success("Habitación actualizada");
      } else {
        const { error } = await supabase
          .from("rooms")
          .insert([{ ...roomData, created_by: user?.id }]);

        if (error) throw error;
        toast.success("Habitación creada");
      }

      setDialogOpen(false);
      resetForm();
      fetchRooms();
    } catch (error: any) {
      console.error("Error saving room:", error);
      toast.error("Error al guardar habitación");
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      price: room.price,
      description: room.description || "",
      status: room.status,
      features: room.features?.join(", ") || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta habitación?")) return;

    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);
      if (error) throw error;
      toast.success("Habitación eliminada");
      fetchRooms();
    } catch (error: any) {
      console.error("Error deleting room:", error);
      toast.error("Error al eliminar habitación");
    }
  };

  const resetForm = () => {
    setEditingRoom(null);
    setFormData({
      name: "",
      type: "suite",
      capacity: 2,
      price: 0,
      description: "",
      status: "available",
      features: "",
    });
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
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-serif font-bold mb-2">
                  Gestión de Habitaciones
                </h1>
                <p className="text-muted-foreground">
                  Administra las habitaciones del hotel
                </p>
              </div>
              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="gold">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Habitación
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRoom ? "Editar Habitación" : "Nueva Habitación"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            setFormData({ ...formData, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="suite">Suite</SelectItem>
                            <SelectItem value="doble">Doble</SelectItem>
                            <SelectItem value="sencilla">Sencilla</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacidad</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              capacity: parseInt(e.target.value),
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Precio</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              price: parseFloat(e.target.value),
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            setFormData({ ...formData, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">
                              Disponible
                            </SelectItem>
                            <SelectItem value="occupied">Ocupada</SelectItem>
                            <SelectItem value="maintenance">
                              Mantenimiento
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="features">
                          Características (separadas por comas)
                        </Label>
                        <Input
                          id="features"
                          value={formData.features}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              features: e.target.value,
                            })
                          }
                          placeholder="WiFi, TV, Minibar"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" variant="gold">
                        {editingRoom ? "Actualizar" : "Crear"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Habitaciones ({rooms.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">
                          {room.name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {room.type}
                        </TableCell>
                        <TableCell>{room.capacity} personas</TableCell>
                        <TableCell>${room.price.toLocaleString()}</TableCell>
                        <TableCell className="capitalize">
                          {room.status}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(room)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(room.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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

export default AdminRooms;
