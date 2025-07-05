import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Clock,
  Trophy,
  Wallet,
  TrendingUp,
  AlertCircle,
  Play,
  Star,
  Target,
  Zap,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Game {
  _id: string;
  name: string;
  type: "jodi" | "haruf" | "crossing";
  description: string;
  startTime: string;
  endTime: string;
  resultTime: string;
  minBet: number;
  maxBet: number;
  jodiPayout: number;
  harufPayout: number;
  crossingPayout: number;
  currentStatus: "waiting" | "open" | "closed" | "result_declared";
}

interface Wallet {
  depositBalance: number;
  winningBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

const GamePlay = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [game, setGame] = useState<Game | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedBetType, setSelectedBetType] = useState<
    "jodi" | "haruf" | "crossing"
  >("jodi");

  // Bet form state
  const [betData, setBetData] = useState({
    betNumber: "",
    betAmount: "",
    harufPosition: "first" as "first" | "last",
    crossingCombination: "",
  });

  // Hot numbers and trending bets (mock data)
  const [hotNumbers, setHotNumbers] = useState({
    jodi: ["12", "34", "56", "78"],
    haruf: ["1", "3", "5", "7"],
    crossing: ["12-34", "56-78"],
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!gameId) {
      navigate("/games");
      return;
    }
    fetchGameData();
    fetchWalletData();
  }, [user, gameId, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (game) {
        updateCountdown();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [game]);

  const fetchGameData = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("matka_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGame(data.data);
      } else {
        navigate("/games");
      }
    } catch (error) {
      console.error("Error fetching game:", error);
      navigate("/games");
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      console.log("Fetching wallet data...");
      const response = await fetch("/api/wallet/balance", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("matka_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Wallet data received:", data.data);
        setWallet(data.data);
      } else {
        console.error("Failed to fetch wallet data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  };

  const updateCountdown = () => {
    if (!game) return;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    let targetTime = "";
    if (currentTime < game.startTime) {
      targetTime = game.startTime;
    } else if (currentTime < game.endTime) {
      targetTime = game.endTime;
    } else if (currentTime < game.resultTime) {
      targetTime = game.resultTime;
    }

    if (targetTime) {
      const [hours, minutes] = targetTime.split(":");
      const target = new Date();
      target.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (target < now) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const hours_left = Math.floor(diff / (1000 * 60 * 60));
      const minutes_left = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds_left = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        hours: hours_left,
        minutes: minutes_left,
        seconds: seconds_left,
      });
    }
  };

  const handleNumberSelect = (number: string) => {
    setBetData((prev) => ({ ...prev, betNumber: number }));
  };

  const handlePlaceBet = () => {
    if (!betData.betNumber || !betData.betAmount) {
      toast({
        variant: "destructive",
        title: "Incomplete Bet Details",
        description: "Please select a number and enter bet amount",
      });
      return;
    }

    const amount = parseFloat(betData.betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid bet amount",
      });
      return;
    }

    if (!game) return;

    if (amount < game.minBet) {
      toast({
        variant: "destructive",
        title: "Amount Too Low",
        description: `Minimum bet amount is ₹${game.minBet}`,
      });
      return;
    }

    if (amount > game.maxBet) {
      toast({
        variant: "destructive",
        title: "Amount Too High",
        description: `Maximum bet amount is ₹${game.maxBet}`,
      });
      return;
    }

    if (!wallet || wallet.depositBalance < amount) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `Add money to your wallet. Current balance: ₹${wallet?.depositBalance || 0}`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/add-money")}
          >
            Add Money
          </Button>
        ),
      });
      return;
    }

    setShowBetModal(true);
  };

  const confirmBet = async () => {
    if (placing) return;

    setPlacing(true);

    try {
      const token = localStorage.getItem("matka_token");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please login again to place bet",
        });
        navigate("/login");
        return;
      }

      const betPayload = {
        gameId,
        betType: selectedBetType,
        betNumber: betData.betNumber,
        betAmount: parseFloat(betData.betAmount),
        betData: {
          jodiNumber:
            selectedBetType === "jodi" ? betData.betNumber : undefined,
          harufDigit:
            selectedBetType === "haruf" ? betData.betNumber : undefined,
          harufPosition:
            selectedBetType === "haruf" ? betData.harufPosition : undefined,
          crossingCombination:
            selectedBetType === "crossing"
              ? betData.crossingCombination
              : undefined,
        },
      };

      console.log("🎯 Placing bet:", betPayload);

      const response = await fetch("/api/games/place-bet", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(betPayload),
      });

      const data = await response.json();
      console.log("📊 Response:", data);

      if (response.ok && data.success) {
        // Success - show success toast
        toast({
          title: "✅ Bet Placed Successfully!",
          description: `₹${betData.betAmount} deducted. Bet placed on ${selectedBetType.toUpperCase()} - ${betData.betNumber}`,
          className: "border-green-500 bg-green-50 text-green-900",
        });

        // Update wallet balance immediately
        setWallet((prev) =>
          prev
            ? {
                ...prev,
                depositBalance: data.data.currentBalance,
              }
            : null,
        );

        // Close modal and reset form
        setShowBetModal(false);
        setBetData({
          betNumber: "",
          betAmount: "",
          harufPosition: "first",
          crossingCombination: "",
        });

        // Refresh wallet data for consistency
        await fetchWalletData();
      } else {
        // Error handling based on response
        const errorMessage = data.message || "Failed to place bet";

        if (
          data.type === "insufficient_balance" ||
          errorMessage.includes("Insufficient")
        ) {
          toast({
            variant: "destructive",
            title: "Insufficient Balance",
            description: `Add money to your wallet. ${errorMessage}`,
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/add-money")}
              >
                Add Money
              </Button>
            ),
          });
        } else if (
          errorMessage.includes("not open") ||
          errorMessage.includes("closed")
        ) {
          toast({
            variant: "destructive",
            title: "Betting Closed",
            description: "This game is not accepting bets right now",
          });
        } else if (response.status === 401) {
          toast({
            variant: "destructive",
            title: "Session Expired",
            description: "Please login again",
          });
          navigate("/login");
        } else {
          toast({
            variant: "destructive",
            title: "Bet Failed",
            description: errorMessage,
          });
        }
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description:
          "Failed to connect to server. Please check your internet connection.",
      });
    } finally {
      setPlacing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500";
      case "closed":
        return "bg-yellow-500";
      case "waiting":
        return "bg-blue-500";
      case "result_declared":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Betting Open";
      case "closed":
        return "Betting Closed";
      case "waiting":
        return "Waiting to Start";
      case "result_declared":
        return "Result Declared";
      default:
        return status;
    }
  };

  const calculatePotentialWinning = () => {
    if (!game || !betData.betAmount) return 0;
    const amount = parseFloat(betData.betAmount);
    if (isNaN(amount)) return 0;

    switch (selectedBetType) {
      case "jodi":
        return amount * game.jodiPayout;
      case "haruf":
        return amount * game.harufPayout;
      case "crossing":
        return amount * game.crossingPayout;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Game Not Found
          </h1>
          <Button onClick={() => navigate("/games")}>Back to Games</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-matka-dark">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/games")}
              className="text-foreground hover:text-matka-gold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {game.name}
              </h1>
              <p className="text-muted-foreground">{game.description}</p>
            </div>
          </div>
          <Badge className={getStatusColor(game.currentStatus)}>
            {getStatusText(game.currentStatus)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Info & Timer */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Balance */}
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-matka-gold">
                    ₹{wallet?.depositBalance.toLocaleString() || 0}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Available for betting
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate("/add-money")}
                    className="mt-2 bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
                  >
                    Add Money
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Game Timer */}
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Game Timer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-matka-gold mb-2">
                    {String(countdown.hours).padStart(2, "0")}:
                    {String(countdown.minutes).padStart(2, "0")}:
                    {String(countdown.seconds).padStart(2, "0")}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {game.currentStatus === "open"
                      ? "Time left to bet"
                      : game.currentStatus === "closed"
                        ? "Result announcement in"
                        : game.currentStatus === "waiting"
                          ? "Game starts in"
                          : "Next game in"}
                  </p>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Time:</span>
                    <span className="text-foreground">{game.startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Time:</span>
                    <span className="text-foreground">{game.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Result Time:</span>
                    <span className="text-foreground">{game.resultTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hot Numbers */}
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Hot Numbers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Jodi
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hotNumbers.jodi.map((num) => (
                        <Button
                          key={num}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBetType("jodi");
                            handleNumberSelect(num);
                          }}
                          className="text-xs border-matka-gold/30 text-matka-gold hover:bg-matka-gold/10"
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Haruf
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hotNumbers.haruf.map((num) => (
                        <Button
                          key={num}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBetType("haruf");
                            handleNumberSelect(num);
                          }}
                          className="text-xs border-matka-gold/30 text-matka-gold hover:bg-matka-gold/10"
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Play Area */}
          <div className="lg:col-span-2">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Place Your Bet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={selectedBetType}
                  onValueChange={(value: any) => setSelectedBetType(value)}
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger
                      value="jodi"
                      className="flex items-center gap-2"
                    >
                      <Target className="h-4 w-4" />
                      Jodi ({game.jodiPayout}:1)
                    </TabsTrigger>
                    <TabsTrigger
                      value="haruf"
                      className="flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Haruf ({game.harufPayout}:1)
                    </TabsTrigger>
                    <TabsTrigger
                      value="crossing"
                      className="flex items-center gap-2"
                    >
                      <Trophy className="h-4 w-4" />
                      Crossing ({game.crossingPayout}:1)
                    </TabsTrigger>
                  </TabsList>

                  {/* Jodi Game */}
                  <TabsContent value="jodi">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground">
                          Select 2-Digit Number (00-99)
                        </Label>
                        <div className="grid grid-cols-10 gap-2 mt-2">
                          {Array.from({ length: 100 }, (_, i) => {
                            const num = String(i).padStart(2, "0");
                            return (
                              <Button
                                key={num}
                                variant={
                                  betData.betNumber === num
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handleNumberSelect(num)}
                                className={`text-xs ${
                                  betData.betNumber === num
                                    ? "bg-matka-gold text-matka-dark"
                                    : "border-border hover:border-matka-gold"
                                }`}
                              >
                                {num}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Haruf Game */}
                  <TabsContent value="haruf">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground">Position</Label>
                        <Select
                          value={betData.harufPosition}
                          onValueChange={(value: "first" | "last") =>
                            setBetData((prev) => ({
                              ...prev,
                              harufPosition: value,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="first">First Digit</SelectItem>
                            <SelectItem value="last">Last Digit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-foreground">
                          Select Single Digit (0-9)
                        </Label>
                        <div className="grid grid-cols-10 gap-2 mt-2">
                          {Array.from({ length: 10 }, (_, i) => {
                            const num = String(i);
                            return (
                              <Button
                                key={num}
                                variant={
                                  betData.betNumber === num
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handleNumberSelect(num)}
                                className={`text-xs ${
                                  betData.betNumber === num
                                    ? "bg-matka-gold text-matka-dark"
                                    : "border-border hover:border-matka-gold"
                                }`}
                              >
                                {num}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Crossing Game */}
                  <TabsContent value="crossing">
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-muted/30 rounded">
                        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-foreground">
                          Crossing game rules will be implemented based on admin
                          configuration
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Select your crossing combination
                        </p>
                      </div>
                      <div>
                        <Label className="text-foreground">
                          Manual Number Entry
                        </Label>
                        <Input
                          placeholder="Enter crossing combination"
                          value={betData.betNumber}
                          onChange={(e) =>
                            setBetData((prev) => ({
                              ...prev,
                              betNumber: e.target.value,
                            }))
                          }
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Bet Amount Input */}
                <div className="mt-6 space-y-4">
                  <div>
                    <Label className="text-foreground">
                      Bet Amount (₹{game.minBet} - ₹{game.maxBet})
                    </Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={betData.betAmount}
                      onChange={(e) =>
                        setBetData((prev) => ({
                          ...prev,
                          betAmount: e.target.value,
                        }))
                      }
                      min={game.minBet}
                      max={game.maxBet}
                      className="mt-2"
                    />
                  </div>

                  {/* Potential Winning Display */}
                  {betData.betAmount && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">
                          Potential Winning:
                        </span>
                        <span className="text-green-500 font-bold text-lg">
                          ₹{calculatePotentialWinning().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Place Bet Button */}
                  <Button
                    onClick={handlePlaceBet}
                    disabled={
                      game.currentStatus !== "open" ||
                      !betData.betNumber ||
                      !betData.betAmount
                    }
                    className="w-full bg-matka-gold text-matka-dark hover:bg-matka-gold-dark font-semibold py-3"
                  >
                    {game.currentStatus !== "open"
                      ? `Betting ${game.currentStatus === "closed" ? "Closed" : "Not Open"}`
                      : "Place Bet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bet Confirmation Modal */}
        <Dialog open={showBetModal} onOpenChange={setShowBetModal}>
          <DialogContent className="sm:max-w-[400px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Confirm Your Bet
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted/30 rounded">
                <h3 className="text-lg font-bold text-foreground">
                  {game.name}
                </h3>
                <p className="text-muted-foreground">
                  {selectedBetType.toUpperCase()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number:</span>
                  <span className="text-foreground font-bold text-lg">
                    {betData.betNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bet Amount:</span>
                  <span className="text-foreground font-bold">
                    ₹{parseFloat(betData.betAmount || "0").toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Potential Winning:
                  </span>
                  <span className="text-green-500 font-bold">
                    ₹{calculatePotentialWinning().toLocaleString()}
                  </span>
                </div>
                {selectedBetType === "haruf" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <span className="text-foreground">
                      {betData.harufPosition} digit
                    </span>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBetModal(false)}
                className="border-border text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBet}
                className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
              >
                Confirm Bet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GamePlay;
