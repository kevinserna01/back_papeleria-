# Sistema de Códigos Aleatorios con Envío por Email - Documentación de Uso

## Descripción
Sistema implementado para generar códigos aleatorios de 6 dígitos que expiran en 5 minutos. Los códigos se generan automáticamente después del login exitoso, se envían por email usando N8N, y pueden ser validados para operaciones específicas.

## Características
- **Duración**: 5 minutos de validez
- **Formato**: Código numérico de 6 dígitos
- **Expiración**: Por tiempo o por uso (un solo uso)
- **Envío por email**: Integración con N8N para envío automático
- **Limpieza automática**: Códigos expirados se eliminan automáticamente
- **Soporte**: Trabajadores y administradores
- **Webhook N8N**: `http://localhost:5678/webhook/send-otp`

## Funciones Implementadas

### 1. Generación Automática en Login
Los códigos se generan automáticamente después de un login exitoso en:
- `POST /logintrabajador` - Login de trabajador
- `POST /loginadminapi` - Login de administrador
- `POST /loginUserapi` - Login de usuario general (trabajadores y administradores)

**Respuesta del login (SIN código):**
```json
{
  "status": "Éxito",
  "message": "Credenciales correctas. Se ha enviado un código de verificación a tu email.",
  "logEntry": { ... },
  "requiresVerification": true,
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userType": "trabajador",
  "emailSent": true,
  "emailMessage": "Código enviado exitosamente"
}
```

### 2. Endpoints Disponibles

#### Generar Código Manualmente
```
POST /generate-code
```
**Body:**
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userType": "trabajador" // o "admin"
}
```

**Respuesta:**
```json
{
  "status": "Success",
  "message": "Código generado exitosamente",
  "data": {
    "code": "123456",
    "expiresAt": "2024-01-15T10:35:00.000Z",
    "expiresIn": 300000
  }
}
```

#### Validar Código
```
POST /validate-code
```
**Body:**
```json
{
  "code": "123456",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userType": "trabajador"
}
```

**Respuesta exitosa:**
```json
{
  "status": "Success",
  "message": "Código válido"
}
```

**Respuesta de error:**
```json
{
  "status": "Error",
  "message": "Código inválido o ya utilizado"
}
```

#### Verificar Código OTP y Completar Login
```
POST /verify-otp
```
**Body:**
```json
{
  "code": "123456",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userType": "trabajador"
}
```

**Respuesta exitosa:**
```json
{
  "status": "Success",
  "message": "Código verificado correctamente. Login completado.",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "nombre": "Juan Pérez",
    "correo": "usuario@example.com",
    "role": "trabajador",
    "loginCompleted": true
  }
}
```

**Respuesta con código inválido:**
```json
{
  "status": "Error",
  "message": "Código inválido o ya utilizado"
}
```

#### Reenviar Código OTP
```
POST /resend-otp
```
**Body:**
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userType": "trabajador"
}
```

**Respuesta exitosa:**
```json
{
  "status": "Success",
  "message": "Nuevo código OTP enviado por email",
  "emailSent": true,
  "email": "usuario@example.com",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Juan Pérez",
    "email": "usuario@example.com",
    "role": "trabajador"
  }
}
```

**Respuesta con error:**
```json
{
  "status": "Error",
  "message": "Error enviando código por email",
  "error": "Error del webhook N8N: 500 Internal Server Error",
  "email": "usuario@example.com"
}
```

#### Generar y Enviar Código OTP por Email (Manual)
```
POST /send-otp-email
```
**Body:**
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userType": "trabajador",
  "email": "usuario@example.com",
  "userName": "Juan Pérez"
}
```

**Respuesta exitosa:**
```json
{
  "status": "Success",
  "message": "Código OTP generado y enviado por email",
  "data": {
    "code": "123456",
    "expiresAt": "2024-01-15T10:35:00.000Z",
    "expiresIn": 300000
  },
  "emailSent": true
}
```

#### Limpiar Códigos Expirados
```
POST /cleanup-codes
```
**Respuesta:**
```json
{
  "status": "Success",
  "message": "Códigos expirados limpiados exitosamente"
}
```

## Estructura de Base de Datos

### Colección: `random_codes`
```javascript
{
  _id: ObjectId,
  code: "123456",           // Código de 6 dígitos
  userId: "64f8a1b2c3d4e5f6a7b8c9d0",  // ID del usuario
  userType: "trabajador",   // "trabajador" o "admin"
  createdAt: Date,          // Fecha de creación
  expiresAt: Date,          // Fecha de expiración (5 min después)
  isUsed: false,            // Si ya fue usado
  usedAt: null              // Fecha de uso (si fue usado)
}
```

## Flujo de Uso

1. **Login del usuario** → Se valida credenciales y se genera código OTP
2. **Envío por email** → El código se envía automáticamente por email vía N8N
3. **Respuesta de login** → Indica que se requiere verificación (SIN mostrar el código)
4. **El usuario recibe el código** → En su correo electrónico
5. **Verificación del código** → Usuario ingresa el código recibido por email
6. **Login completado** → Solo después de verificar el código correctamente
7. **El código se marca como usado** → Después de la verificación exitosa
8. **Limpieza automática** → Códigos expirados se eliminan

## Configuración

### Variables de Entorno Requeridas

Agregar al archivo `.env`:

```env
# Configuración N8N para Envío de Códigos OTP
N8N_WEBHOOK_URL_LOGIN=http://localhost:5678/webhook/send-otp
```

### Configuración por Ambiente

- **Desarrollo:** `http://localhost:5678/webhook/send-otp`
- **Producción:** `https://tu-n8n-instance.com/webhook/send-otp`
- **Staging:** `https://staging-n8n.com/webhook/send-otp`

## Integración con N8N

### Webhook URL
Configurado en la variable de entorno `N8N_WEBHOOK_URL_LOGIN` en el archivo `.env`:

```env
N8N_WEBHOOK_URL_LOGIN=http://localhost:5678/webhook/send-otp
```

**Valor por defecto:** `http://localhost:5678/webhook/send-otp` (si no está configurado)

### Payload enviado a N8N
```json
{
  "email": "usuario@example.com",
  "code": "123456",
  "userName": "Juan Pérez",
  "userType": "trabajador",
  "expiresIn": 5,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Configuración del Webhook N8N
El webhook debe estar configurado para:
1. Recibir el payload JSON
2. Extraer los campos: `email`, `code`, `userName`, `userType`, `expiresIn`
3. Enviar un email con el código OTP
4. Retornar una respuesta JSON de confirmación

### Manejo de Errores

**Si `N8N_WEBHOOK_URL_LOGIN` no está configurado:**
```json
{
  "success": false,
  "message": "Configuración de webhook N8N no encontrada",
  "error": "N8N_WEBHOOK_URL_LOGIN no está definido en .env"
}
```

**Si el webhook N8N no responde:**
```json
{
  "success": false,
  "message": "Error enviando código por email",
  "error": "Error del webhook N8N: 500 Internal Server Error"
}
```

## Casos de Uso

### Ejemplo: Flujo completo de login con OTP
```javascript
// 1. Usuario hace login (código se envía automáticamente por email)
const loginResponse = await fetch('/logintrabajador', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ correo: 'user@example.com', contraseña: 'password' })
});

const { requiresVerification, userId, userType, emailSent } = await loginResponse.json();

if (requiresVerification && emailSent) {
  console.log('Código OTP enviado por email. Revisa tu correo.');
  
  // 2. Usuario ingresa el código recibido por email
  const userEnteredCode = '123456'; // Código que el usuario ingresó
  
  // 3. Verificar el código y completar el login
  const verifyResponse = await fetch('/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: userEnteredCode,
      userId: userId,
      userType: userType
    })
  });
  
  if (verifyResponse.ok) {
    const { user } = await verifyResponse.json();
    console.log('Login completado exitosamente:', user);
    // Ahora el usuario puede acceder al sistema
  } else {
    console.log('Código inválido o expirado');
  }
} else {
  console.log('Error en el proceso de login');
}
```

### Ejemplo: Reenviar código OTP
```javascript
// Si el usuario no recibió el código, puede solicitar que se reenvíe
const resendResponse = await fetch('/resend-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '64f8a1b2c3d4e5f6a7b8c9d0',
    userType: 'trabajador'
  })
});

const { emailSent } = await resendResponse.json();
if (emailSent) {
  console.log('Nuevo código OTP enviado');
  console.log('Código anterior invalidado automáticamente');
} else {
  console.log('Error reenviando código');
}
```

### Comportamiento del Reenvío

**Cuando se reenvía un código:**
1. **Se invalida automáticamente** el código anterior del mismo usuario
2. **Se genera un nuevo código** con nueva expiración (5 minutos)
3. **Se envía por email** el nuevo código
4. **El código anterior ya no es válido** aunque no haya expirado

**Ventajas de seguridad:**
- ✅ Previene el uso de códigos antiguos
- ✅ Evita confusión con múltiples códigos activos
- ✅ Garantiza que solo el último código enviado sea válido
- ✅ Mejora la experiencia del usuario

### Ejemplo: Envío manual de código OTP
```javascript
// Enviar código OTP por email manualmente
const otpResponse = await fetch('/send-otp-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '64f8a1b2c3d4e5f6a7b8c9d0',
    userType: 'trabajador',
    email: 'usuario@example.com',
    userName: 'Juan Pérez'
  })
});

const { data, emailSent } = await otpResponse.json();
if (emailSent) {
  console.log('Código OTP enviado exitosamente');
} else {
  console.log('Error enviando código OTP');
}
```

## Seguridad

- **Un solo uso**: Cada código solo puede ser usado una vez
- **Expiración temporal**: Los códigos expiran en 5 minutos
- **Invalidación automática**: Al generar un nuevo código, se invalidan automáticamente todos los códigos anteriores del mismo usuario
- **Limpieza automática**: Códigos expirados se eliminan de la base de datos
- **Validación de usuario**: Los códigos están vinculados a un usuario específico
- **Tipo de usuario**: Los códigos están vinculados al tipo de usuario (trabajador/admin)

## Notas Técnicas

- Los códigos se generan usando `Math.random()` con rango 100000-999999
- La limpieza de códigos expirados se ejecuta automáticamente al generar nuevos códigos
- La validación de códigos es atómica (se marca como usado inmediatamente)
- Los códigos expirados se eliminan tanto por tiempo como por uso
