import mongoose, { Document, Schema } from "mongoose";
import { IBrand } from '../types';

const BrandSchema = new Schema<IBrand>(
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

BrandSchema.index({ nombre: 1 });

export const Brand = mongoose.models.Brand || mongoose.model<IBrand>("Brand", BrandSchema);
export { BrandSchema };