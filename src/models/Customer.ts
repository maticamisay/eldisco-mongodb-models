import mongoose, { Document, Schema } from "mongoose";
import { ICustomer } from '../types';

const CustomerSchema = new Schema<ICustomer>(
  {
    razonSocial: {
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
      unique: true,
    },
    direccion: {
      type: String,
      required: true,
      trim: true,
    },
    condicionIva: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

CustomerSchema.index({ razonSocial: 1 });
CustomerSchema.index({ tipoDocumento: 1 });

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
export { CustomerSchema };