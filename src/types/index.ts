import { Document, Types } from 'mongoose';

// User Types
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: "admin" | "employee";
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Brand Types
export interface IBrand extends Document {
  nombre: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category Types
export interface ISubcategory {
  nombre: string;
  umbralStockBajo?: number;
}

export interface ICategory extends Document {
  nombre: string;
  slug?: string;
  umbralStockBajo?: number;
  subcategorias: ISubcategory[];
  createdAt: Date;
  updatedAt: Date;
}

// Customer Types
export interface ICustomer extends Document {
  razonSocial: string;
  tipoDocumento: string;
  numeroDocumento: string;
  direccion: string;
  condicionIva: string;
  telefono?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Supplier Types
export interface ISupplier extends Document {
  nombre: string;
  createdAt: Date;
  updatedAt: Date;
}

// Especificacion Types
export interface IOpcionEspecificacion {
  valor: string;
  umbralStockBajo: number;
  tieneUmbral?: boolean;
}

export interface IEspecificacion extends Document {
  nombre: string;
  descripcion?: string;
  opciones: IOpcionEspecificacion[];
  categoriaIds: string[];
  isActive: boolean;
  umbralStockBajoGeneral: number;
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface IProductEspecificacion {
  especificacionId: string;
  valor: string | number | boolean;
}

export interface IProductImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  uploadDate: Date;
  isPrimary: boolean;
  alt?: string;
}

export interface IProduct extends Document {
  nombre: string;
  autogenerarNombre: boolean;
  codigoBarras?: string;
  codigosBarras: string[];
  codigoInterno: string;
  codigoBarraPrincipal?: string;
  marcaId: string;
  precio: number;
  iva: number;
  proveedorId: string;
  categoriaId: string;
  subcategoriaIds: string[];
  especificaciones?: IProductEspecificacion[];
  imagenes?: IProductImage[];
  imagenPrincipal?: string;
  stock: number;
  umbralStockBajo: number;
  activoEcommerce: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// QuickNote Types
export interface IQuickNote extends Document {
  titulo: string;
  descripcion: string;
  archived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// SalesNote Types
export interface ISalesNoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId?: string;
}

export interface ISalesNote extends Document {
  numeroComprobante: string;
  fecha: Date;
  cliente: {
    nombre: string;
    tipoDocumento: string;
    numeroDocumento: string;
    direccion: string;
  };
  items: ISalesNoteItem[];
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ServiceRequest Types
export interface IServiceRequestComment {
  date: Date;
  comment: string;
  author: string;
}

export interface IServiceItem {
  description: string;
  price: number;
  accepted: boolean;
  isRemoved?: boolean;
  removalReason?: string;
  correctionHistory?: IServiceCorrection[];
}

export interface IServiceCorrection {
  date: Date;
  reason: string;
  modifiedBy: string;
  previousDescription: string;
  previousPrice: number;
  newDescription: string;
  newPrice: number;
}

export interface IServiceModification {
  date: Date;
  action: 'services_updated' | 'status_changed' | 'note_added' | 'payment_added' | 'payment_completed' | 'service_corrected' | 'service_removed' | 'service_acceptance_changed' | 'archived' | 'unarchived';
  details: string;
  previousValue?: any;
  newValue?: any;
  modifiedBy: string;
}

export interface IServiceNote {
  date: Date;
  note: string;
  author: string;
}

export interface IEquipmentChecklist {
  displayFunctional: boolean;
  keyboardFunctional: boolean;
  powerCableIncluded: boolean;
  physicalDamage: boolean;
  physicalDamageDescription?: string;
  powerButtonFunctional: boolean;
  bootsCorrectly: boolean;
  osLoads: boolean;
  audioFunctional: boolean;
  connectivityFunctional: boolean;
  batteryCharges?: boolean;
  fansFunctional: boolean;
  dataBackupConfirmed: boolean;
  hasPassword: boolean;
  passwordDetails?: string;
  specificSoftware: boolean;
  softwareDetails?: string;
  importantFilesIdentified: boolean;
  checkedBy: string;
  checkDate: Date;
  additionalNotes?: string;
}

export interface IServicePayment {
  date: Date;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'other';
  description?: string;
  receivedBy: string;
}

export interface IServiceRequest extends Document {
  ticketId: string;
  customerName: string;
  customerPhone: string;
  issueDescription: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  receivedBy: "daniel" | "damian" | "matias" | "tomas" | "gabriel";
  initialNotes: string;
  equipmentChecklist?: IEquipmentChecklist;
  services: IServiceItem[];
  payments: IServicePayment[];
  comments: IServiceRequestComment[];
  additionalNotes: IServiceNote[];
  modifications: IServiceModification[];
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  totalCost: number;
  totalPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
}