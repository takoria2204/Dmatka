import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LogOut,
  User,
  Wallet,
  Trophy,
  Clock,
  TrendingUp,
  Dice1,
  Dice6,
  MessageSquare,
  Target,
  RefreshCw,
} from "lucide-react";

interface WalletData {
  balance: number;
  winningBalance: number;
  depositBalance: number;
  bonusBalance: number;
  commissionBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWinnings: number;
  totalBets: number;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("matka_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("/api/wallet/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletData(data.data);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const gameTypes = [
    {
      name: "Single",
      icon: Dice1,
      color: "from-blue-500 to-blue-600",
      description: "Pick a single digit",
    },
    {
      name: "Jodi",
      icon: Dice6,
      color: "from-green-500 to-green-600",
      description: "Pick a pair of digits",
    },
    {
      name: "Patti",
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
      description: "Three digit combination",
    },
    {
      name: "Half Sangam",
      icon: Trophy,
      color: "from-orange-500 to-orange-600",
      description: "Single + Patti combination",
    },
    {
      name: "Full Sangam",
      icon: Clock,
      color: "from-red-500 to-red-600",
      description: "Patti + Patti combination",
    },
  ];

  const marketStatus = [
    { name: "Kalyan", status: "Open", time: "15:00 - 18:00" },
    { name: "Main Mumbai", status: "Closed", time: "21:30 - 00:30" },
    { name: "Rajdhani Day", status: "Open", time: "16:00 - 18:00" },
    { name: "Time Bazar", status: "Closed", time: "12:00 - 14:00" },
  ];

  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-matka-gold via-yellow-500 to-matka-gold-dark flex items-center justify-center">
                <span className="text-lg">🏺</span>
              </div>
              <div>
                <h1 className="text-matka-gold font-bold text-lg">Matka Hub</h1>
                <p className="text-muted-foreground text-sm">
                  Welcome, {user?.fullName}
                </p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-matka-gold/20 rounded-full flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-matka-gold" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Wallet Balance
                  </p>
                  <p className="text-foreground font-bold text-lg">₹0.00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Total Winnings
                  </p>
                  <p className="text-foreground font-bold text-lg">₹0.00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Games Played</p>
                  <p className="text-foreground font-bold text-lg">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game Types */}
          <div>
            <h2 className="text-foreground text-xl font-bold mb-4 flex items-center gap-2">
              <Dice6 className="h-5 w-5 text-matka-gold" />
              Game Types
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameTypes.map((game, index) => {
                const IconComponent = game.icon;
                const isMatka = game.name === "Single"; // Assuming Single represents Matka
                return (
                  <Card
                    key={index}
                    className="bg-card/90 backdrop-blur-sm border-border/50 hover:border-matka-gold/50 transition-all duration-300 cursor-pointer group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${game.color} rounded-full flex items-center justify-center`}
                        >
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-foreground font-semibold">
                            {game.name === "Single" ? "Matka" : game.name}
                          </h3>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {game.name === "Single"
                          ? "Play Delhi Bazar, Gali, Disawer and more"
                          : game.description}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (game.name === "Single") {
                            navigate("/matka-games");
                          } else {
                            // For other game types, you can add different routes or show coming soon
                            alert(`${game.name} coming soon!`);
                          }
                        }}
                        className="w-full mt-3 bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-medium hover:from-yellow-500 hover:to-matka-gold transition-all duration-300"
                      >
                        {game.name === "Single" ? "Play Matka" : "Coming Soon"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Market Status */}
          <div>
            <h2 className="text-foreground text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-matka-gold" />
              Market Status
            </h2>
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <div className="divide-y divide-border/20">
                  {marketStatus.map((market, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-foreground font-medium">
                            {market.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {market.time}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            market.status === "Open"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {market.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-foreground text-xl font-bold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-matka-gold" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { name: "Play Games", route: "/games", icon: Trophy },
              { name: "Add Money", route: "/add-money", icon: Wallet },
              { name: "Withdraw", route: "/withdraw", icon: TrendingUp },
              { name: "Wallet", route: "/wallet", icon: User },
              { name: "My Bets", route: "/betting-history", icon: Target },
              { name: "Support", route: "/support", icon: MessageSquare },
            ].map((action, index) => (
              <Card
                key={index}
                onClick={() => navigate(action.route)}
                className="bg-card/90 backdrop-blur-sm border-border/50 hover:border-matka-gold/50 transition-all duration-300 cursor-pointer"
              >
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 bg-matka-gold/20 rounded-full flex items-center justify-center">
                      <action.icon className="h-4 w-4 text-matka-gold" />
                    </div>
                    <p className="text-foreground font-medium">{action.name}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
