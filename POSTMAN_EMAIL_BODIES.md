# 📧 Bodies para Pruebas de Envío de Emails - Postman

## 🚀 Endpoint de Envío de Emails

```
POST https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-email
```

## 📋 Headers Requeridos

```
Content-Type: application/json
```

## 🔧 Bodies de Prueba

### 1. **Body Básico (Mínimo Requerido)**

```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "email": "pedro@gmail.com"
}
```

### 2. **Body Completo (Con Asunto y Mensaje Personalizado)**

```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "email": "pedro@gmail.com",
  "subject": "Su factura de compra - Papelería Kevin",
  "message": "Estimado cliente, adjunto encontrará la factura de su compra. Gracias por elegirnos."
}
```

### 3. **Body para Email Corporativo**

```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "email": "contabilidad@empresa.com",
  "subject": "Factura VTA-027 - Documento Fiscal",
  "message": "Por favor encontrar adjunta la factura correspondiente a la compra realizada. Este documento es válido para efectos fiscales."
}
```

### 4. **Body para Múltiples Destinatarios (Usar múltiples requests)**

```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "email": "cliente@email.com",
  "subject": "Factura de Venta - Papelería Kevin",
  "message": "Gracias por su compra. Adjunto encontrará la factura detallada de su pedido."
}
```

### 5. **Body con Mensaje de Seguimiento**

```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "email": "pedro@gmail.com",
  "subject": "Factura VTA-027 - Seguimiento de Compra",
  "message": "Hola Pedro, esperamos que esté satisfecho con su compra. Adjunto encontrará la factura detallada. Si necesita algún producto adicional, no dude en contactarnos."
}
```

## 🧪 Casos de Prueba Adicionales

### 6. **Body para Validación de Errores - Email Inválido**

```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "email": "email-invalido"
}
```

**Respuesta Esperada:**
```json
{
  "status": "Error",
  "message": "Formato de email inválido"
}
```

### 7. **Body para Validación de Errores - SaleId Inexistente**

```json
{
  "saleId": "507f1f77bcf86cd799439011",
  "email": "test@email.com"
}
```

**Respuesta Esperada:**
```json
{
  "status": "Error",
  "message": "Venta no encontrada"
}
```

### 8. **Body para Validación de Errores - Campos Faltantes**

```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d"
}
```

**Respuesta Esperada:**
```json
{
  "status": "Error",
  "message": "saleId y email son obligatorios"
}
```

## 📤 Respuesta Exitosa Esperada

```json
{
  "status": "Success",
  "message": "Factura enviada por email correctamente",
  "data": {
    "saleId": "68d6bc80e8e7bad4fd954e1d",
    "email": "pedro@gmail.com",
    "invoiceCode": "VTA-027",
    "sentAt": "2025-01-26 11:30:45"
  }
}
```

## ⚙️ Configuración de Variables de Entorno

Para que funcione el envío de emails, necesitas configurar estas variables en tu archivo `.env`:

```env
# Configuración SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
SMTP_FROM=noreply@papeleria.com

# O para otros proveedores:
# SMTP_HOST=smtp.outlook.com (Outlook)
# SMTP_HOST=smtp.mailgun.org (Mailgun)
# SMTP_HOST=smtp.sendgrid.net (SendGrid)
```

## 🔐 Configuración de Gmail (Recomendado)

1. **Habilitar 2FA** en tu cuenta de Gmail
2. **Generar contraseña de aplicación**:
   - Ve a Configuración de Google
   - Seguridad → Verificación en 2 pasos
   - Contraseñas de aplicaciones
   - Generar nueva contraseña
3. **Usar la contraseña generada** en `SMTP_PASS`

## 📱 Ejemplo de Uso en Postman

### Configuración de la Request:

1. **Método**: `POST`
2. **URL**: `https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-email`
3. **Headers**:
   ```
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "saleId": "68d6bc80e8e7bad4fd954e1d",
     "email": "pedro@gmail.com",
     "subject": "Su factura de compra",
     "message": "Gracias por su compra en Papelería Kevin"
   }
   ```

## 🎯 Casos de Uso Reales

### Para Cliente Individual:
```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "email": "pedro@gmail.com",
  "subject": "Factura VTA-027 - Su compra en Papelería Kevin",
  "message": "Hola Pedro, gracias por su compra. Adjunto encontrará la factura detallada de su pedido."
}
```

### Para Empresa/Contabilidad:
```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "email": "contabilidad@empresa.com",
  "subject": "Factura VTA-027 - Documento Fiscal",
  "message": "Adjunto encontrará la factura correspondiente a la compra realizada. Este documento es válido para efectos fiscales y contables."
}
```

### Para Seguimiento Post-Venta:
```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "email": "pedro@gmail.com",
  "subject": "Factura VTA-027 - Gracias por elegirnos",
  "message": "Esperamos que esté satisfecho con su compra. Si necesita algún producto adicional o tiene alguna consulta, no dude en contactarnos. ¡Gracias por elegir Papelería Kevin!"
}
```

## ⚠️ Notas Importantes

1. **El saleId debe ser un ObjectId válido de MongoDB**
2. **El email debe tener formato válido**
3. **El PDF se genera automáticamente** y se adjunta al email
4. **El email incluye HTML** con información de la factura
5. **Se registra la hora de envío** en zona horaria de Colombia
6. **El asunto es opcional** - si no se proporciona, se usa uno por defecto
7. **El mensaje es opcional** - se puede enviar solo con el PDF adjunto
