# Sistema de Abonos - Cambios y Mejoras

## Resumen de Cambios

Este documento describe específicamente las mejoras implementadas en el sistema de abonos, incluyendo la sugerencia automática de montos y la corrección de bugs en el cálculo de totales pagados.

## 🚀 Nueva Funcionalidad: Sugerencia Automática de Montos

### Problema Resuelto
- **Antes**: Los usuarios tenían que calcular manualmente cómo dividir el total de la venta entre los abonos
- **Ahora**: El sistema sugiere automáticamente los montos dividiendo equitativamente el monto restante

### Nueva API Endpoint

**`POST /v1/papeleria/suggest-payment-amounts`**

#### Request Body
```json
{
  "facturaId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "numeroAbonos": 3,
  "abonosExistentes": [
    {
      "numero": 1,
      "monto": 30000
    }
  ]
}
```

#### Response
```json
{
  "status": "Success",
  "message": "Sugerencias de montos generadas correctamente",
  "data": {
    "facturaId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "totalFactura": 90000,
    "montoAsignado": 30000,
    "montoDisponible": 60000,
    "abonosExistentes": 1,
    "abonosRestantes": 2,
    "sugerencias": [
      {
        "numero": 2,
        "monto": 30000,
        "fechaProgramada": "2024-02-15T00:00:00.000Z",
        "estado": "pendiente",
        "observaciones": "Abono 2",
        "esFlexible": true
      },
      {
        "numero": 3,
        "monto": 30000,
        "fechaProgramada": "2024-03-17T00:00:00.000Z",
        "estado": "pendiente",
        "observaciones": "Abono 3",
        "esFlexible": true
      }
    ],
    "totalSugerido": 60000,
    "diferencia": 0
  }
}
```

### Características de la Sugerencia

- **Distribución Equitativa**: Divide el monto restante entre los abonos pendientes
- **Manejo de Residuos**: El residuo se asigna al último abono para evitar centavos
- **Fechas Automáticas**: Sugiere fechas con 30 días de diferencia entre abonos
- **Validaciones**: Verifica que no se exceda el total de la factura
- **Flexibilidad**: Los abonos sugeridos son marcados como flexibles
- **Filtrado Inteligente**: Solo considera abonos con monto > 0 como existentes

### Manejo Dinámico de Abonos Variables

El sistema ahora maneja dinámicamente abonos con montos variables, recalculando automáticamente los abonos restantes:

```javascript
// Ejemplo 1: Abonos iniciales
{
  "facturaId": "68db4ac6a52364fa24ceea0a",
  "numeroAbonos": 4,
  "abonosExistentes": [
    { "numero": 1, "monto": 10000 },  // Abono asignado
    { "numero": 2, "monto": 0 },      // Abono pendiente
    { "numero": 3, "monto": 0 },      // Abono pendiente
    { "numero": 4, "monto": 0 }       // Abono pendiente
  ]
}

// Ejemplo 2: Después de asignar montos parciales
{
  "facturaId": "68db4ac6a52364fa24ceea0a",
  "numeroAbonos": 4,
  "abonosExistentes": [
    { "numero": 1, "monto": 250000 }, // Abono asignado
    { "numero": 2, "monto": 100000 }, // Abono asignado
    { "numero": 3, "monto": 0 },      // Abono pendiente
    { "numero": 4, "monto": 0 }       // Abono pendiente
  ]
}
```

**Lógica Dinámica Avanzada:**
- **Separación por Estado**: Distingue entre abonos pagados (fijos) y pendientes (modificables)
- **Cálculo Inteligente**: Suma abonos pagados + abonos pendientes con monto para calcular el total asignado
- **Sugerencias Inteligentes**: 
  - Abonos pagados: No se modifican (fijos)
  - Abonos pendientes sin monto: Se sugieren nuevos montos
  - Abonos pendientes con monto: Se recalculan según el monto restante
- **Recálculo Automático**: Recalcula el monto disponible basándose en el total de la factura
- **Flexibilidad Total**: Permite cualquier combinación de estados y montos

### Casos de Uso Reales

#### Caso 1: Factura de $400,000 con primer abono de $250,000
```javascript
// Request
{
  "facturaId": "68db4ac6a52364fa24ceea0a",
  "numeroAbonos": 3,
  "abonosExistentes": [
    { "numero": 1, "monto": 250000 }, // Abono asignado
    { "numero": 2, "monto": 0 },      // Pendiente
    { "numero": 3, "monto": 0 }       // Pendiente
  ]
}

// Response
{
  "data": {
    "totalFactura": 400000,
    "montoAsignado": 250000,
    "montoDisponible": 150000,
    "abonosPendientes": 2,
    "sugerencias": [
      { "numero": 2, "monto": 75000 },
      { "numero": 3, "monto": 75000 }
    ]
  }
}
```

#### Caso 2: Después de agregar $100,000 al segundo abono
```javascript
// Request
{
  "facturaId": "68db4ac6a52364fa24ceea0a",
  "numeroAbonos": 3,
  "abonosExistentes": [
    { "numero": 1, "monto": 250000 }, // Abono asignado
    { "numero": 2, "monto": 100000 }, // Abono asignado
    { "numero": 3, "monto": 0 }       // Pendiente
  ]
}

// Response
{
  "data": {
    "totalFactura": 400000,
    "montoAsignado": 350000,
    "montoDisponible": 50000,
    "abonosPendientes": 1,
    "sugerencias": [
      { "numero": 3, "monto": 50000 }
    ]
  }
}
```

#### Caso 3: Con abonos pagados (fijos) y pendientes (modificables)
```javascript
// Request
{
  "facturaId": "68db4ac6a52364fa24ceea0a",
  "numeroAbonos": 4,
  "abonosExistentes": [
    { "numero": 1, "monto": 200000, "estado": "pagado" },    // Fijo - no modificable
    { "numero": 2, "monto": 50000, "estado": "pendiente" },  // Modificable - se recalcula
    { "numero": 3, "monto": 0, "estado": "pendiente" },      // Modificable - nueva sugerencia
    { "numero": 4, "monto": 0, "estado": "pendiente" }       // Modificable - nueva sugerencia
  ]
}

// Response
{
  "data": {
    "totalFactura": 400000,
    "montoAbonosPagados": 200000,
    "montoAbonosPendientesAsignados": 50000,
    "montoAsignado": 250000,
    "montoDisponible": 150000,
    "abonosPagados": 1,
    "abonosPendientes": 3,
    "abonosParaSugerir": 3,
    "sugerencias": [
      { 
        "numero": 1, 
        "monto": 200000, 
        "estado": "pagado", 
        "puedeModificar": false,
        "observaciones": "Abono 1 (pagado - no modificable)"
      },
      { 
        "numero": 2, 
        "monto": 50000, 
        "montoAnterior": 50000,
        "esRecalculo": true,
        "estado": "pendiente", 
        "puedeModificar": true,
        "observaciones": "Abono 2 (recalculado)"
      },
      { 
        "numero": 3, 
        "monto": 50000, 
        "estado": "pendiente", 
        "puedeModificar": true,
        "observaciones": "Abono 3"
      },
      { 
        "numero": 4, 
        "monto": 50000, 
        "estado": "pendiente", 
        "puedeModificar": true,
        "observaciones": "Abono 4"
      }
    ],
    "resumen": {
      "abonosFijos": 1,
      "abonosModificables": 3,
      "abonosNuevos": 2,
      "abonosRecalculados": 1
    }
  }
}
```

## 🐛 Corrección de Bug: Total Pagado

### Problema Identificado
- Los abonos estaban marcados como "PAGADO" pero el "Total Pagado" seguía en $0
- El estado general permanecía "pendiente" cuando debería ser "pagado"

### Solución Implementada

#### Código de Corrección en `getInvoiceWithPaymentPlan`
```javascript
// Calcular estadísticas del plan de abonos
const totalPagadoReales = abonosReales.reduce((sum, a) => sum + a.montoPagado, 0);
const totalPagadoPlan = factura.planAbonos?.filter(a => a.estado === 'pagado').reduce((sum, a) => sum + (a.montoPagado || a.monto), 0) || 0;

// Usar el mayor entre los abonos reales y los del plan
const totalPagado = Math.max(totalPagadoReales, totalPagadoPlan);

const estadisticasPlan = {
  totalAbonos: factura.planAbonos?.length || 0,
  abonosPagados: factura.planAbonos?.filter(a => a.estado === 'pagado').length || 0,
  abonosPendientes: factura.planAbonos?.filter(a => a.estado === 'pendiente').length || 0,
  abonosVencidos: factura.planAbonos?.filter(a => 
    a.estado === 'pendiente' && new Date(a.fechaProgramada) < new Date()
  ).length || 0,
  totalPlaneado: factura.planAbonos?.reduce((sum, a) => sum + a.monto, 0) || 0,
  totalPagado: totalPagado,
  diferenciaPagos: abonosReales.reduce((sum, a) => sum + (a.diferencia || 0), 0),
  abonosLibres: abonosReales.filter(a => a.esAbonoLibre).length,
  saldoPendiente: factura.total - totalPagado
};
```

### Mejoras en el Cálculo

1. **Cálculo Dual**: Calcula el total pagado tanto desde la colección `abonos` como desde el plan de abonos
2. **Validación Cruzada**: Usa el mayor valor entre ambos para asegurar precisión
3. **Campo Adicional**: Agrega `saldoPendiente` calculado correctamente
4. **Sincronización**: Mantiene consistencia entre diferentes fuentes de datos

## 🧪 Casos de Uso Prácticos

### 1. Creación de Plan de Abonos con Sugerencias

#### Escenario: Factura de $90,000 con 3 abonos

**Paso 1: Sugerencia inicial**
```javascript
const sugerenciaInicial = await fetch('/suggest-payment-amounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    facturaId: '64f8a1b2c3d4e5f6a7b8c9d0',
    numeroAbonos: 3,
    abonosExistentes: []
  })
});

// Resultado: 3 abonos de $30,000 cada uno
```

**Paso 2: Usuario modifica el primer abono a $40,000**
```javascript
const sugerenciaActualizada = await fetch('/suggest-payment-amounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    facturaId: '64f8a1b2c3d4e5f6a7b8c9d0',
    numeroAbonos: 3,
    abonosExistentes: [
      { numero: 1, monto: 40000 }
    ]
  })
});

// Resultado: 2 abonos de $25,000 cada uno
```

### 2. Flujo de Integración en Frontend

#### Implementación Sugerida

```javascript
class PaymentPlanManager {
  constructor(facturaId, totalFactura) {
    this.facturaId = facturaId;
    this.totalFactura = totalFactura;
    this.abonosExistentes = [];
  }

  async agregarAbono(monto, numero) {
    // Agregar abono a la lista existente
    this.abonosExistentes.push({ numero, monto });
    
    // Obtener sugerencias para abonos restantes
    const sugerencias = await this.obtenerSugerencias();
    
    return sugerencias;
  }

  async obtenerSugerencias() {
    const response = await fetch('/suggest-payment-amounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facturaId: this.facturaId,
        numeroAbonos: this.numeroAbonosDeseados,
        abonosExistentes: this.abonosExistentes
      })
    });

    return await response.json();
  }
}
```

## 🔧 Mejoras Técnicas Implementadas

### 1. Función `suggestPaymentAmounts`

#### Características Principales
- **Validación de entrada**: Verifica facturaId y numeroAbonos
- **Cálculo inteligente**: Distribuye equitativamente el monto restante
- **Manejo de residuos**: Asigna el residuo al último abono
- **Fechas automáticas**: Genera fechas con 30 días de diferencia
- **Validaciones**: Previene exceder el total de la factura

#### Algoritmo de Distribución
```javascript
// Calcular monto base por abono
const montoBase = Math.floor(montoDisponible / abonosRestantes);
const residuo = montoDisponible - (montoBase * abonosRestantes);

// Generar sugerencias
for (let i = 0; i < abonosRestantes; i++) {
  let monto = montoBase;
  
  // Agregar el residuo al último abono
  if (i === abonosRestantes - 1) {
    monto += residuo;
  }
  
  sugerencias.push({
    numero: abonosExistentes.length + i + 1,
    monto: monto,
    fechaProgramada: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
    estado: 'pendiente',
    observaciones: `Abono ${abonosExistentes.length + i + 1}`,
    esFlexible: true
  });
}
```

### 2. Corrección en `getInvoiceWithPaymentPlan`

#### Problema Resuelto
- **Antes**: Solo calculaba desde abonos reales
- **Ahora**: Calcula desde ambas fuentes y usa el mayor valor

#### Beneficios
- **Precisión**: Evita discrepancias entre plan y abonos reales
- **Consistencia**: Mantiene sincronización de datos
- **Robustez**: Maneja casos edge donde una fuente puede estar desactualizada

## 📊 Validaciones y Seguridad

### Validaciones Implementadas

1. **Monto Total**: No permite que la suma de abonos exceda el total de la factura
2. **Abonos Restantes**: Verifica que haya abonos pendientes para sugerir
3. **Monto Disponible**: Valida que haya monto disponible para distribuir
4. **ObjectId**: Valida formato de ID de factura

### Manejo de Errores

```javascript
// Validaciones de entrada
if (!facturaId || !numeroAbonos) {
  return res.status(400).json({
    status: "Error",
    message: "facturaId y numeroAbonos son requeridos"
  });
}

if (abonosRestantes <= 0) {
  return res.status(400).json({
    status: "Error",
    message: "No hay abonos restantes para sugerir"
  });
}

if (montoDisponible <= 0) {
  return res.status(400).json({
    status: "Error",
    message: "El monto total ya ha sido asignado a los abonos existentes"
  });
}
```

## 🚀 Implementación en Frontend

### Botón "Auto" Sugerido

```html
<button id="btn-auto-sugerencias" class="btn-auto">
  <i class="icon-lightning"></i>
  <i class="icon-play"></i>
  Auto
</button>
```

```javascript
document.getElementById('btn-auto-sugerencias').addEventListener('click', async () => {
  const abonosExistentes = obtenerAbonosExistentes();
  const numeroAbonos = obtenerNumeroAbonosDeseados();
  
  try {
    const response = await fetch('/suggest-payment-amounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facturaId: facturaId,
        numeroAbonos: numeroAbonos,
        abonosExistentes: abonosExistentes
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'Success') {
      // Aplicar sugerencias a la interfaz
      aplicarSugerencias(data.data.sugerencias);
    }
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
  }
});
```

## 📋 Resumen de Endpoints

### Nuevos Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/suggest-payment-amounts` | POST | Sugiere montos automáticamente para plan de abonos |

### Endpoints Modificados

| Endpoint | Cambio | Descripción |
|----------|--------|-------------|
| `/facturas-plan/:id` | Mejorado | Corregido cálculo de total pagado y saldo pendiente |

## 🔄 Flujo de Trabajo Mejorado

### Antes
1. Usuario crea plan de abonos
2. Calcula manualmente montos
3. Ingresa montos uno por uno
4. Verifica que sumen el total correcto

### Ahora
1. Usuario crea plan de abonos
2. Presiona botón "Auto" para sugerencias
3. Sistema calcula automáticamente montos equitativos
4. Usuario puede ajustar si es necesario
5. Sistema valida automáticamente el total

## 📝 Notas de Implementación

- **Retrocompatibilidad**: Todos los cambios son compatibles con el código existente
- **Validaciones**: Se agregaron validaciones adicionales sin afectar funcionalidad existente
- **Performance**: Los cálculos son eficientes y no impactan el rendimiento
- **Mantenibilidad**: El código está bien documentado y es fácil de mantener

---

**Fecha de implementación**: Diciembre 2024  
**Versión**: 1.1.0  
**Área**: Sistema de Abonos
