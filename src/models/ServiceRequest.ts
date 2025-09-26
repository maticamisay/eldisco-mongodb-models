import mongoose, { Document, Schema } from "mongoose";
import {
  IServiceRequest,
  IServiceRequestComment,
  IServiceItem,
  IServiceCorrection,
  IServiceModification,
  IServiceNote,
  IEquipmentChecklist,
  IServicePayment
} from '../types';

const ServiceRequestCommentSchema = new Schema<IServiceRequestComment>({
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
});

const ServiceCorrectionSchema = new Schema<IServiceCorrection>({
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  modifiedBy: {
    type: String,
    required: true,
    trim: true,
  },
  previousDescription: {
    type: String,
    required: true,
    trim: true,
  },
  previousPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  newDescription: {
    type: String,
    required: true,
    trim: true,
  },
  newPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

const ServiceItemSchema = new Schema<IServiceItem>({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  accepted: {
    type: Boolean,
    default: false,
  },
  isRemoved: {
    type: Boolean,
    default: false,
  },
  removalReason: {
    type: String,
    trim: true,
  },
  correctionHistory: {
    type: [ServiceCorrectionSchema],
    default: [],
  },
});

const ServiceModificationSchema = new Schema<IServiceModification>({
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  action: {
    type: String,
    enum: ['services_updated', 'status_changed', 'note_added', 'payment_added', 'payment_completed', 'service_corrected', 'service_removed', 'service_acceptance_changed', 'archived', 'unarchived'],
    required: true,
  },
  details: {
    type: String,
    required: true,
    trim: true,
  },
  previousValue: {
    type: Schema.Types.Mixed,
    required: false,
  },
  newValue: {
    type: Schema.Types.Mixed,
    required: false,
  },
  modifiedBy: {
    type: String,
    required: true,
    trim: true,
  },
});

const ServiceNoteSchema = new Schema<IServiceNote>({
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  note: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
});

const ServicePaymentSchema = new Schema<IServicePayment>({
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'other'],
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  receivedBy: {
    type: String,
    required: true,
    trim: true,
  },
});

const EquipmentChecklistSchema = new Schema<IEquipmentChecklist>({
  displayFunctional: {
    type: Boolean,
    required: true,
  },
  keyboardFunctional: {
    type: Boolean,
    required: true,
  },
  powerCableIncluded: {
    type: Boolean,
    required: true,
  },
  physicalDamage: {
    type: Boolean,
    required: true,
  },
  physicalDamageDescription: {
    type: String,
    trim: true,
  },
  powerButtonFunctional: {
    type: Boolean,
    required: true,
  },
  bootsCorrectly: {
    type: Boolean,
    required: true,
  },
  osLoads: {
    type: Boolean,
    required: true,
  },
  audioFunctional: {
    type: Boolean,
    required: true,
  },
  connectivityFunctional: {
    type: Boolean,
    required: true,
  },
  batteryCharges: {
    type: Boolean,
    required: false,
  },
  fansFunctional: {
    type: Boolean,
    required: true,
  },
  dataBackupConfirmed: {
    type: Boolean,
    required: true,
  },
  hasPassword: {
    type: Boolean,
    required: true,
  },
  passwordDetails: {
    type: String,
    trim: true,
  },
  specificSoftware: {
    type: Boolean,
    required: true,
  },
  softwareDetails: {
    type: String,
    trim: true,
  },
  importantFilesIdentified: {
    type: Boolean,
    required: true,
  },
  checkedBy: {
    type: String,
    required: true,
    trim: true,
  },
  checkDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  additionalNotes: {
    type: String,
    trim: true,
  },
});

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    ticketId: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    issueDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    receivedBy: {
      type: String,
      enum: ["daniel", "damian", "matias", "tomas", "gabriel"],
      required: true,
    },
    initialNotes: {
      type: String,
      default: "",
      trim: true,
    },
    equipmentChecklist: {
      type: EquipmentChecklistSchema,
      required: false,
    },
    services: {
      type: [ServiceItemSchema],
      default: [],
    },
    payments: {
      type: [ServicePaymentSchema],
      default: [],
    },
    comments: {
      type: [ServiceRequestCommentSchema],
      default: [],
    },
    additionalNotes: {
      type: [ServiceNoteSchema],
      default: [],
    },
    modifications: {
      type: [ServiceModificationSchema],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      required: false,
    },
    archivedBy: {
      type: String,
      trim: true,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

ServiceRequestSchema.virtual('totalCost').get(function() {
  return this.services
    .filter((service: any) => service.accepted && !service.isRemoved)
    .reduce((sum: number, service: any) => sum + service.price, 0);
});

ServiceRequestSchema.virtual('totalPaid').get(function() {
  return this.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
});

ServiceRequestSchema.virtual('remainingBalance').get(function() {
  return this.totalCost - this.totalPaid;
});

ServiceRequestSchema.virtual('isFullyPaid').get(function() {
  return this.totalPaid >= this.totalCost && this.totalCost > 0;
});

ServiceRequestSchema.set('toJSON', { virtuals: true });
ServiceRequestSchema.set('toObject', { virtuals: true });

ServiceRequestSchema.pre('save', async function(next) {
  if (!this.ticketId || this.ticketId.trim() === '') {
    try {
      const ServiceRequestModel = this.constructor as mongoose.Model<IServiceRequest>;
      const lastServiceRequest = await ServiceRequestModel.findOne({
        ticketId: { $exists: true, $ne: '' }
      })
        .sort({ createdAt: -1 })
        .limit(1);

      let nextNumber = 1;
      if (lastServiceRequest && lastServiceRequest.ticketId) {
        const lastNumber = parseInt(lastServiceRequest.ticketId.replace('SR-', ''));
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }

      this.ticketId = `SR-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating ticketId:', error);
      this.ticketId = `SR-${Date.now().toString().slice(-3)}`;
    }
  }
  next();
});

ServiceRequestSchema.index({ status: 1 });
ServiceRequestSchema.index({ priority: 1 });
ServiceRequestSchema.index({ receivedBy: 1 });
ServiceRequestSchema.index({ isArchived: 1 });

export const ServiceRequest = mongoose.models.ServiceRequest || mongoose.model<IServiceRequest>("ServiceRequest", ServiceRequestSchema);
export {
  ServiceRequestSchema,
  ServiceRequestCommentSchema,
  ServiceItemSchema,
  ServiceCorrectionSchema,
  ServiceModificationSchema,
  ServiceNoteSchema,
  ServicePaymentSchema,
  EquipmentChecklistSchema
};