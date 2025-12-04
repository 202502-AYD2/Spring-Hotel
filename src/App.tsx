/**
 * @fileoverview Punto de entrada principal de la aplicación Spring Hotel
 * @module App
 * 
 * @description
 * Este archivo configura la estructura base de la aplicación React, incluyendo:
 * - Configuración del cliente de React Query para gestión de estado del servidor
 * - Jerarquía de providers (QueryClientProvider, TooltipProvider)
 * - Sistema de notificaciones (Toaster, Sonner)
 * - Definición de todas las rutas de la aplicación
 * 
 * @design-decisions
 * - QueryClient se instancia fuera del componente para evitar recreación en cada render
 * - Las rutas protegidas usan el componente ProtectedRoute que verifica autenticación
 * - Las rutas admin usan requireAdmin para verificar rol de administrador
 * - El catch-all "*" debe estar al final para capturar rutas no definidas
 */

// ============================================
// IMPORTS - Dependencias externas e internas
// ============================================

// Componentes de UI para notificaciones
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// React Query para gestión de estado del servidor
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// React Router para navegación
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Componente de protección de rutas
import { ProtectedRoute } from "./components/ProtectedRoute";

// ============================================
// PAGES - Páginas de la aplicación
// ============================================

// Páginas públicas
import Home from "./pages/Home";
import Login from "./pages/Login";

// Páginas protegidas para clientes
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Reservation from "./pages/Reservation";
import Confirmation from "./pages/Confirmation";
import MyReservations from "./pages/MyReservations";
import Profile from "./pages/Profile";

// Páginas protegidas para administradores
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRooms from "./pages/admin/AdminRooms";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminUsers from "./pages/admin/AdminUsers";
import Roomscrearadmin from "./pages/admin/roomscrearadmin";
import Admincrearreserva from "./pages/admin/admincrearreserva";

// Página de error 404
import NotFound from "./pages/NotFound";

// ============================================
// CONFIGURATION - Configuración de React Query
// ============================================

/**
 * Cliente de React Query para gestión de caché y estado del servidor
 * Se instancia fuera del componente para mantener el estado entre renders
 */
const queryClient = new QueryClient();

// ============================================
// COMPONENT - Componente principal App
// ============================================

/**
 * Componente raíz de la aplicación
 * 
 * @description
 * Configura la jerarquía de providers y define el sistema de rutas:
 * 
 * Estructura de rutas:
 * - "/" y "/login": Rutas públicas (accesibles sin autenticación)
 * - "/dashboard", "/rooms", etc.: Rutas protegidas para clientes autenticados
 * - "/admin/*": Rutas protegidas que requieren rol de administrador
 * - "*": Catch-all para páginas no encontradas (404)
 * 
 * @returns {JSX.Element} Aplicación completa con providers y rutas configuradas
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Sistema de notificaciones toast */}
      <Toaster />
      <Sonner />
      
      <BrowserRouter>
        <Routes>
          {/* ============================================ */}
          {/* RUTAS PÚBLICAS - Accesibles sin autenticación */}
          {/* ============================================ */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* ============================================ */}
          {/* RUTAS PROTEGIDAS - Requieren autenticación */}
          {/* ============================================ */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
          <Route path="/reservation" element={<ProtectedRoute><Reservation /></ProtectedRoute>} />
          <Route path="/confirmation" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
          <Route path="/my-reservations" element={<ProtectedRoute><MyReservations /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* ============================================ */}
          {/* RUTAS ADMIN - Requieren rol de administrador */}
          {/* ============================================ */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/rooms" element={<ProtectedRoute requireAdmin><AdminRooms /></ProtectedRoute>} />
          <Route path="/admin/reservations" element={<ProtectedRoute requireAdmin><AdminReservations /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/admincrearreserva" element={<ProtectedRoute requireAdmin><Admincrearreserva /></ProtectedRoute>} />
          <Route path="/admin/roomscrearadmin" element={<ProtectedRoute requireAdmin><Roomscrearadmin /></ProtectedRoute>} />

          {/* ============================================ */}
          {/* CATCH-ALL - Debe estar al final */}
          {/* ============================================ */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
