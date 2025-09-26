import mongoose, { Document, Schema } from "mongoose";
import { ISupplier } from '../types';

const SupplierSchema = new Schema<ISupplier>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

SupplierSchema.index({ nombre: 1 });

export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);
export { SupplierSchema };