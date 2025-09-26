# 📄 Generación de PDF de Facturas - Guía de Uso

## 🚀 Endpoint Implementado

```
GET /v1/papeleria/invoice-pdf/:saleId
```

## 📋 Descripción

Este endpoint genera un PDF profesional de la factura basado en el ID de la venta. El PDF incluye toda la información de la venta, cliente, productos y totales.

## 🔧 Parámetros

- `saleId` (string, requerido): ID de la venta en MongoDB

## 📤 Respuesta

- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename=factura-{code}.pdf`
- **Body**: Archivo PDF binario

## 💻 Ejemplos de Uso en Frontend

### 1. Mostrar PDF en Nueva Ventana

```javascript
const showInvoicePDF = (saleId) => {
  const pdfUrl = `https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/${saleId}`;
  window.open(pdfUrl, '_blank');
};

// Uso en React
const InvoiceButton = ({ saleId }) => {
  return (
    <button 
      onClick={() => showInvoicePDF(saleId)}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      📄 Ver Factura PDF
    </button>
  );
};
```

### 2. Descargar PDF Directamente

```javascript
const downloadInvoicePDF = (saleId) => {
  const pdfUrl = `https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/${saleId}`;
  
  // Crear elemento de descarga
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `factura-${saleId}.pdf`;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Uso en React
const DownloadButton = ({ saleId }) => {
  return (
    <button 
      onClick={() => downloadInvoicePDF(saleId)}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    >
      💾 Descargar PDF
    </button>
  );
};
```

### 3. Mostrar PDF en Modal/Iframe

```javascript
const InvoiceModal = ({ saleId, isOpen, onClose }) => {
  if (!isOpen) return null;

  const pdfUrl = `https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/${saleId}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-4/5 h-4/5 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Factura PDF</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <iframe 
          src={pdfUrl}
          className="flex-1 w-full"
          title="Factura PDF"
        />
      </div>
    </div>
  );
};
```

### 4. Enviar PDF por Email (Integración Futura)

```javascript
const sendInvoiceByEmail = async (saleId, email) => {
  try {
    const response = await fetch(`https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        saleId: saleId,
        email: email
      })
    });

    const result = await response.json();
    
    if (result.status === 'Success') {
      alert('Factura enviada por email correctamente');
    } else {
      alert('Error enviando la factura');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
};
```

## 🎨 Estructura del PDF Generado

El PDF incluye las siguientes secciones:

1. **Encabezado**
   - Título: "FACTURA DE VENTA"
   - Información de la empresa (PAPELERÍA KEVIN)
   - NIT, dirección, teléfono

2. **Información de la Factura**
   - Número de factura (VTA-{code})
   - Fecha y hora de la venta

3. **Datos del Cliente**
   - Nombre, documento, email, teléfono

4. **Información del Vendedor**
   - Nombre y email del trabajador

5. **Detalle de Productos**
   - Tabla con código, producto, cantidad, precio unitario y total

6. **Totales**
   - Subtotal, descuentos (si aplica), total final

7. **Método de Pago**
   - Efectivo, Nequi, Transferencia

8. **Pie de Página**
   - Mensaje de agradecimiento

## 🔗 URL Completa del Endpoint

```
https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/{saleId}
```

## ⚠️ Consideraciones

- El `saleId` debe ser un ObjectId válido de MongoDB
- Si la venta no existe, se devuelve un error 404
- El PDF se genera en tiempo real
- El archivo se descarga automáticamente con el nombre `factura-{code}.pdf`

## 🧪 Ejemplo de Prueba

Para probar el endpoint con la venta del ejemplo:

```
GET https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/68d6bc80e8e7bad4fd954e1d
```

Esto generará un PDF de la factura VTA-027 con todos los detalles de la venta.
