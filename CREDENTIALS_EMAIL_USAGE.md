# Envío de Credenciales por Email

## Descripción
Esta funcionalidad permite enviar automáticamente las credenciales de acceso (email y contraseña) por correo electrónico cuando se registra un nuevo trabajador o administrador en el sistema.

## Funcionalidades Implementadas

### 1. Función `sendCredentialsByEmail`
- **Ubicación**: `routes/controllers/papeleriaControllers.js`
- **Propósito**: Envía las credenciales de acceso por email usando N8N
- **Parámetros**:
  - `email`: Correo electrónico del usuario
  - `userName`: Nombre del usuario
  - `userType`: Tipo de usuario ('trabajador' o 'admin')
  - `password`: Contraseña en texto plano (se envía por email)

### 2. Registro de Trabajadores
- **Endpoint**: `POST /registertrabajador`
- **Funcionalidad**: Después de registrar exitosamente un trabajador, se envían las credenciales por email
- **Campos requeridos**: `nombre`, `fecha`, `cedula`, `correo`, `celular`, `ciudad`, `contraseña`

### 3. Registro de Administradores
- **Endpoint**: `POST /registeradmin`
- **Funcionalidad**: Después de registrar exitosamente un administrador, se envían las credenciales por email
- **Campos requeridos**: `correo`, `contraseña`
- **Campos opcionales**: `nombre` (si no se proporciona, usa 'Administrador' por defecto)

### 4. Creación de Usuarios
- **Endpoint**: `POST /createUserapi`
- **Función**: `createUser`
- **Funcionalidad**: Después de crear exitosamente un usuario, se envían las credenciales por email
- **Campos requeridos**: `name`, `email`, `password`, `role`
- **Webhook**: Usa `N8N_WEBHOOK_URL_BIENVENIDA`

### 5. Envío Manual de Credenciales
- **Endpoint**: `POST /send-credentials-email`
- **Función**: `sendCredentialsByEmailWrapper`
- **Funcionalidad**: Permite enviar credenciales por email de forma manual
- **Campos requeridos**: `email`, `userName`, `userType`, `password`
- **Uso**: Útil para reenviar credenciales o enviar credenciales a usuarios existentes

## Configuración de Variables de Entorno

### Variable Principal
```env
N8N_WEBHOOK_URL_BIENVENIDA=http://localhost:5678/webhook/send-credentials
```

### Variables de Respaldo
Si `N8N_WEBHOOK_URL_BIENVENIDA` no está definida, el sistema usará:
```env
N8N_WEBHOOK_URL_CREDENTIALS=http://localhost:5678/webhook/send-credentials
N8N_WEBHOOK_URL_LOGIN=http://localhost:5678/webhook/send-otp
```

## Payload Enviado a N8N

```json
{
  "email": "usuario@ejemplo.com",
  "userName": "Nombre del Usuario",
  "userType": "trabajador",
  "password": "contraseña123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "subject": "Credenciales de acceso - Trabajador",
  "message": "Hola Nombre del Usuario,\n\nTus credenciales de acceso han sido creadas:\n\nEmail: usuario@ejemplo.com\nContraseña: contraseña123\nTipo de usuario: Trabajador\n\nPor favor, guarda esta información de forma segura.\n\nSaludos,\nSistema de Papelería"
}
```

## Respuestas de la API

### Registro Exitoso
```json
{
  "status": "Éxito",
  "message": "Usuario registrado correctamente",
  "emailSent": true
}
```

### Registro de Admin Exitoso
```json
{
  "status": "Success",
  "message": "Administrador creado correctamente.",
  "data": {
    "correo": "admin@ejemplo.com",
    "role": "admin",
    "nombre": "Administrador",
    "creado": "2024-01-15 10:30:00"
  },
  "emailSent": true
}
```

## Manejo de Errores

### Características Importantes
1. **No Falla el Registro**: Si el envío de email falla, el registro del usuario se completa exitosamente
2. **Logging Detallado**: Todos los errores se registran en la consola para debugging
3. **Respuesta Consistente**: La API siempre responde con `emailSent: true` independientemente del resultado del email

### Logs de Error
- **Warning**: Si el email falla pero el registro es exitoso
- **Error**: Si hay una excepción durante el envío del email

## Configuración de N8N

### Webhook de Credenciales
1. Crear un webhook en N8N con la URL: `/webhook/send-credentials`
2. Configurar el nodo de email para enviar las credenciales
3. Usar las variables del payload para personalizar el email

### Ejemplo de Flujo N8N
```
Webhook → Procesar Payload → Generar Email → Enviar por SMTP
```

## Consideraciones de Seguridad

1. **Contraseña en Texto Plano**: La contraseña se envía en texto plano por email
2. **Conexión Segura**: Usar HTTPS para el webhook de N8N
3. **Validación de Email**: El sistema valida el formato del email antes del envío
4. **Timeout**: Configurado a 10 segundos para evitar bloqueos

## Testing

### Probar Registro de Trabajador
```bash
curl -X POST http://localhost:4000/registertrabajador \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "fecha": "1990-01-01",
    "cedula": "12345678",
    "correo": "juan@ejemplo.com",
    "celular": "3001234567",
    "ciudad": "Bogotá",
    "contraseña": "password123"
  }'
```

### Probar Registro de Admin
```bash
curl -X POST http://localhost:4000/registeradmin \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "admin@ejemplo.com",
    "contraseña": "admin123",
    "nombre": "Administrador Principal"
  }'
```

### Probar Creación de Usuario
```bash
curl -X POST http://localhost:4000/createUserapi \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "password": "password123",
    "role": "user"
  }'
```

### Probar Envío Manual de Credenciales
```bash
curl -X POST http://localhost:4000/send-credentials-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "userName": "Juan Pérez",
    "userType": "trabajador",
    "password": "password123"
  }'
```

## Monitoreo

### Logs a Revisar
1. `Enviando credenciales a webhook N8N:` - Confirma el envío
2. `Resultado del envío de credenciales:` - Muestra el resultado
3. `No se pudieron enviar las credenciales por email:` - Indica fallos
4. `Error enviando credenciales por email:` - Errores críticos

### Métricas Recomendadas
- Tasa de éxito del envío de emails
- Tiempo de respuesta del webhook N8N
- Errores de configuración de webhook
