import mongoose, { Document, Schema } from "mongoose";
import { ISalesNote, ISalesNoteItem } from '../types';

const SalesNoteItemSchema = new Schema<ISalesNoteItem>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    productId: {
      type: String,
      required: false,
    },
  },
  {
    _id: true,
  }
);

const SalesNoteSchema = new Schema<ISalesNote>(
  {
    numeroComprobante: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    fecha: {
      type: Date,
      required: true,
      default: Date.now,
    },
    cliente: {
      nombre: {
        type: String,
        required: true,
        trim: true,
      },
      tipoDocumento: {
        type: String,
        required: true,
        trim: true,
      },
      numeroDocumento: {
        type: String,
        required: true,
        trim: true,
      },
      direccion: {
        type: String,
        required: true,
        trim: true,
      },
    },
    items: [SalesNoteItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    impuestos: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    observaciones: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

SalesNoteSchema.pre('save', async function(next) {
  if (!this.numeroComprobante || this.numeroComprobante.trim() === '') {
    try {
      const SalesNoteModel = this.constructor as mongoose.Model<ISalesNote>;
      const lastSalesNote = await SalesNoteModel.findOne({
        numeroComprobante: { $exists: true, $ne: '' }
      })
        .sort({ createdAt: -1 })
        .limit(1);

      let nextNumber = 1;
      if (lastSalesNote && lastSalesNote.numeroComprobante) {
        const lastNumber = parseInt(lastSalesNote.numeroComprobante.replace('NV-', ''));
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }

      this.numeroComprobante = `NV-${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating numeroComprobante:', error);
      this.numeroComprobante = `NV-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

SalesNoteSchema.index({ fecha: -1 });
SalesNoteSchema.index({ 'cliente.nombre': 1 });
SalesNoteSchema.index({ 'cliente.numeroDocumento': 1 });
SalesNoteSchema.index({ total: -1 });

export const SalesNote = mongoose.models.SalesNote || mongoose.model<ISalesNote>("SalesNote", SalesNoteSchema);
export { SalesNoteSchema, SalesNoteItemSchema };