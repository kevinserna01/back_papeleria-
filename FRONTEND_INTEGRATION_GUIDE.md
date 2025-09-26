# 🎯 Guía de Integración Frontend - Envío de Facturas

## 📋 Resumen de Cambios

Se han implementado **3 endpoints nuevos** para el manejo de facturas PDF y envío de emails:

1. **Generar PDF individual** (para mostrar/descargar)
2. **Enviar email directo** (backend envía el email)
3. **Enviar a n8n** (recomendado - n8n maneja el envío)

## 🚀 Endpoints Disponibles

### 1. **Generar PDF de Factura**
```
GET /v1/papeleria/invoice-pdf/:saleId
```
- **Uso**: Mostrar o descargar PDF directamente
- **Respuesta**: Archivo PDF binario
- **Ejemplo**: `https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/68d6bc80e8e7bad4fd954e1d`

### 2. **Enviar Email Directo** (Backend)
```
POST /v1/papeleria/send-invoice-email
```
- **Uso**: Backend envía el email directamente
- **Requiere**: Configuración SMTP en backend

### 3. **Enviar a n8n** (Recomendado)
```
POST /v1/papeleria/send-invoice-n8n
```
- **Uso**: Envía datos a n8n para procesamiento
- **Recomendado**: Más flexible y escalable

## 🎨 Implementación en Frontend

### **Opción 1: Mostrar PDF en Nueva Ventana**

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

### **Opción 2: Descargar PDF Directamente**

```javascript
const downloadInvoicePDF = (saleId) => {
  const pdfUrl = `https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/${saleId}`;
  
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

### **Opción 3: Enviar por Email (n8n - Recomendado)**

```javascript
const sendInvoiceByEmail = async (saleId, email, subject, message) => {
  try {
    const response = await fetch('https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        saleId: saleId,
        email: email,
        subject: subject || `Factura de compra - Papelería Kevin`,
        message: message || `Estimado cliente, adjunto encontrará la factura de su compra.`
      })
    });

    const result = await response.json();
    
    if (result.status === 'Success') {
      alert('Factura enviada por email correctamente');
      return result;
    } else {
      alert('Error enviando la factura: ' + result.message);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
    return null;
  }
};

// Uso en React
const EmailButton = ({ saleId, clientEmail, clientName }) => {
  const handleSendEmail = async () => {
    const subject = `Gracias por tu compra, ${clientName}`;
    const message = `Estimado/a ${clientName}, adjunto encontrará la factura de su compra. Gracias por elegirnos.`;
    
    await sendInvoiceByEmail(saleId, clientEmail, subject, message);
  };

  return (
    <button 
      onClick={handleSendEmail}
      className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
    >
      📧 Enviar por Email
    </button>
  );
};
```

### **Opción 4: Modal con PDF**

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

## 🎯 Componente Completo de Ejemplo

```javascript
import React, { useState } from 'react';

const InvoiceActions = ({ saleId, clientEmail, clientName }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showInvoicePDF = () => {
    const pdfUrl = `https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/${saleId}`;
    window.open(pdfUrl, '_blank');
  };

  const downloadInvoicePDF = () => {
    const pdfUrl = `https://back-papeleria-two.vercel.app/v1/papeleria/invoice-pdf/${saleId}`;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `factura-${saleId}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendInvoiceByEmail = async () => {
    if (!clientEmail) {
      alert('Email del cliente no disponible');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://back-papeleria-two.vercel.app/v1/papeleria/send-invoice-n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: saleId,
          email: clientEmail,
          subject: `Gracias por tu compra, ${clientName}`,
          message: `Estimado/a ${clientName}, adjunto encontrará la factura de su compra. Gracias por elegirnos.`
        })
      });

      const result = await response.json();
      
      if (result.status === 'Success') {
        alert('Factura enviada por email correctamente');
      } else {
        alert('Error enviando la factura: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button 
        onClick={showInvoicePDF}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
      >
        📄 Ver PDF
      </button>
      
      <button 
        onClick={downloadInvoicePDF}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
      >
        💾 Descargar
      </button>
      
      <button 
        onClick={() => setShowModal(true)}
        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 flex items-center gap-2"
      >
        👁️ Ver en Modal
      </button>
      
      {clientEmail && (
        <button 
          onClick={sendInvoiceByEmail}
          disabled={isLoading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? '⏳ Enviando...' : '📧 Enviar Email'}
        </button>
      )}

      <InvoiceModal 
        saleId={saleId}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default InvoiceActions;
```

## 📱 Uso en Lista de Ventas

```javascript
// En tu componente de lista de ventas
const SalesList = ({ sales }) => {
  return (
    <div className="space-y-4">
      {sales.map(sale => (
        <div key={sale._id} className="border p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold">Venta {sale.code}</h3>
              <p>Cliente: {sale.cliente.name}</p>
              <p>Total: ${sale.totalVenta.toLocaleString()}</p>
              <p>Fecha: {new Date(sale.fecha).toLocaleDateString()}</p>
            </div>
            
            <InvoiceActions 
              saleId={sale._id}
              clientEmail={sale.cliente.email}
              clientName={sale.cliente.name}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 🔧 Configuración de Variables de Entorno

Si usas variables de entorno en el frontend:

```env
REACT_APP_API_BASE_URL=https://back-papeleria-two.vercel.app
```

```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://back-papeleria-two.vercel.app';

const showInvoicePDF = (saleId) => {
  const pdfUrl = `${API_BASE_URL}/v1/papeleria/invoice-pdf/${saleId}`;
  window.open(pdfUrl, '_blank');
};
```

## ⚠️ Consideraciones Importantes

1. **CORS**: Ya está configurado en el backend para tu dominio
2. **Errores**: Siempre manejar errores de red y respuestas del servidor
3. **Loading States**: Mostrar indicadores de carga para operaciones asíncronas
4. **Validaciones**: Verificar que el email del cliente esté disponible antes de mostrar el botón de envío
5. **Responsive**: Los botones se adaptan a diferentes tamaños de pantalla

## 🎨 Estilos Sugeridos (Tailwind CSS)

```css
/* Botones de acción */
.invoice-action-btn {
  @apply px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 flex items-center gap-2;
}

.invoice-action-btn:hover {
  @apply transform scale-105;
}

.invoice-action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Modal */
.invoice-modal {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.invoice-modal-content {
  @apply bg-white rounded-lg w-4/5 h-4/5 flex flex-col;
}
```

## 🚀 Próximos Pasos

1. **Implementar** el componente `InvoiceActions` en tu lista de ventas
2. **Probar** con la venta de ejemplo: `68d6bc80e8e7bad4fd954e1d`
3. **Configurar** la variable de entorno `N8N_WEBHOOK_URL` en el backend
4. **Personalizar** los mensajes de email según tus necesidades
5. **Agregar** validaciones adicionales si es necesario

¿Necesitas ayuda con alguna implementación específica o tienes alguna pregunta sobre la integración?
