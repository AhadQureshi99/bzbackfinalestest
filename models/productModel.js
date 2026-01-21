const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
    },
    product_description: {
      type: String,
      required: true,
    },
    product_base_price: {
      type: Number,
      required: true,
    },
    product_discounted_price: {
      type: Number,
      required: true,
    },
    product_stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sizes: [
      {
        size: {
          type: String,
          required: true,
        },
        stock: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    colors: [
      {
        name: {
          type: String,
          required: true,
        },
        hex: {
          type: String,
          required: true,
        },
      },
    ],
    warranty: {
      type: String,
      required: false,
      default: "",
    },
    highlights: {
      type: [String],
      default: [],
    },
    product_images: {
      type: Array,
      required: true,
      default: [],
    },
    category: {
      type: String,
      required: true,
      enum: ["mens-clothing", "watches", "shoes", "mens-care", "pods-vape"],
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    brand_name: {
      type: String,
      required: true,
    },
    product_code: {
      type: String,
      required: true,
      unique: true,
    },
    rating: {
      type: Number,
      required: false,
      default: 4,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    bg_color: {
      type: String,
      required: false,
      default: "#FFFFFF",
    },
    shipping: {
      type: Number,
      required: true,
      default: 0,
    },
    payment: {
      type: [String],
      required: true,
      default: ["Cash on Delivery"],
    },
    isNewArrival: {
      type: Boolean,
      required: false,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Product", productSchema);
