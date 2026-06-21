import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      default: 'percent'
    },
    maxUses: {
      type: Number,
      default: null
    },
    currentUses: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model('PromoCode', promoCodeSchema);
