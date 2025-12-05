# 🏨 Spring Hotel - Sistema de Reservas

Sistema de gestión de reservas hoteleras con panel de administración y portal de clientes. Diseñado con una estética moderna, minimalista y de lujo.

## 📋 Descripción

Spring Hotel es una aplicación web completa para la gestión de reservas de un hotel. Permite a los clientes explorar habitaciones, realizar reservas y gestionar su perfil, mientras que los administradores pueden gestionar habitaciones, reservas y usuarios desde un panel centralizado.

## Integrantes del Equipo
- **Andrés Camilo Areiza Londoño**
- **Sebastián Flórez Jaramillo**
- **Juan José Jaramillo Gómez**
- **Karen Cardona Gutiérrez**

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18.3** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Bundler y servidor de desarrollo
- **Tailwind CSS** - Framework de estilos
- **shadcn/ui** - Componentes de UI
- **React Router DOM** - Navegación SPA
- **TanStack Query** - Gestión de estado del servidor
- **React Hook Form + Zod** - Formularios y validación
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos

### Backend (Lovable Cloud)
- **PostgreSQL** - Base de datos relacional
- **Autenticación** - Email y contraseña con auto-confirmación
- **Row Level Security (RLS)** - Políticas de seguridad a nivel de fila
- **Storage** - Almacenamiento de archivos (avatares)

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **PostCSS** - Procesamiento de CSS
- **Bun/npm** - Gestión de paquetes

## ✨ Características

### Portal de Clientes
- ✅ Registro e inicio de sesión
- ✅ Explorar habitaciones disponibles con filtros (fecha, tipo, capacidad)
- ✅ Crear reservas seleccionando múltiples habitaciones
- ✅ Ver historial de reservas con estados
- ✅ Cancelar reservas pendientes
- ✅ Editar perfil personal y foto de avatar

### Panel de Administración
- ✅ Dashboard con estadísticas y gráficos de ocupación
- ✅ Gestión de habitaciones (crear, editar, eliminar, cambiar estado)
- ✅ Gestión de reservas (confirmar, cancelar, completar)
- ✅ Gestión de usuarios y asignación de roles

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Datos de perfil de usuarios (nombre, email, teléfono, avatar) |
| `user_roles` | Roles de usuario (cliente, admin) |
| `rooms` | Habitaciones del hotel (tipo, capacidad, precio, estado) |
| `reservations` | Reservas (fechas, huéspedes, habitaciones, precio total) |

### Roles de Usuario
- **Cliente**: Acceso a dashboard, habitaciones, reservas propias y perfil
- **Admin**: Acceso completo + gestión de habitaciones, reservas y usuarios

## Url del Proyecto Desplegado
https://spring-hotel.vercel.app

### Usuarios de Prueba
**Admin**: 

Correo: admin@gmail.com

Contraseña: abc123

**Usuario**:

Correo: usuario@gmail.com

Contraseña: abc123


## 📁 Estructura del Proyecto

```
src/
├── assets/              # Imágenes y recursos estáticos
├── components/          # Componentes reutilizables
│   ├── ui/              # Componentes shadcn/ui
│   ├── AppSidebar.tsx   # Barra lateral de navegación
│   ├── DashboardLayout.tsx # Layout con sidebar
│   ├── Navigation.tsx   # Navegación principal
│   └── ProtectedRoute.tsx # Rutas protegidas
├── hooks/               # Custom hooks
│   ├── useAuth.tsx      # Hook de autenticación
│   └── useUserRole.tsx  # Hook de roles
├── integrations/        # Integraciones externas
│   └── supabase/        # Cliente y tipos de Supabase
├── lib/                 # Utilidades
│   └── utils.ts         # Funciones helper
├── pages/               # Páginas de la aplicación
│   ├── admin/           # Páginas de administración
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminReservations.tsx
│   │   ├── AdminRooms.tsx
│   │   └── AdminUsers.tsx
│   ├── Confirmation.tsx # Confirmación de reserva
│   ├── Dashboard.tsx    # Dashboard del cliente
│   ├── Home.tsx         # Página de inicio
│   ├── Login.tsx        # Inicio de sesión / Registro
│   ├── MyReservations.tsx # Mis reservas
│   ├── Profile.tsx      # Perfil de usuario
│   ├── Reservation.tsx  # Proceso de reserva
│   └── Rooms.tsx        # Listado de habitaciones
├── App.tsx              # Componente principal con rutas
├── index.css            # Estilos globales y variables CSS
└── main.tsx             # Punto de entrada
```

## 🚀 Requisitos Previos

- **Node.js 18+** o **Bun**
- **npm**, **yarn** o **bun** como gestor de paquetes

## 📦 Instalación

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# 2. Navegar al directorio del proyecto
cd spring-hotel

# 3. Instalar dependencias
npm install
# o con bun
bun install

# 4. Iniciar el servidor de desarrollo
npm run dev
# o con bun
bun dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con hot-reload |
| `npm run build` | Genera el build de producción |
| `npm run preview` | Vista previa del build de producción |
| `npm run lint` | Ejecuta ESLint para verificar el código |

## 🔐 Variables de Entorno

El proyecto utiliza las siguientes variables de entorno (configuradas automáticamente por Lovable Cloud):

```env
VITE_SUPABASE_URL=<https://aognyubjwspmkzeheawe.supabase.co>
VITE_SUPABASE_PUBLISHABLE_KEY=<eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ255dWJqd3NwbWt6ZWhlYXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDU3NDAsImV4cCI6MjA4MDI4MTc0MH0.WJmP9juvY0jtwaBKZMVsNfKGmsyijfO1CuLYaq-Puzs>
VITE_SUPABASE_PROJECT_ID=<uujieazftxnfunftvjpw>
```

## 🎨 Diseño

### Paleta de Colores
- **Primario**: Dorado (#D4AF37)
- **Fondo**: Negro y tonos oscuros
- **Texto**: Blanco y grises claros
- **Acentos**: Dorado con variaciones

### Tipografía
- **Títulos**: Playfair Display (serif)
- **Cuerpo**: Inter (sans-serif)

### Estilo
- Moderno y minimalista
- Estética de lujo hotelero
- Transmite confianza y calma

## 👥 Uso del Sistema

### Como Cliente
1. Regístrate con tu email y contraseña
2. Explora las habitaciones disponibles
3. Selecciona fechas y habitaciones para tu reserva
4. Completa los datos de los huéspedes
5. Confirma tu reserva
6. Gestiona tus reservas desde "Mis Reservas"

### Como Administrador
1. Inicia sesión con credenciales de administrador
2. Accede al panel de administración
3. Gestiona habitaciones, reservas y usuarios
4. Consulta estadísticas de ocupación


