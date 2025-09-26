# 🔧 Solución de Problemas - n8n Integration

## ❌ Error Actual

```
Status Code: 500 Internal Server Error
Error: "fetch failed"
```

## 🔍 Diagnóstico

### 1. **Probar Conectividad con n8n**

Primero, prueba si el webhook de n8n está funcionando:

```bash
GET https://back-papeleria-two.vercel.app/v1/papeleria/test-n8n-connection
```

**Respuesta Exitosa:**
```json
{
  "status": "Success",
  "message": "Conexión con n8n exitosa",
  "data": {
    "webhookUrl": "https://tu-n8n-instance.com/webhook/send-invoice",
    "n8nResponse": {...},
    "testAt": "2025-01-26 11:30:45"
  }
}
```

**Respuesta de Error:**
```json
{
  "status": "Error",
  "message": "No se pudo conectar con n8n",
  "error": "fetch failed",
  "debug": {
    "webhookUrl": "No configurado",
    "originalError": "fetch failed"
  }
}
```

### 2. **Verificar Configuración de Variables de Entorno**

El error indica que la variable `N8N_WEBHOOK_URL` no está configurada o es incorrecta.

**Configuración Requerida:**
```env
N8N_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/send-invoice
```

## 🛠️ Soluciones

### **Solución 1: Configurar Variable de Entorno**

1. **En Vercel:**
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Agrega: `N8N_WEBHOOK_URL` = `https://tu-n8n-instance.com/webhook/send-invoice`

2. **En archivo .env local:**
   ```env
   N8N_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/send-invoice
   ```

### **Solución 2: Verificar URL del Webhook**

La URL debe ser exactamente la que n8n te proporciona:

**Formato correcto:**
```
https://tu-n8n-instance.com/webhook/send-invoice
```

**Formatos incorrectos:**
```
http://localhost:5678/webhook-test/v1/papeleria/send-invoice-email  ❌
https://n8n.com/webhook/send-invoice  ❌
```

### **Solución 3: Verificar que n8n esté Funcionando**

1. **Accede a tu instancia de n8n**
2. **Verifica que el webhook esté activo**
3. **Prueba el webhook manualmente:**

```bash
curl -X POST https://tu-n8n-instance.com/webhook/send-invoice \
  -H "Content-Type: application/json" \
  -d '{"test": true, "message": "Prueba manual"}'
```

### **Solución 4: Verificar Firewall/Red**

Si n8n está en un servidor privado:
- Verifica que el puerto esté abierto
- Confirma que no haya restricciones de firewall
- Prueba desde otro servidor

## 🧪 Pasos de Diagnóstico

### **Paso 1: Probar Endpoint de Prueba**

```bash
curl -X GET https://back-papeleria-two.vercel.app/v1/papeleria/test-n8n-connection
```

### **Paso 2: Verificar Logs**

Revisa los logs de Vercel para ver:
- ¿Se está enviando la URL correcta?
- ¿Qué error específico está ocurriendo?

### **Paso 3: Probar con Postman**

```bash
POST https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-n8n
Content-Type: application/json

{
  "saleId": "68d6c5a5ab5fab56747c00f9",
  "email": "jose@jose.com",
  "subject": "Prueba",
  "message": "Mensaje de prueba"
}
```

## 🔧 Configuración Temporal

Si n8n no está disponible, puedes usar el endpoint de email directo:

```bash
POST https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-email
Content-Type: application/json

{
  "saleId": "68d6c5a5ab5fab56747c00f9",
  "email": "jose@jose.com",
  "subject": "Gracias por tu compra, jose",
  "message": "Estimado jose, adjunto encontrará la factura de su compra (VTA-031). Gracias por elegirnos."
}
```

**Nota:** Este endpoint requiere configuración SMTP en las variables de entorno.

## 📋 Checklist de Verificación

- [ ] Variable `N8N_WEBHOOK_URL` configurada en Vercel
- [ ] URL del webhook es correcta y accesible
- [ ] n8n está funcionando y el webhook está activo
- [ ] No hay restricciones de firewall
- [ ] El webhook responde a pruebas manuales
- [ ] Los logs muestran la URL correcta

## 🚨 Errores Comunes

### **Error: "fetch failed"**
- **Causa:** URL incorrecta o n8n no disponible
- **Solución:** Verificar URL y conectividad

### **Error: "ECONNREFUSED"**
- **Causa:** n8n no está funcionando
- **Solución:** Iniciar n8n o verificar la URL

### **Error: "timeout"**
- **Causa:** n8n tarda demasiado en responder
- **Solución:** Verificar la carga de n8n

### **Error: "No configurado"**
- **Causa:** Variable de entorno no configurada
- **Solución:** Configurar `N8N_WEBHOOK_URL`

## 📞 Próximos Pasos

1. **Configura** la variable `N8N_WEBHOOK_URL` en Vercel
2. **Prueba** el endpoint de prueba: `/test-n8n-connection`
3. **Verifica** que n8n esté funcionando
4. **Prueba** el envío de email nuevamente

¿Necesitas ayuda con algún paso específico?
