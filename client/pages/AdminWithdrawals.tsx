import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  RefreshCw,
  User,
  DollarSign,
} from "lucide-react";

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    mobile: string;
    email: string;
  };
  amount: number;
  status: string;
  description: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  adminNotes?: string;
  processedBy?: {
    fullName: string;
  };
  processedAt?: string;
  createdAt: string;
}

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Transaction | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }

    fetchWithdrawals();
  }, [navigate, statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      const url = statusFilter === "all"
        ? "/api/admin/transactions?type=withdrawal&limit=50"
        : `/api/admin/transactions?type=withdrawal&status=${statusFilter}&limit=50`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          navigate("/admin/login");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.data.transactions);

        // Calculate stats
        const allWithdrawals = data.data.transactions;
        const stats = {
          total: allWithdrawals.length,
          pending: allWithdrawals.filter(
            (w: Transaction) => w.status === "pending",
          ).length,
          approved: allWithdrawals.filter(
            (w: Transaction) => w.status === "completed",
          ).length,
          rejected: allWithdrawals.filter(
            (w: Transaction) => w.status === "rejected",
          ).length,
          totalAmount: allWithdrawals
            .filter((w: Transaction) => w.status === "completed")
            .reduce((sum: number, w: Transaction) => sum + w.amount, 0),
        };
        setStats(stats);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/transactions/${selectedWithdrawal._id}/process`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: actionType,
            adminNotes,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert(
          `Withdrawal ${actionType === "approve" ? "approved" : "rejected"} successfully!`,
        );
        setShowDialog(false);
        setAdminNotes("");
        fetchWithdrawals();
      } else {
        alert(`Failed to process withdrawal: ${data.message}`);
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert("Failed to process withdrawal");
    } finally {
      setProcessing(false);
    }
  };

  const openProcessDialog = (
    withdrawal: Transaction,
    action: "approve" | "reject",
  ) => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setAdminNotes("");
    setShowDialog(true);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/dashboard")}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-white">
              Withdrawal Management
            </h1>
          </div>
          <Button
            onClick={fetchWithdrawals}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {withdrawals.length}
              </p>
              <p className="text-muted-foreground text-sm">
                Pending Withdrawals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                ₹
                {withdrawals
                  .reduce((sum, w) => sum + w.amount, 0)
                  .toLocaleString()}
              </p>
              <p className="text-muted-foreground text-sm">Total Amount</p>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {
                  withdrawals.filter(
                    (w) =>
                      new Date(w.createdAt) > new Date(Date.now() - 86400000),
                  ).length
                }
              </p>
              <p className="text-muted-foreground text-sm">Today's Requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawals Table */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">
              Pending Withdrawal Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No pending withdrawals found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">User</TableHead>
                      <TableHead className="text-foreground">Amount</TableHead>
                      <TableHead className="text-foreground">
                        Bank Details
                      </TableHead>
                      <TableHead className="text-foreground">
                        Request Date
                      </TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal._id}>
                        <TableCell>
                          <div>
                            <p className="text-foreground font-medium">
                              {withdrawal.userId.fullName}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {withdrawal.userId.mobile}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {withdrawal.userId.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-foreground font-bold text-lg">
                            ₹{withdrawal.amount.toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          {withdrawal.bankDetails ? (
                            <div className="text-sm">
                              <p className="text-foreground font-medium">
                                {withdrawal.bankDetails.bankName}
                              </p>
                              <p className="text-muted-foreground">
                                Acc: {withdrawal.bankDetails.accountNumber}
                              </p>
                              <p className="text-muted-foreground">
                                IFSC: {withdrawal.bankDetails.ifscCode}
                              </p>
                              <p className="text-muted-foreground">
                                Name: {withdrawal.bankDetails.accountHolderName}
                              </p>
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              No bank details
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-foreground text-sm">
                              {new Date(
                                withdrawal.createdAt,
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(
                                withdrawal.createdAt,
                              ).toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-500">
                            {withdrawal.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                openProcessDialog(withdrawal, "approve")
                              }
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                openProcessDialog(withdrawal, "reject")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Process Withdrawal Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {actionType === "approve" ? "Approve" : "Reject"} Withdrawal
            </DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="text-foreground font-medium mb-2">
                  Withdrawal Details
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    <span className="text-foreground">User:</span>{" "}
                    {selectedWithdrawal.userId.fullName}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-foreground">Amount:</span> ₹
                    {selectedWithdrawal.amount.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-foreground">Mobile:</span>{" "}
                    {selectedWithdrawal.userId.mobile}
                  </p>
                  {selectedWithdrawal.bankDetails && (
                    <div>
                      <p className="text-muted-foreground">
                        <span className="text-foreground">Bank:</span>{" "}
                        {selectedWithdrawal.bankDetails.bankName}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="text-foreground">Account:</span>{" "}
                        {selectedWithdrawal.bankDetails.accountNumber}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="text-foreground">IFSC:</span>{" "}
                        {selectedWithdrawal.bankDetails.ifscCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="adminNotes" className="text-foreground">
                  Admin Notes {actionType === "reject" && "(Required)"}
                </Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Optional notes for approval..."
                      : "Reason for rejection..."
                  }
                  className="mt-2 bg-input border-border text-foreground"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleProcessWithdrawal}
                  disabled={
                    processing ||
                    (actionType === "reject" && !adminNotes.trim())
                  }
                  className={
                    actionType === "approve"
                      ? "bg-green-600 hover:bg-green-700 text-white flex-1"
                      : "bg-red-600 hover:bg-red-700 text-white flex-1"
                  }
                >
                  {processing
                    ? "Processing..."
                    : actionType === "approve"
                      ? "Approve Withdrawal"
                      : "Reject Withdrawal"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={processing}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;