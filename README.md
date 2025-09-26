# @eldisco/mongodb-models

Paquete NPM privado que contiene todos los modelos de MongoDB compartidos entre proyectos El Disco.

## Instalación

```bash
npm install @eldisco/mongodb-models
```

## Dependencias peer requeridas

Este paquete requiere las siguientes dependencias peer en tu proyecto:

```bash
npm install mongoose bcryptjs
npm install --save-dev @types/bcryptjs
```

## Uso

### Conexión a la base de datos

```typescript
import { dbConnection } from '@eldisco/mongodb-models';

// Conectar a MongoDB
await dbConnection.connect({
  uri: 'mongodb://localhost:27017/eldisco',
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  }
});
```

### Importación de modelos

```typescript
import {
  User,
  Brand,
  Category,
  Customer,
  Supplier,
  Product,
  Especificacion,
  QuickNote,
  SalesNote,
  ServiceRequest
} from '@eldisco/mongodb-models';
```

### Usar los modelos

#### Usuario

```typescript
import { User, IUser } from '@eldisco/mongodb-models';

// Crear un nuevo usuario
const newUser: Partial<IUser> = {
  email: 'usuario@ejemplo.com',
  name: 'Juan Pérez',
  password: 'contraseña123',
  role: 'employee'
};

const user = new User(newUser);
await user.save();

// Verificar contraseña
const isValid = await user.comparePassword('contraseña123');
```

#### Producto

```typescript
import { Product, IProduct, IProductImage } from '@eldisco/mongodb-models';

// Crear un producto
const newProduct: Partial<IProduct> = {
  nombre: 'Disco de Vinilo The Beatles',
  autogenerarNombre: false,
  codigosBarras: ['123456789012'],
  marcaId: brandId,
  precio: 15000,
  iva: 21,
  proveedorId: supplierId,
  categoriaId: categoryId,
  subcategoriaIds: [subcategoryId],
  stock: 10,
  umbralStockBajo: 5,
  activoEcommerce: true
};

const product = new Product(newProduct);
await product.save();
```

#### Categoría

```typescript
import { Category, ICategory, ISubcategory } from '@eldisco/mongodb-models';

// Crear una categoría con subcategorías
const newCategory: Partial<ICategory> = {
  nombre: 'Música',
  umbralStockBajo: 5,
  subcategorias: [
    { nombre: 'Vinilos', umbralStockBajo: 3 },
    { nombre: 'CDs', umbralStockBajo: 5 }
  ]
};

const category = new Category(newCategory);
await category.save();
```

#### Solicitud de servicio

```typescript
import { ServiceRequest, IServiceRequest } from '@eldisco/mongodb-models';

// Crear una solicitud de servicio
const newServiceRequest: Partial<IServiceRequest> = {
  customerName: 'María García',
  customerPhone: '+54 11 1234-5678',
  issueDescription: 'La laptop no enciende, posible problema con la fuente',
  priority: 'Medium',
  receivedBy: 'daniel',
  initialNotes: 'Cliente menciona que dejó de funcionar de repente'
};

const serviceRequest = new ServiceRequest(newServiceRequest);
await serviceRequest.save();
```

#### Nota de venta

```typescript
import { SalesNote, ISalesNote, ISalesNoteItem } from '@eldisco/mongodb-models';

// Crear una nota de venta
const items: ISalesNoteItem[] = [
  {
    description: 'Disco Vinilo The Beatles - Abbey Road',
    quantity: 1,
    unitPrice: 15000,
    total: 15000,
    productId: productId
  }
];

const newSalesNote: Partial<ISalesNote> = {
  fecha: new Date(),
  cliente: {
    nombre: 'Juan Pérez',
    tipoDocumento: 'DNI',
    numeroDocumento: '12345678',
    direccion: 'Av. Corrientes 1234, CABA'
  },
  items: items,
  subtotal: 15000,
  impuestos: 3150,
  total: 18150
};

const salesNote = new SalesNote(newSalesNote);
await salesNote.save();
```

## Modelos disponibles

### User (Usuario)
- **email**: String único requerido
- **password**: String requerido (hasheado automáticamente)
- **name**: String requerido
- **role**: "admin" | "employee" (default: "employee")
- **lastLogin**: Date opcional
- **comparePassword()**: Método para verificar contraseñas

### Brand (Marca)
- **nombre**: String único requerido

### Category (Categoría)
- **nombre**: String único requerido
- **slug**: String único generado automáticamente
- **umbralStockBajo**: Number opcional
- **subcategorias**: Array de subcategorías

### Customer (Cliente)
- **razonSocial**: String requerido
- **tipoDocumento**: String requerido
- **numeroDocumento**: String único requerido
- **direccion**: String requerido
- **condicionIva**: String requerido
- **telefono**: String opcional

### Supplier (Proveedor)
- **nombre**: String único requerido

### Especificacion
- **nombre**: String requerido
- **descripcion**: String opcional
- **opciones**: Array de opciones con umbral de stock
- **categoriaIds**: Array de IDs de categorías
- **isActive**: Boolean (default: true)
- **umbralStockBajoGeneral**: Number (default: 5)

### Product (Producto)
- **nombre**: String opcional
- **autogenerarNombre**: Boolean requerido
- **codigosBarras**: Array de códigos de barras externos
- **codigoInterno**: String único generado automáticamente
- **codigoBarraPrincipal**: String opcional
- **marcaId**: String requerido (referencia a Brand)
- **precio**: Number requerido
- **iva**: Number (default: 21)
- **proveedorId**: String requerido (referencia a Supplier)
- **categoriaId**: String requerido (referencia a Category)
- **subcategoriaIds**: Array de IDs de subcategorías
- **especificaciones**: Array de especificaciones del producto
- **imagenes**: Array de imágenes del producto
- **stock**: Number requerido (default: 0)
- **umbralStockBajo**: Number (default: 5)
- **activoEcommerce**: Boolean (default: false)

### QuickNote (Nota rápida)
- **titulo**: String requerido (max: 100 caracteres)
- **descripcion**: String requerido (max: 1000 caracteres)
- **archived**: Boolean (default: false)
- **archivedAt**: Date opcional

### SalesNote (Nota de venta)
- **numeroComprobante**: String único generado automáticamente
- **fecha**: Date requerido
- **cliente**: Objeto con datos del cliente
- **items**: Array de items de la venta
- **subtotal**: Number requerido
- **impuestos**: Number requerido
- **total**: Number requerido
- **observaciones**: String opcional

### ServiceRequest (Solicitud de servicio)
- **ticketId**: String único generado automáticamente
- **customerName**: String requerido
- **customerPhone**: String requerido
- **issueDescription**: String requerido (min: 10 caracteres)
- **priority**: "Low" | "Medium" | "High" | "Critical"
- **status**: "Pending" | "In Progress" | "Completed" | "Cancelled"
- **receivedBy**: "daniel" | "damian" | "matias" | "tomas" | "gabriel"
- **equipmentChecklist**: Objeto opcional con checklist del equipo
- **services**: Array de servicios a realizar
- **payments**: Array de pagos realizados
- **comments**: Array de comentarios
- **additionalNotes**: Array de notas adicionales
- **modifications**: Array de modificaciones
- **isArchived**: Boolean (default: false)
- **Campos virtuales**: totalCost, totalPaid, remainingBalance, isFullyPaid

## Características especiales

### Generación automática de códigos
- **Product**: Genera `codigoInterno` único automáticamente
- **SalesNote**: Genera `numeroComprobante` secuencial (NV-000001)
- **ServiceRequest**: Genera `ticketId` secuencial (SR-001)

### Validaciones incluidas
- Códigos de barras únicos entre productos
- Validación de email en usuarios
- Hash automático de contraseñas
- Validaciones de longitud y formato

### Índices optimizados
Todos los modelos incluyen índices apropiados para consultas eficientes.

## Desarrollo

### Construcción del paquete

```bash
npm install
npm run build
```

### Desarrollo con watch mode

```bash
npm run dev
```

### Linting y formateo

```bash
npm run lint
npm run format
```

## Versionado

Para actualizar el paquete:

1. Hacer cambios en los modelos
2. Actualizar la versión en `package.json`
3. Construir el paquete: `npm run build`
4. Publicar: `npm publish`

## Estructura del proyecto

```
src/
├── types/
│   └── index.ts              # Interfaces y tipos TypeScript
├── models/
│   ├── User.ts               # Modelo de usuario
│   ├── Brand.ts              # Modelo de marca
│   ├── Category.ts           # Modelo de categoría
│   ├── Customer.ts           # Modelo de cliente
│   ├── Supplier.ts           # Modelo de proveedor
│   ├── Especificacion.ts     # Modelo de especificación
│   ├── Product.ts            # Modelo de producto
│   ├── QuickNote.ts          # Modelo de nota rápida
│   ├── SalesNote.ts          # Modelo de nota de venta
│   └── ServiceRequest.ts     # Modelo de solicitud de servicio
├── utils/
│   └── database.ts           # Utilidades de conexión a BD
└── index.ts                  # Exportaciones principales
```