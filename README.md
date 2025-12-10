# Sistema de Venta - Login Profesional

Sistema de autenticación profesional con verificación por correo electrónico.

## Características

- **Registro de usuarios** con validación de datos
- **Verificación por email** con código de 6 dígitos
- **Inicio de sesión seguro** con JWT
- **Interfaz moderna** y responsive
- **Protección contra ataques** de fuerza bruta (rate limiting)
- **Encriptación de contraseñas** con bcrypt

## Requisitos

- Node.js 16 o superior
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd SISTEMADEVENTA
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

4. Editar el archivo `.env` con tus credenciales:
```env
# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Configuración de JWT
JWT_SECRET=tu_clave_secreta_aqui
JWT_EXPIRES_IN=24h

# Configuración de Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion

# Nombre de la aplicación
APP_NAME=Sistema de Venta
APP_URL=http://localhost:3000
```

### Configuración de Gmail

Para enviar correos con Gmail:

1. Ir a [Configuración de cuenta de Google](https://myaccount.google.com/security)
2. Activar la verificación en 2 pasos
3. Ir a [Contraseñas de aplicación](https://myaccount.google.com/apppasswords)
4. Generar una nueva contraseña para "Correo"
5. Usar esa contraseña en `EMAIL_PASS`

## Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor se iniciará en `http://localhost:3000`

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/verify` | Verificar cuenta con código |
| POST | `/api/auth/resend` | Reenviar código de verificación |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/verify-token` | Verificar token JWT |

### Ejemplos de uso

**Registro:**
```json
POST /api/auth/register
{
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "password": "miPassword123"
}
```

**Verificación:**
```json
POST /api/auth/verify
{
    "email": "juan@ejemplo.com",
    "code": "123456"
}
```

**Login:**
```json
POST /api/auth/login
{
    "email": "juan@ejemplo.com",
    "password": "miPassword123"
}
```

## Estructura del Proyecto

```
SISTEMADEVENTA/
├── config/
│   └── database.js       # Configuración de base de datos
├── controllers/
│   └── auth.controller.js # Controladores de autenticación
├── routes/
│   └── auth.routes.js    # Rutas de la API
├── services/
│   └── email.service.js  # Servicio de envío de emails
├── public/
│   ├── css/
│   │   └── styles.css    # Estilos CSS
│   ├── js/
│   │   └── app.js        # JavaScript del frontend
│   ├── index.html        # Página de login/registro
│   └── dashboard.html    # Panel después del login
├── data/
│   └── users.json        # Base de datos de usuarios
├── server.js             # Servidor Express
├── package.json
├── .env.example
└── README.md
```

## Seguridad

- Contraseñas encriptadas con bcrypt (12 salt rounds)
- Tokens JWT con expiración configurable
- Rate limiting para prevenir ataques de fuerza bruta
- Validación de datos en backend
- Códigos de verificación con expiración de 15 minutos

## Licencia

MIT
