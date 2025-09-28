# 💰 Sistema de Abonos Flexibles

## 🎯 Descripción General

Sistema mejorado de abonos que permite máxima flexibilidad para el manejo de pagos a plazos. Los trabajadores pueden crear planes de abonos sin valores específicos ni fechas exactas, y los administradores pueden editar cualquier abono desde el panel administrativo.

---

## ✨ Nuevas Características

### **1. Abonos Flexibles en la Venta**
- ✅ **Valores en 0**: Los abonos pueden tener monto 0 (se calculan automáticamente)
- ✅ **Fechas automáticas**: Si no se especifica fecha, se asigna automáticamente cada mes
- ✅ **Cálculo inteligente**: El sistema distribuye el monto restante entre abonos flexibles
- ✅ **Flexibilidad total**: Mezcla de abonos con monto fijo y abonos flexibles

### **2. Edición desde Panel Admin**
- ✅ **Editar cualquier abono**: Montos, fechas, observaciones
- ✅ **Ajuste automático**: El sistema ajusta el último abono si hay diferencias
- ✅ **Preservar pagos**: Mantiene abonos ya pagados intactos
- ✅ **Validaciones inteligentes**: Previene ediciones incorrectas

---

## 🛠️ APIs Implementadas

### 1. **Crear Venta con Abonos Flexibles** `POST /v1/papeleria/createSaleapi`

#### **Request Body:**
```json
{
  "code": "VTA-001",
  "productos": [
    {
      "code": "PROD001",
      "cantidad": 2,
      "precioUnitario": 50000
    }
  ],
  "metodoPago": "Credito",
  "cliente": {
    "name": "Juan Pérez",
    "document": "12345678",
    "email": "juan@email.com",
    "phone": "3001234567"
  },
  "trabajador": {
    "correo": "vendedor@papeleria.com",
    "nombre": "María García"
  },
  "totalVenta": 100000,
  "tipoVenta": "financiado",
  "planAbonos": [
    {
      "monto": 0,  // ← FLEXIBLE: Se calculará automáticamente
      "fechaProgramada": null,  // ← FLEXIBLE: Se asignará automáticamente
      "observaciones": "Cliente pagará en 4 partes"
    },
    {
      "monto": 0,  // ← FLEXIBLE
      "fechaProgramada": null,  // ← FLEXIBLE
      "observaciones": "Sin fecha específica"
    },
    {
      "monto": 0,  // ← FLEXIBLE
      "fechaProgramada": null,  // ← FLEXIBLE
      "observaciones": "A convenir"
    },
    {
      "monto": 0,  // ← FLEXIBLE
      "fechaProgramada": null,  // ← FLEXIBLE
      "observaciones": "Último abono"
    }
  ],
  "diasVencimiento": 30,
  "observaciones": "Venta a 4 cuotas flexibles"
}
```

#### **Procesamiento Automático:**
```json
{
  "planAbonos": [
    {
      "numero": 1,
      "monto": 25000,  // ← Calculado automáticamente
      "fechaProgramada": "2024-10-28T00:00:00.000Z",  // ← Asignada automáticamente
      "estado": "pendiente",
      "observaciones": "Cliente pagará en 4 partes",
      "esFlexible": true
    },
    {
      "numero": 2,
      "monto": 25000,  // ← Calculado automáticamente
      "fechaProgramada": "2024-11-28T00:00:00.000Z",  // ← Asignada automáticamente
      "estado": "pendiente",
      "observaciones": "Sin fecha específica",
      "esFlexible": true
    },
    {
      "numero": 3,
      "monto": 25000,  // ← Calculado automáticamente
      "fechaProgramada": "2024-12-28T00:00:00.000Z",  // ← Asignada automáticamente
      "estado": "pendiente",
      "observaciones": "A convenir",
      "esFlexible": true
    },
    {
      "numero": 4,
      "monto": 25000,  // ← Calculado automáticamente
      "fechaProgramada": "2025-01-28T00:00:00.000Z",  // ← Asignada automáticamente
      "estado": "pendiente",
      "observaciones": "Último abono",
      "esFlexible": true
    }
  ]
}
```

---

### 2. **Editar Plan de Abonos** `PUT /v1/papeleria/editar-plan-abonos`

#### **Request Body:**
```json
{
  "facturaId": "507f1f77bcf86cd799439011",
  "abonos": [
    {
      "numero": 1,
      "monto": 30000,  // ← Editado por admin
      "fechaProgramada": "2024-10-15T00:00:00.000Z",  // ← Editado por admin
      "estado": "pendiente",
      "observaciones": "Cliente pagará el 15 de octubre",
      "esFlexible": false
    },
    {
      "numero": 2,
      "monto": 0,  // ← Admin deja en 0 para flexibilidad
      "fechaProgramada": "2024-11-15T00:00:00.000Z",
      "estado": "pendiente",
      "observaciones": "A convenir con cliente",
      "esFlexible": true
    },
    {
      "numero": 3,
      "monto": 0,  // ← Admin deja en 0
      "fechaProgramada": "2024-12-15T00:00:00.000Z",
      "estado": "pendiente",
      "observaciones": "A convenir con cliente",
      "esFlexible": true
    },
    {
      "numero": 4,
      "monto": 40000,  // ← Admin ajusta para completar total
      "fechaProgramada": "2025-01-15T00:00:00.000Z",
      "estado": "pendiente",
      "observaciones": "Último abono ajustado",
      "esFlexible": false
    }
  ]
}
```

#### **Response:**
```json
{
  "status": "Success",
  "message": "Plan de abonos actualizado correctamente.",
  "data": {
    "facturaId": "507f1f77bcf86cd799439011",
    "abonos": [
      {
        "numero": 1,
        "monto": 30000,
        "fechaProgramada": "2024-10-15T00:00:00.000Z",
        "estado": "pendiente",
        "observaciones": "Cliente pagará el 15 de octubre",
        "esFlexible": false
      },
      {
        "numero": 2,
        "monto": 0,
        "fechaProgramada": "2024-11-15T00:00:00.000Z",
        "estado": "pendiente",
        "observaciones": "A convenir con cliente",
        "esFlexible": true
      },
      {
        "numero": 3,
        "monto": 0,
        "fechaProgramada": "2024-12-15T00:00:00.000Z",
        "estado": "pendiente",
        "observaciones": "A convenir con cliente",
        "esFlexible": true
      },
      {
        "numero": 4,
        "monto": 40000,
        "fechaProgramada": "2025-01-15T00:00:00.000Z",
        "estado": "pendiente",
        "observaciones": "Último abono ajustado",
        "esFlexible": false
      }
    ],
    "totalAbonos": 70000,
    "totalFactura": 100000,
    "diferencia": 30000
  }
}
```

---

## 🎯 Casos de Uso Reales

### **Caso 1: Cliente dice "8 cuotas sin fecha específica"**
```json
{
  "tipoVenta": "financiado",
  "planAbonos": [
    { "monto": 0, "observaciones": "Cuota 1" },
    { "monto": 0, "observaciones": "Cuota 2" },
    { "monto": 0, "observaciones": "Cuota 3" },
    { "monto": 0, "observaciones": "Cuota 4" },
    { "monto": 0, "observaciones": "Cuota 5" },
    { "monto": 0, "observaciones": "Cuota 6" },
    { "monto": 0, "observaciones": "Cuota 7" },
    { "monto": 0, "observaciones": "Cuota 8" }
  ]
}
```

**Resultado:** Sistema asigna $12,500 a cada cuota y fechas cada mes.

### **Caso 2: Cliente dice "Pago $50,000 el primer mes, el resto en 3 cuotas"**
```json
{
  "tipoVenta": "financiado",
  "planAbonos": [
    { 
      "monto": 50000, 
      "fechaProgramada": "2024-10-15T00:00:00.000Z",
      "observaciones": "Primer pago confirmado" 
    },
    { "monto": 0, "observaciones": "Cuota 2" },
    { "monto": 0, "observaciones": "Cuota 3" },
    { "monto": 0, "observaciones": "Cuota 4" }
  ]
}
```

**Resultado:** Sistema asigna $16,666.67 a cada cuota restante.

### **Caso 3: Admin edita después de hablar con cliente**
```json
{
  "facturaId": "507f1f77bcf86cd799439011",
  "abonos": [
    {
      "numero": 1,
      "monto": 50000,
      "fechaProgramada": "2024-10-15T00:00:00.000Z",
      "estado": "pagado",  // ← Ya pagado
      "observaciones": "Pagado el 15 de octubre"
    },
    {
      "numero": 2,
      "monto": 0,  // ← Cliente no sabe cuándo puede pagar
      "fechaProgramada": "2024-11-15T00:00:00.000Z",
      "estado": "pendiente",
      "observaciones": "Cliente pagará cuando pueda"
    },
    {
      "numero": 3,
      "monto": 0,
      "fechaProgramada": "2024-12-15T00:00:00.000Z",
      "estado": "pendiente",
      "observaciones": "A convenir"
    },
    {
      "numero": 4,
      "monto": 50000,  // ← Admin ajusta para completar
      "fechaProgramada": "2025-01-15T00:00:00.000Z",
      "estado": "pendiente",
      "observaciones": "Último abono"
    }
  ]
}
```

---

## 🔧 Funcionalidades del Panel Admin

### **1. Vista de Abonos Flexibles**
```javascript
// En el dashboard, los abonos flexibles se muestran así:
{
  "abonos": [
    {
      "numero": 1,
      "monto": 25000,
      "fechaProgramada": "2024-10-28T00:00:00.000Z",
      "estado": "pendiente",
      "observaciones": "Cliente pagará en 4 partes",
      "esFlexible": true,  // ← Indicador visual
      "puedeEditar": true
    }
  ]
}
```

### **2. Editor de Abonos**
```javascript
// El admin puede editar cualquier campo:
const editarAbono = async (facturaId, abonos) => {
  const response = await fetch('/v1/papeleria/editar-plan-abonos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      facturaId: facturaId,
      abonos: abonos
    })
  });
  
  return await response.json();
};
```

### **3. Validaciones Inteligentes**
- ✅ **Preserva abonos pagados**: No permite editar abonos ya pagados
- ✅ **Ajuste automático**: Si hay diferencia, ajusta el último abono pendiente
- ✅ **Validación de totales**: Asegura que la suma coincida con el total de la factura
- ✅ **Fechas lógicas**: Previene fechas muy antiguas

---

## 📊 Estados de Abonos

### **Estados Posibles:**
- **`pendiente`**: Abono programado, no pagado
- **`pagado`**: Abono confirmado y pagado
- **`vencido`**: Abono pendiente después de la fecha programada

### **Indicadores Visuales:**
```javascript
const getEstadoAbono = (abono) => {
  if (abono.estado === 'pagado') {
    return { icon: '✅', color: 'green', text: 'Pagado' };
  }
  
  if (abono.estado === 'pendiente') {
    const hoy = new Date();
    const fechaAbono = new Date(abono.fechaProgramada);
    
    if (fechaAbono < hoy) {
      return { icon: '⚠️', color: 'red', text: 'Vencido' };
    } else {
      return { icon: '⏳', color: 'orange', text: 'Pendiente' };
    }
  }
  
  return { icon: '❓', color: 'gray', text: 'Desconocido' };
};
```

---

## 🚀 Beneficios del Sistema

### **Para el Trabajador:**
- ✅ **Rapidez**: Crea planes de abonos sin cálculos complejos
- ✅ **Flexibilidad**: No necesita fechas exactas ni montos específicos
- ✅ **Simplicidad**: Solo especifica cuántas cuotas quiere el cliente

### **Para el Administrador:**
- ✅ **Control total**: Puede editar cualquier abono en cualquier momento
- ✅ **Adaptabilidad**: Se ajusta a los cambios del cliente
- ✅ **Trazabilidad**: Mantiene historial de todos los cambios

### **Para el Cliente:**
- ✅ **Comodidad**: Puede pagar cuando le convenga (dentro de lo razonable)
- ✅ **Transparencia**: Ve claramente su plan de pagos
- ✅ **Flexibilidad**: Puede ajustar fechas y montos con el admin

---

## 📝 Ejemplos de Uso en Frontend

### **1. Formulario de Venta Flexible**
```jsx
const VentaForm = () => {
  const [planAbonos, setPlanAbonos] = useState([]);
  const [numeroCuotas, setNumeroCuotas] = useState(4);

  const generarAbonosFlexibles = () => {
    const abonos = [];
    for (let i = 0; i < numeroCuotas; i++) {
      abonos.push({
        monto: 0,  // ← Flexible
        fechaProgramada: null,  // ← Flexible
        observaciones: `Cuota ${i + 1}`,
        esFlexible: true
      });
    }
    setPlanAbonos(abonos);
  };

  return (
    <div>
      <label>Número de cuotas:</label>
      <input 
        type="number" 
        value={numeroCuotas}
        onChange={(e) => setNumeroCuotas(e.target.value)}
      />
      <button onClick={generarAbonosFlexibles}>
        Generar Plan Flexible
      </button>
      
      {planAbonos.map((abono, index) => (
        <div key={index} className="abono-item">
          <span>Cuota {index + 1}</span>
          <input 
            type="number" 
            placeholder="Monto (0 = flexible)"
            value={abono.monto || ''}
            onChange={(e) => {
              const nuevosAbonos = [...planAbonos];
              nuevosAbonos[index].monto = Number(e.target.value) || 0;
              setPlanAbonos(nuevosAbonos);
            }}
          />
          <input 
            type="date"
            placeholder="Fecha (opcional)"
            onChange={(e) => {
              const nuevosAbonos = [...planAbonos];
              nuevosAbonos[index].fechaProgramada = e.target.value;
              setPlanAbonos(nuevosAbonos);
            }}
          />
        </div>
      ))}
    </div>
  );
};
```

### **2. Editor de Abonos en Panel Admin**
```jsx
const EditorAbonos = ({ facturaId, abonos, onSave }) => {
  const [abonosEditados, setAbonosEditados] = useState(abonos);

  const guardarCambios = async () => {
    try {
      const response = await fetch('/v1/papeleria/editar-plan-abonos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facturaId: facturaId,
          abonos: abonosEditados
        })
      });
      
      const result = await response.json();
      if (result.status === 'Success') {
        onSave(result.data);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  return (
    <div className="editor-abonos">
      <h3>Editar Plan de Abonos</h3>
      {abonosEditados.map((abono, index) => (
        <div key={index} className={`abono-editor ${abono.estado === 'pagado' ? 'pagado' : ''}`}>
          <div className="abono-header">
            <span>Abono {abono.numero}</span>
            <span className={`estado ${abono.estado}`}>
              {abono.estado === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}
            </span>
          </div>
          
          <div className="abono-fields">
            <input
              type="number"
              placeholder="Monto"
              value={abono.monto || ''}
              disabled={abono.estado === 'pagado'}  // ← No editar si ya está pagado
              onChange={(e) => {
                const nuevosAbonos = [...abonosEditados];
                nuevosAbonos[index].monto = Number(e.target.value) || 0;
                setAbonosEditados(nuevosAbonos);
              }}
            />
            
            <input
              type="date"
              value={abono.fechaProgramada ? abono.fechaProgramada.split('T')[0] : ''}
              disabled={abono.estado === 'pagado'}
              onChange={(e) => {
                const nuevosAbonos = [...abonosEditados];
                nuevosAbonos[index].fechaProgramada = e.target.value;
                setAbonosEditados(nuevosAbonos);
              }}
            />
            
            <input
              type="text"
              placeholder="Observaciones"
              value={abono.observaciones || ''}
              onChange={(e) => {
                const nuevosAbonos = [...abonosEditados];
                nuevosAbonos[index].observaciones = e.target.value;
                setAbonosEditados(nuevosAbonos);
              }}
            />
          </div>
        </div>
      ))}
      
      <button onClick={guardarCambios} className="btn-guardar">
        Guardar Cambios
      </button>
    </div>
  );
};
```

---

## 🎯 Resumen de Mejoras

### **✅ Implementado:**
1. **Abonos con monto 0** (se calculan automáticamente)
2. **Fechas automáticas** (cada mes si no se especifica)
3. **Cálculo inteligente** de montos restantes
4. **Edición completa** desde panel admin
5. **Preservación de abonos pagados**
6. **Ajuste automático** de diferencias
7. **Validaciones robustas**

### **🚀 Beneficios:**
- **Máxima flexibilidad** para trabajadores y clientes
- **Control total** para administradores
- **Simplicidad** en la creación de planes
- **Adaptabilidad** a cambios del cliente
- **Trazabilidad** completa de modificaciones

¡El sistema de abonos ahora es completamente flexible y se adapta a cualquier situación real de ventas! 💰✨
