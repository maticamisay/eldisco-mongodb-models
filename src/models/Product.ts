import mongoose, { Document, Schema } from "mongoose";
import { IProduct, IProductEspecificacion, IProductImage } from '../types';

const ProductEspecificacionSchema = new Schema({
  especificacionId: {
    type: String,
    required: true,
  },
  valor: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

const ProductImageSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
    min: 0,
  },
  uploadDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
  alt: {
    type: String,
    required: false,
  }
});

const ProductSchema = new Schema<IProduct>(
  {
    nombre: {
      type: String,
      required: false,
      trim: true,
    },
    autogenerarNombre: {
      type: Boolean,
      required: true,
      default: false,
    },
    codigoBarras: {
      type: String,
      required: false,
      trim: true,
      sparse: true,
    },
    codigosBarras: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: function(arr: string[]) {
          return arr.length === new Set(arr).size;
        },
        message: 'No se permiten códigos de barras duplicados en el mismo producto'
      }
    },
    codigoInterno: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    codigoBarraPrincipal: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return this.codigosBarras && this.codigosBarras.includes(value);
        },
        message: 'El código de barras principal debe existir en la lista de códigos externos'
      }
    },
    marcaId: {
      type: String,
      required: true,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    iva: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 21,
    },
    proveedorId: {
      type: String,
      required: true,
    },
    categoriaId: {
      type: String,
      required: true,
    },
    subcategoriaIds: [{
      type: String,
      required: true,
    }],
    especificaciones: [ProductEspecificacionSchema],
    imagenes: [ProductImageSchema],
    imagenPrincipal: {
      type: String,
      required: false,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    umbralStockBajo: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
    activoEcommerce: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

function generateInternalCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `PROD-${timestamp}-${random}`.toUpperCase();
}

ProductSchema.pre('save', async function(next) {
  const product = this as any;
  if (product.isNew && !product.codigoInterno) {
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      product.codigoInterno = generateInternalCode();
      const existing = await mongoose.models.Product.findOne({ codigoInterno: product.codigoInterno });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('No se pudo generar un código interno único');
    }
  }
  next();
});

ProductSchema.pre('save', async function(next) {
  const product = this as any;
  if (product.codigosBarras && product.codigosBarras.length > 0) {
    for (const codigo of product.codigosBarras) {
      const existing = await mongoose.models.Product.findOne({
        $and: [
          { _id: { $ne: product._id } },
          {
            $or: [
              { codigosBarras: codigo },
              { codigoBarras: codigo }
            ]
          }
        ]
      });

      if (existing) {
        throw new Error(`El código de barras '${codigo}' ya está en uso por otro producto`);
      }
    }
  }
  next();
});

ProductSchema.index({ nombre: 1 });
ProductSchema.index({ marcaId: 1 });
ProductSchema.index({ categoriaId: 1 });
ProductSchema.index({ proveedorId: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ codigoInterno: 1 }, { unique: true });
ProductSchema.index({ codigosBarras: 1 });
ProductSchema.index({ codigoBarras: 1 }, { unique: true, sparse: true });
ProductSchema.index({ "especificaciones.especificacionId": 1 });
ProductSchema.index({ "especificaciones.valor": 1 });
ProductSchema.index({ "imagenes.id": 1 });
ProductSchema.index({ imagenPrincipal: 1 });

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
export { ProductSchema, ProductEspecificacionSchema, ProductImageSchema };