# 📧 Controlador de Envío de Email a n8n

## 🚀 Endpoint

```
POST /v1/papeleria/send-invoice-n8n
```

## 📋 Descripción

Este controlador se encarga de enviar datos de factura a un webhook de n8n para que n8n procese el envío del email con el PDF adjunto.

## 🔧 Parámetros de Entrada

```json
{
  "saleId": "string (requerido)",
  "email": "string (requerido)",
  "subject": "string (opcional)",
  "message": "string (opcional)"
}
```

### Ejemplo de Body

```json
{
  "saleId": "68d6bc80e8e7bad4fd954e1d",
  "email": "pedro@gmail.com",
  "subject": "Gracias por tu compra, Pedro",
  "message": "Estimado Pedro, adjunto encontrará la factura de su compra. Gracias por elegirnos."
}
```

## 📤 Datos Enviados a n8n

El controlador envía el siguiente objeto JSON al webhook de n8n:

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

## 🔍 Validaciones

### 1. **Campos Obligatorios**
- `saleId`: Debe ser un ObjectId válido de MongoDB
- `email`: Debe tener formato de email válido

### 2. **Validación de Email**
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({
    status: "Error",
    message: "Formato de email inválido"
  });
}
```

### 3. **Validación de Venta**
- Verifica que la venta exista en la base de datos
- Si no existe, retorna error 404

## ⚙️ Configuración de Variables de Entorno

```env
N8N_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/send-invoice
BASE_URL=https://back-papeleria-two.vercel.app
```

## 📤 Respuestas

### ✅ **Respuesta Exitosa (200)**

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

### ❌ **Errores Posibles**

#### **400 - Campos Faltantes**
```json
{
  "status": "Error",
  "message": "saleId y email son obligatorios"
}
```

#### **400 - Email Inválido**
```json
{
  "status": "Error",
  "message": "Formato de email inválido"
}
```

#### **404 - Venta No Encontrada**
```json
{
  "status": "Error",
  "message": "Venta no encontrada"
}
```

#### **500 - Error de n8n**
```json
{
  "status": "Error",
  "message": "Error al enviar los datos a n8n",
  "error": "Error enviando a n8n: 500"
}
```

## 🔄 Flujo del Controlador

1. **Validar entrada**: Verificar campos obligatorios y formato de email
2. **Buscar venta**: Consultar la venta en la base de datos
3. **Generar PDF**: Crear PDF en Base64 usando `generateInvoicePDFBase64()`
4. **Preparar datos**: Estructurar objeto con toda la información
5. **Enviar a n8n**: Hacer POST al webhook de n8n
6. **Responder**: Retornar resultado al cliente

## 🎯 Variables Disponibles en n8n

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `nombre` | string | Nombre del cliente | "pedro" |
| `email` | string | Email del cliente | "pedro@gmail.com" |
| `documento` | string | Documento del cliente | "23213213" |
| `telefono` | string | Teléfono del cliente | "3234333333" |
| `codigoFactura` | string | Código de la factura | "VTA-027" |
| `fecha` | string | Fecha de la venta | "26/09/2025" |
| `hora` | string | Hora de la venta | "11:17:04" |
| `total` | number | Total de la venta | 40000 |
| `metodoPago` | string | Método de pago | "Efectivo" |
| `vendedor` | string | Nombre del vendedor | "kevin serna" |
| `emailVendedor` | string | Email del vendedor | "kevinfernandoserna11@gmail.com" |
| `productos` | array | Array de productos | `[{...}]` |
| `pdfBase64` | string | PDF en Base64 | "JVBERi0xLjQK..." |
| `nombreArchivo` | string | Nombre del archivo PDF | "factura-VTA-027.pdf" |
| `pdfUrl` | string | URL directa al PDF | "https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/68d6bc80e8e7bad4fd954e1d" |
| `asunto` | string | Asunto del email | "Gracias por tu compra, Pedro" |
| `mensaje` | string | Mensaje del email | "Estimado Pedro..." |
| `saleId` | string | ID de la venta | "68d6bc80e8e7bad4fd954e1d" |
| `timestamp` | string | Timestamp de envío | "2025-01-26 11:30:45" |

## 🔧 Configuración en n8n

### **Nodo Webhook**
- **Método**: POST
- **URL**: La que configures en `N8N_WEBHOOK_URL`

### **Nodo Convert to File**
- **Input**: `{{ $json.pdfBase64 }}`
- **Filename**: `{{ $json.nombreArchivo }}`

### **Nodo Send Email**
- **To**: `{{ $json.email }}`
- **Subject**: `{{ $json.asunto }}`
- **Message**: `{{ $json.mensaje }}`
- **Attachment**: El archivo convertido

### **Nodo Respond to Webhook**
- **Response**: `{ "success": true, "message": "Email enviado correctamente" }`

## 🧪 Casos de Prueba

### **Caso 1: Envío Exitoso**
```bash
curl -X POST https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-n8n \
  -H "Content-Type: application/json" \
  -d '{
    "saleId": "68d6bc80e8e7bad4fd954e1d",
    "email": "pedro@gmail.com",
    "subject": "Gracias por tu compra",
    "message": "Estimado Pedro, adjunto encontrará la factura."
  }'
```

### **Caso 2: Email Inválido**
```bash
curl -X POST https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-n8n \
  -H "Content-Type: application/json" \
  -d '{
    "saleId": "68d6bc80e8e7bad4fd954e1d",
    "email": "email-invalido"
  }'
```

### **Caso 3: Campos Faltantes**
```bash
curl -X POST https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-n8n \
  -H "Content-Type: application/json" \
  -d '{
    "saleId": "68d6bc80e8e7bad4fd954e1d"
  }'
```

## ⚠️ Consideraciones Importantes

1. **Webhook de n8n**: Debe estar configurado y funcionando
2. **Variables de entorno**: `N8N_WEBHOOK_URL` debe apuntar a tu instancia
3. **Base de datos**: La venta debe existir en la colección `ventas`
4. **PDF**: Se genera en tiempo real, no se almacena
5. **Zona horaria**: Timestamps en zona horaria de Colombia
6. **Error handling**: Manejo robusto de errores de red y n8n

## 🚀 Próximos Pasos

1. **Configurar** la variable `N8N_WEBHOOK_URL` en tu `.env`
2. **Probar** el endpoint con Postman
3. **Configurar** el flujo en n8n
4. **Integrar** en el frontend
5. **Monitorear** logs para errores
