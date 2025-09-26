import mongoose, { Document, Schema } from "mongoose";
import { IEspecificacion, IOpcionEspecificacion } from '../types';

const EspecificacionSchema = new Schema<IEspecificacion>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    opciones: [{
      valor: {
        type: String,
        required: true,
        trim: true,
      },
      umbralStockBajo: {
        type: Number,
        required: true,
        min: -1,
        default: 5,
      },
      tieneUmbral: {
        type: Boolean,
        default: true,
      }
    }],
    categoriaIds: [{
      type: String,
      required: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    umbralStockBajoGeneral: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

EspecificacionSchema.index({ nombre: 1 });
EspecificacionSchema.index({ categoriaIds: 1 });
EspecificacionSchema.index({ isActive: 1 });
EspecificacionSchema.index({ categoriaIds: 1, isActive: 1 });

export const Especificacion = mongoose.models.Especificacion || mongoose.model<IEspecificacion>("Especificacion", EspecificacionSchema);
export { EspecificacionSchema };