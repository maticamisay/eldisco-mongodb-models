import mongoose, { Document, Schema } from "mongoose";
import { IQuickNote } from '../types';

const QuickNoteSchema = new Schema<IQuickNote>(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    archived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date,
      required: false
    }
  },
  {
    timestamps: true
  }
);

QuickNoteSchema.index({ createdAt: -1 });
QuickNoteSchema.index({ titulo: 1 });
QuickNoteSchema.index({ archived: 1 });
QuickNoteSchema.index({ archivedAt: 1 });

export const QuickNote = mongoose.models.QuickNote || mongoose.model<IQuickNote>("QuickNote", QuickNoteSchema);
export { QuickNoteSchema };