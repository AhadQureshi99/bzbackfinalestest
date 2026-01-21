const mongoose = require("mongoose");
const Category = require("../models/categoryModel");
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

// Fixed categories for the store
const FIXED_CATEGORIES = [
  {
    name: "Men's Clothing",
    slug: "mens-clothing",
    image: "/categories/mens-clothing.jpg",
  },
  { name: "Watches", slug: "watches", image: "/categories/watches.jpg" },
  { name: "Shoes", slug: "shoes", image: "/categories/shoes.jpg" },
  { name: "Vapes & Pods", slug: "pods", image: "/categories/vapes-pods.jpg" },
  { name: "Care", slug: "care", image: "/categories/care.jpg" },
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    for (const cat of FIXED_CATEGORIES) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        await Category.create({
          name: cat.name,
          image: cat.image,
          parent_category: null,
        });
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
};

seedCategories();
