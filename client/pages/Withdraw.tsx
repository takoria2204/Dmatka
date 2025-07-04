import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Wallet, AlertCircle } from "lucide-react";

interface WalletData {
  balance: number;
  winningBalance: number;
  depositBalance: number;
  bonusBalance: number;
  commissionBalance: number;
}

const Withdraw = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifscCode: "",
  });
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleWithdraw = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (!formData.bankName || !formData.accountNumber || !formData.ifscCode) {
      alert("Please fill all required fields");
      return;
    }
    alert(`Withdrawal request for ₹${formData.amount} submitted successfully!`);
    navigate("/wallet");
  };

  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/wallet")}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="text-foreground text-xl font-bold">Withdraw Cash</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Security Badge */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50 mb-6">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">💳</div>
            <div className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
              100% safe & Secure
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="bg-matka-dark border-matka-gold/30">
          <CardContent className="p-6 space-y-6">
            <div>
              <Label
                htmlFor="amount"
                className="text-foreground text-lg mb-2 block"
              >
                Enter the number
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="₹ 00"
                value={formData.amount}
                onChange={handleChange}
                className="bg-muted border-border text-foreground text-lg py-3"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="bankName"
                className="text-foreground text-lg mb-2 block"
              >
                Bank name
              </Label>
              <Input
                id="bankName"
                name="bankName"
                type="text"
                placeholder="Bank name"
                value={formData.bankName}
                onChange={handleChange}
                className="bg-muted border-border text-foreground"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="accountNumber"
                className="text-foreground text-lg mb-2 block"
              >
                Bank account number
              </Label>
              <Input
                id="accountNumber"
                name="accountNumber"
                type="text"
                placeholder="XXXX - XXXX - XXXX - XXXX"
                value={formData.accountNumber}
                onChange={handleChange}
                className="bg-muted border-border text-foreground"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="name"
                className="text-foreground text-lg mb-2 block"
              >
                Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="bg-muted border-border text-foreground"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="mobile"
                className="text-foreground text-lg mb-2 block"
              >
                Mobile number
              </Label>
              <Input
                id="mobile"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleChange}
                className="bg-muted border-border text-foreground"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="ifscCode"
                className="text-foreground text-lg mb-2 block"
              >
                IFSC Code
              </Label>
              <Input
                id="ifscCode"
                name="ifscCode"
                type="text"
                value={formData.ifscCode}
                onChange={handleChange}
                className="bg-muted border-border text-foreground"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <Button
            onClick={handleWithdraw}
            className="flex-1 bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold py-3 hover:from-yellow-500 hover:to-matka-gold transition-all duration-300"
          >
            WITHDRAW
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-border text-foreground hover:bg-muted py-3"
          >
            WITHDRAW HISTORY
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
