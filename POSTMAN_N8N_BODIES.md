# 🔗 Bodies para Integración con n8n - Postman

## 🚀 Endpoint para n8n

```
POST https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-n8n
```

## 📋 Headers Requeridos

```
Content-Type: application/json
```

## 🔧 Bodies de Prueba para n8n

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
  "subject": "Gracias por tu compra, Pedro",
  "message": "Estimado Pedro, adjunto encontrará la factura de su compra. Gracias por elegirnos."
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

## 📤 Respuesta del Backend

```json
{
  "status": "Success",
  "message": "Datos enviados a n8n correctamente",
  "data": {
    "saleId": "68d6bc80e8e7bad4fd954e1d",
    "email": "pedro@gmail.com",
    "invoiceCode": "VTA-027",
    "n8nResponse": {
      "success": true,
      "message": "Email enviado correctamente"
    },
    "sentAt": "2025-01-26 11:30:45"
  }
}
```

## 🔄 Datos que Recibe n8n

El backend envía estos datos a tu webhook de n8n:

```json
{
  "nombre": "pedro",
  "email": "pedro@gmail.com",
  "documento": "23213213",
  "telefono": "3234333333",
  "codigoFactura": "VTA-027",
  "fecha": "26/09/2025",
  "hora": "11:17:04",
  "total": 40000,
  "metodoPago": "Efectivo",
  "vendedor": "kevin serna",
  "emailVendedor": "kevinfernandoserna11@gmail.com",
  "productos": [
    {
      "codigo": "BO002",
      "nombre": "BOLSO",
      "cantidad": 1,
      "precioUnitario": 40000,
      "total": 40000
    }
  ],
  "pdfBase64": "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoyNTAgNzAwIFRkCihGQUNUVVJBIFNFIFZFTlRBKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI2OCAwMDAwMCBuIAowMDAwMDAwMzQxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDI5CiUlRU9G",
  "nombreArchivo": "factura-VTA-027.pdf",
  "pdfUrl": "https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/68d6bc80e8e7bad4fd954e1d",
  "asunto": "Gracias por tu compra, Pedro",
  "mensaje": "Estimado Pedro, adjunto encontrará la factura de su compra. Gracias por elegirnos.",
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "timestamp": "2025-01-26 11:30:45"
}
```

## ⚙️ Configuración de Variables de Entorno

Agrega esta variable a tu archivo `.env`:

```env
N8N_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/send-invoice
```

## 🎯 Configuración en n8n

### En tu nodo "Convert to File":
- **Input**: `{{ $json.pdfBase64 }}`
- **Filename**: `{{ $json.nombreArchivo }}`

### En tu nodo "Send a message":
- **To**: `{{ $json.email }}`
- **Subject**: `{{ $json.asunto }}`
- **Message**: `{{ $json.mensaje }}`
- **Attachment**: El archivo convertido del nodo anterior

## 🧪 Casos de Prueba Adicionales

### 4. **Body para Validación de Errores - Email Inválido**

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

### 5. **Body para Validación de Errores - SaleId Inexistente**

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

### 6. **Body para Validación de Errores - Campos Faltantes**

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

## 🔧 Configuración en Postman

### Request Básica:
1. **Método**: `POST`
2. **URL**: `https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-n8n`
3. **Headers**:
   ```
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "saleId": "68d6bc80e8e7bad4fd954e1d",
     "email": "pedro@gmail.com",
     "subject": "Gracias por tu compra, Pedro",
     "message": "Estimado Pedro, adjunto encontrará la factura de su compra."
   }
   ```

## 🎨 Variables Disponibles en n8n

Tu flujo de n8n tendrá acceso a estas variables:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `nombre` | Nombre del cliente | "pedro" |
| `email` | Email del cliente | "pedro@gmail.com" |
| `documento` | Documento del cliente | "23213213" |
| `telefono` | Teléfono del cliente | "3234333333" |
| `codigoFactura` | Código de la factura | "VTA-027" |
| `fecha` | Fecha de la venta | "26/09/2025" |
| `hora` | Hora de la venta | "11:17:04" |
| `total` | Total de la venta | 40000 |
| `metodoPago` | Método de pago | "Efectivo" |
| `vendedor` | Nombre del vendedor | "kevin serna" |
| `emailVendedor` | Email del vendedor | "kevinfernandoserna11@gmail.com" |
| `productos` | Array de productos | `[{...}]` |
| `pdfBase64` | PDF en Base64 | "JVBERi0xLjQK..." |
| `nombreArchivo` | Nombre del archivo PDF | "factura-VTA-027.pdf" |
| `pdfUrl` | URL directa al PDF | "https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/68d6bc80e8e7bad4fd954e1d" |
| `asunto` | Asunto del email | "Gracias por tu compra, Pedro" |
| `mensaje` | Mensaje del email | "Estimado Pedro..." |
| `saleId` | ID de la venta | "68d6bc80e8e7bad4fd954e1d" |
| `timestamp` | Timestamp de envío | "2025-01-26 11:30:45" |

## ⚠️ Notas Importantes

1. **El PDF se genera automáticamente** en Base64 para n8n
2. **Todos los datos de la venta** están disponibles en n8n
3. **El webhook de n8n** debe estar configurado para recibir POST
4. **La variable `N8N_WEBHOOK_URL`** debe apuntar a tu instancia de n8n
5. **El flujo de n8n** se encarga del envío real del email
6. **El backend solo prepara y envía** los datos a n8n

## 🚀 Flujo Completo

1. **Frontend** → POST a `/send-invoice-n8n`
2. **Backend** → Genera PDF en Base64
3. **Backend** → Envía datos a n8n webhook
4. **n8n** → Convierte Base64 a archivo
5. **n8n** → Envía email con PDF adjunto
6. **n8n** → Responde al backend
7. **Backend** → Responde al frontend
