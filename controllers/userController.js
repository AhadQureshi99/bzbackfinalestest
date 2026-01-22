const { OAuth2Client } = require("google-auth-library");
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "716052649262-4of7le2fv62u3ae3a8qa1rahclucnk92.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const asyncHandler = require("express-async-handler");
const userModel = require("../models/userModel");
const tempUserModel = require("../models/tempUserModel");
const discountCodeModel = require("../models/discountCodeModel");
const orderModel = require("../models/orderModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Force the sender address to the required value per project policy.
const FORCE_MAIL_FROM = "info@bzcart.store";
// Use a hosted image URL so the image is not sent as an attachment.
const HOSTED_FAVICON_URL = "https://bzcart.store/logg.png";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
};

const generateOTP = () => {
  return crypto.randomInt(100000, 999999); // Secure OTP generation
};

const generateDiscountCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // Generate 8-character code
};

const sendOTP = (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: "bzcart <info@bzcart.store>",
    to: email,
    subject: "Your BZ Cart Verification Code",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <link rel="icon" href="${HOSTED_FAVICON_URL}" type="image/png" />
  <title>BZ Cart - OTP Verification</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin:0; padding:0; background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%); min-height:100vh; }
    .email-container { max-width:600px; margin:40px auto; background:#ffffff; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.15); overflow:hidden; border:1px solid #e0e0e0; }
    .header { background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%); color:#ffffff; text-align:center; padding:30px 20px; font-size:28px; font-weight:bold; position:relative; }
    .header::after { content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:80%; height:4px; background:rgba(255,255,255,0.3); border-radius:2px; }
    .logo { font-size:36px; font-weight:bold; margin-bottom:10px; text-shadow:0 2px 4px rgba(0,0,0,0.1); }
    .body { padding:40px 30px; text-align:center; color:#333333; }
    .greeting { font-size:18px; margin-bottom:20px; color:#555555; }
    .otp { font-size:48px; font-weight:bold; color:#ffa500; margin:30px 0; letter-spacing:8px; background:#f9f9f9; padding:20px; border-radius:12px; border:2px solid #ffa500; display:inline-block; text-shadow:0 1px 2px rgba(0,0,0,0.1); }
    .note { color:#777777; font-size:14px; margin-top:20px; line-height:1.5; }
    .footer { background:#f8f8f8; padding:20px; text-align:center; font-size:12px; color:#999999; border-top:1px solid #e0e0e0; }
    .highlight { color:#ffa500; font-weight:bold; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${HOSTED_FAVICON_URL}" alt="BZ Cart" width="110" height="110" style="vertical-align:middle;border-radius:12px;margin-right:12px;" />
      <span class="logo">bzcart.store</span>
      <div style="color:#ffffff;margin-top:6px;">Verification Code</div>
    </div>
    <div class="body">
      <p class="greeting">Hello! Welcome to BZ Cart, your ultimate e-commerce destination.</p>
      <p>Use the following OTP to complete your registration process:</p>
      <div class="otp">${otp}</div>
      <p class="note">This OTP is valid for <span class="highlight">10 minutes</span>. Do not share it with anyone for security reasons.</p>
    </div>
    <div class="footer">
      <p>If you didn’t request this, please ignore this email or contact our support team.</p>
      <p>© 2023 BZ Cart. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Email error:", error);
    else console.log("Mail sent successfully:", info.response);
  });
};

const sendDiscountCode = (email, code) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  const mailOptions = {
    from: "bzcart <info@bzcart.store>",
    to: email,
    subject: "Your Exclusive 10% Discount Code",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BZ Cart - Discount Code</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin:0; padding:0; background-color:#ffa500; }
    .email-container { max-width:600px; margin:20px auto; background:#ffffff; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.1); overflow:hidden; }
    .header { background:#ffa500; color:#ffffff; text-align:center; padding:20px; font-size:24px; }
    .body { padding:20px; text-align:center; }
    .code { font-size:32px; font-weight:bold; color:#333333; margin:20px 0; letter-spacing:4px; }
    .note { color:#555555; font-size:14px; margin-top:10px; }
    .footer { background:#ffa500; padding:10px; text-align:center; font-size:12px; color:#ffffff; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${HOSTED_FAVICON_URL}" alt="BZ Cart" width="110" height="110" style="vertical-align:middle;border-radius:12px;margin-right:12px;" />
      <span style="color:#ffffff;font-weight:bold;font-size:20px;">BZ Cart - Your 10% Discount Code</span>
    </div>
    <div class="body">
      <p>Thank you for subscribing! Use the following code at checkout to get 10% off your first order:</p>
      <div class="code">${code}</div>
      <p class="note">This code is valid for 7 days and can be used once with Cash on Delivery.</p>
    </div>
    <div class="footer">
      If you didn’t request this, please ignore this email or contact support.
    </div>
  </div>
</body>
</html>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Email error:", error);
    else console.log("Discount code email sent:", info.response);
  });
};

const sendResetEmail = (email, token) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT),
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  const resetUrl = `${
    process.env.FRONTEND_URL || "https://bzcart.store"
  }/reset-password?token=${encodeURIComponent(token)}`;

  const mailOptions = {
    from: `bzcart <${FORCE_MAIL_FROM}>`,
    to: email,
    subject: "Password Reset Request - BZ Cart",
    html: `<p>We received a request to reset your password.</p>
      <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email.</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Reset email error:", error);
    else console.log("Reset mail sent:", info.response);
  });
};

// ────────────────────────────────────────────────
// Controllers
// ────────────────────────────────────────────────

const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400);
    throw new Error("Missing Google credential");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    res.status(401);
    throw new Error("Invalid Google token");
  }

  const { email, name, picture } = payload;
  if (!email) {
    res.status(400);
    throw new Error("Google account has no email");
  }

  let user = await userModel.findOne({ email });
  if (!user) {
    user = await userModel.create({
      username: name || email.split("@")[0],
      email,
      password: bcrypt.hashSync(Math.random().toString(36), 10),
      profileImage: picture || null,
      role: "user",
    });
  }

  res.status(200).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    token: generateToken(user._id),
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) {
    res.status(401);
    throw new Error("Not authorized, no user found");
  }

  const user = await userModel.findById(user_id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
});

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }

  const findUser = await userModel.findOne({ email });
  const findTempUser = await tempUserModel.findOne({ email });

  if (findUser || findTempUser) {
    res.status(400);
    throw new Error("Email already exists!");
  }

  const hashedPass = await bcrypt.hash(password, 10);
  const myOTP = generateOTP();

  const tempUser = await tempUserModel.create({
    username,
    email,
    password: hashedPass,
    otp: myOTP,
  });

  sendOTP(email, myOTP);

  res.status(201).json({
    _id: tempUser._id,
    username: tempUser.username,
    email: tempUser.email,
    token: generateToken(tempUser._id),
  });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const user_id = req.user._id;
  const { otp } = req.body;

  if (!otp) {
    res.status(400);
    throw new Error("Please enter the OTP");
  }

  const findTempUser = await tempUserModel.findById(user_id);
  if (!findTempUser) {
    res.status(404);
    throw new Error("User not found or OTP expired");
  }

  if (findTempUser.otp == otp) {
    const createdUser = await userModel.create({
      username: findTempUser.username,
      email: findTempUser.email,
      password: findTempUser.password,
      role: "user",
    });

    await tempUserModel.deleteOne({ _id: user_id });

    res.status(200).json({
      _id: createdUser._id,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
      token: generateToken(createdUser._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid OTP");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }

  const findUser = await userModel.findOne({ email });

  if (!findUser) {
    res.status(404);
    throw new Error("Invalid Email");
  }

  if (await bcrypt.compare(password, findUser.password)) {
    res.status(200).json({
      _id: findUser._id,
      username: findUser.username,
      email: findUser.email,
      role: findUser.role,
      profileImage: findUser.profileImage,
      token: generateToken(findUser._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid password");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const token = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  sendResetEmail(email, token);
  res.status(200).json({ message: "Reset email sent" });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400);
    throw new Error("Token and new password are required");
  }

  const user = await userModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired token");
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.status(200).json({ message: "Password reset successful" });
});

const updateProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { imageUrl } = req.body;
  if (!imageUrl) {
    res.status(400);
    throw new Error("imageUrl is required");
  }

  const user = await userModel.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.profileImage = imageUrl;
  await user.save();

  res.status(200).json({
    message: "Profile image updated",
    profileImage: user.profileImage,
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userModel
    .find({}, "_id username email role profileImage createdAt")
    .lean();

  if (!users || users.length === 0) {
    res.status(404);
    throw new Error("No users found");
  }

  res.status(200).json(users);
});

const subscribeUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Please provide an email address");
  }

  const existingCode = await discountCodeModel.findOne({ email });
  if (existingCode) {
    res.status(400);
    throw new Error("A discount code has already been sent to this email");
  }

  const code = generateDiscountCode();
  await discountCodeModel.create({ email, code });
  sendDiscountCode(email, code);

  res.status(201).json({
    message: "Discount code sent to your email!",
  });
});

const validateDiscountCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400);
    throw new Error("Email and discount code are required");
  }

  const discount = await discountCodeModel.findOne({
    code: code.trim().toUpperCase(),
    email,
  });

  if (!discount) {
    return res.status(400).json({ isValid: false, message: "Invalid discount code" });
  }

  if (discount.isUsed) {
    return res.status(400).json({ isValid: false, message: "Discount code has already been used" });
  }

  if (discount.expiresAt && discount.expiresAt < Date.now()) {
    return res.status(400).json({ isValid: false, message: "Discount code has expired" });
  }

  res.status(200).json({ isValid: true, message: "Valid discount code" });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await userModel.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await userModel.findByIdAndDelete(id);

  res.status(200).json({ message: "User deleted successfully" });
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await userModel.findById(id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const orderCount = await orderModel.countDocuments({ user_id: id });

  res.status(200).json({
    ...user.toObject(),
    orderCount,
  });
});

module.exports = {
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
};