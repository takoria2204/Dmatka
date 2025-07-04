import express from "express";
import cors from "cors";
import connectDB from "./config/database";
import {
  registerUser,
  loginUser,
  adminLogin,
  forgotPassword,
  getProfile,
} from "./routes/auth";
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAllTransactions,
  processWithdrawal,
  addMoneyToUser,
  getAllBets,
} from "./routes/admin";
import {
  getAllGateways,
  createGateway,
  updateGateway,
  deleteGateway,
  getActiveGateways,
  submitPaymentRequest,
  getAllPaymentRequests,
  processPaymentRequest,
  getUserPaymentRequests,
  uploadFile,
} from "./routes/paymentGateway";
import {
  getUserTickets,
  createTicket,
  addUserResponse,
  getAllTickets,
  addAdminResponse,
  updateTicketStatus,
  assignTicket,
} from "./routes/support";
import {
  getWalletBalance,
  getWalletTransactions,
  getDepositHistory,
  getWalletStats,
} from "./routes/wallet";
import auth from "./middleware/auth";
import { adminAuth, superAdminAuth } from "./middleware/adminAuth";

export function createServer() {
  const app = express();

  // Connect to MongoDB Atlas (non-blocking)
  connectDB().catch(console.error);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check route
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Matka Hub server is running!" });
  });

  // Authentication routes
  app.post("/api/auth/register", registerUser);
  app.post("/api/auth/login", loginUser);
  app.post("/api/auth/admin-login", adminLogin);
  app.post("/api/auth/forgot-password", forgotPassword);
  app.get("/api/auth/profile", auth, getProfile);

  // Admin routes
  app.get("/api/admin/dashboard/stats", adminAuth, getDashboardStats);
  app.get("/api/admin/users", adminAuth, getAllUsers);
  app.get("/api/admin/users/:userId", adminAuth, getUserDetails);
  app.put("/api/admin/users/:userId/status", adminAuth, updateUserStatus);
  app.get("/api/admin/transactions", adminAuth, getAllTransactions);
  app.put(
    "/api/admin/transactions/:transactionId/process",
    adminAuth,
    processWithdrawal,
  );
  app.post("/api/admin/users/:userId/add-money", adminAuth, addMoneyToUser);
  app.get("/api/admin/bets", adminAuth, getAllBets);

  // Payment Gateway routes
  app.get("/api/admin/payment-gateways", adminAuth, getAllGateways);
  app.post("/api/admin/payment-gateways", adminAuth, createGateway);
  app.put("/api/admin/payment-gateways/:gatewayId", adminAuth, updateGateway);
  app.delete(
    "/api/admin/payment-gateways/:gatewayId",
    adminAuth,
    deleteGateway,
  );
  app.get("/api/payment-gateways/active", getActiveGateways);
  app.post("/api/payment-requests", auth, submitPaymentRequest);
  app.get("/api/admin/payment-requests", adminAuth, getAllPaymentRequests);
  app.put(
    "/api/admin/payment-requests/:requestId/process",
    adminAuth,
    processPaymentRequest,
  );
  app.get("/api/payment-requests/my", auth, getUserPaymentRequests);
  app.post("/api/upload", uploadFile);

  // Wallet routes
  app.get("/api/wallet/balance", auth, getWalletBalance);
  app.get("/api/wallet/transactions", auth, getWalletTransactions);
  app.get("/api/wallet/deposit-history", auth, getDepositHistory);
  app.get("/api/wallet/stats", auth, getWalletStats);

  // Support Ticket routes
  app.get("/api/support/tickets", auth, getUserTickets);
  app.post("/api/support/tickets", auth, createTicket);
  app.post("/api/support/tickets/:ticketId/response", auth, addUserResponse);
  app.get("/api/admin/support/tickets", adminAuth, getAllTickets);
  app.post(
    "/api/admin/support/tickets/:ticketId/response",
    adminAuth,
    addAdminResponse,
  );
  app.put(
    "/api/admin/support/tickets/:ticketId/status",
    adminAuth,
    updateTicketStatus,
  );
  app.put(
    "/api/admin/support/tickets/:ticketId/assign",
    adminAuth,
    assignTicket,
  );

  return app;
}
