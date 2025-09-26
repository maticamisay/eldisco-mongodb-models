// Export all types
export * from './types';

// Export all models
export * from './models/User';
export * from './models/Brand';
export * from './models/Category';
export * from './models/Customer';
export * from './models/Supplier';
export * from './models/Especificacion';
export * from './models/Product';
export * from './models/QuickNote';
export * from './models/SalesNote';
export * from './models/ServiceRequest';

// Export database utilities
export * from './utils/database';

// Export services and cache utilities
export * from './services';

// Named exports for direct access
export {
  User,
  UserSchema
} from './models/User';

export {
  Brand,
  BrandSchema
} from './models/Brand';

export {
  Category,
  CategorySchema,
  SubcategorySchema
} from './models/Category';

export {
  Customer,
  CustomerSchema
} from './models/Customer';

export {
  Supplier,
  SupplierSchema
} from './models/Supplier';

export {
  Especificacion,
  EspecificacionSchema
} from './models/Especificacion';

export {
  Product,
  ProductSchema,
  ProductEspecificacionSchema,
  ProductImageSchema
} from './models/Product';

export {
  QuickNote,
  QuickNoteSchema
} from './models/QuickNote';

export {
  SalesNote,
  SalesNoteSchema,
  SalesNoteItemSchema
} from './models/SalesNote';

export {
  ServiceRequest,
  ServiceRequestSchema,
  ServiceRequestCommentSchema,
  ServiceItemSchema,
  ServiceCorrectionSchema,
  ServiceModificationSchema,
  ServiceNoteSchema,
  ServicePaymentSchema,
  EquipmentChecklistSchema
} from './models/ServiceRequest';

export {
  dbConnection,
  DatabaseConnection,
  type DatabaseConnectionOptions
} from './utils/database';

// Service exports for convenience
export {
  CacheManager,
  ProductService,
  CatalogService,
  SalesService,
  createCacheManager,
  createProductService,
  createCatalogService,
  createSalesService
} from './services';

// Type exports
export type {
  IUser,
  IBrand,
  ICategory,
  ISubcategory,
  ICustomer,
  ISupplier,
  IEspecificacion,
  IOpcionEspecificacion,
  IProduct,
  IProductEspecificacion,
  IProductImage,
  IQuickNote,
  ISalesNote,
  ISalesNoteItem,
  IServiceRequest,
  IServiceRequestComment,
  IServiceItem,
  IServiceCorrection,
  IServiceModification,
  IServiceNote,
  IEquipmentChecklist,
  IServicePayment
} from './types';