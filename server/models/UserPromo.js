import mongoose from 'mongoose';

const userPromoSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    promoCode: {
      type: String,
      required: true,
      uppercase: true
    },
    discount: {
      type: Number,
      required: true
    },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model('UserPromo', userPromoSchema);
