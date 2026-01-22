const express = require("express");
const {
  getCurrentUser,
  registerUser,
  loginUser,
  verifyOTP,
  getAllUsers,
  subscribeUser,
  validateDiscountCode,
  forgotPassword,
  resetPassword,
  updateProfileImage,
  deleteUser,
  getUserById,
  googleLogin,
} = require("../controllers/userController");

const authHandler = require("../middlewares/authMiddleware");

// Create the router FIRST
const userRouter = express.Router();

// ────────────────────────────────────────────────
// Now it's safe to define routes
// ────────────────────────────────────────────────

// Public routes
userRouter.post("/register-user", registerUser);
userRouter.post("/login-user", loginUser);
userRouter.post("/google-login", googleLogin);          // ← moved here
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/subscribe", subscribeUser);
userRouter.post("/validate-discount", validateDiscountCode);

// Protected routes
userRouter.post("/verify-otp", authHandler, verifyOTP);
userRouter.get("/me", authHandler, getCurrentUser);
userRouter.patch("/profile-image", authHandler, updateProfileImage);

// Admin / management routes
userRouter.get("/all-users", getAllUsers);
userRouter.get("/user/:id", getUserById);
userRouter.delete("/user/:id", deleteUser);

module.exports = userRouter;