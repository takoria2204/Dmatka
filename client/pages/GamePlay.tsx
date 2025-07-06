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
  RefreshCw,
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

  // Circuit breaker to prevent repeated failed attempts
  const [isOffline, setIsOffline] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Safe fetch wrapper to prevent console errors
  const safeFetch = async (
    url: string,
    options?: RequestInit,
  ): Promise<Response | null> => {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      // Silent catch - no console errors
      return null;
    }
  };

  useEffect(() => {
    console.log("🔍 GamePlay useEffect - checking auth...");
    console.log("User:", user);
    console.log("GameId:", gameId);

    const token = localStorage.getItem("matka_token");
    console.log("Token:", token ? "Present" : "Missing");
    console.log("Navigator online:", navigator.onLine);

    // Check for authentication but don't immediately activate demo mode
    if (!token) {
      console.log("⚠️ No auth token found, will try to fetch anyway");
      // Don't immediately activate demo mode - let the fetch attempt happen first
    }

    if (!navigator.onLine) {
      console.log("🔌 Browser reports offline, activating demo mode");
      activateDemoMode();
      setLoading(false);
      return;
    }

    if (!user) {
      console.log("🎮 No user found, activating demo mode");
      activateDemoMode();
      setLoading(false);
      return;
    }

    if (!gameId) {
      console.log("❌ No gameId found, redirecting to games");
      navigate("/games");
      return;
    }

    console.log("✅ Auth check passed, fetching data...");
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

  const updatePayoutRates = async () => {
    try {
      const token = localStorage.getItem("matka_token");
      const response = await fetch("/api/admin/games/update-payouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        console.log("✅ Payout rates updated successfully");
      }
    } catch (error) {
      console.error("Failed to update payout rates:", error);
    }
  };

  const checkConnectivity = async (): Promise<boolean> => {
    // Circuit breaker: if we've failed multiple times, assume offline
    if (isOffline || failedAttempts >= 2) {
      console.log(
        `🔌 Circuit breaker active (${failedAttempts} failed attempts)`,
      );
      return false;
    }

    try {
      // Simple, fast connectivity check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // Very short timeout

      const response = await safeFetch("/api/ping", {
        method: "GET",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response && response.ok) {
        // Reset failed attempts on success
        setFailedAttempts(0);
        return true;
      } else {
        setFailedAttempts((prev) => prev + 1);
        return false;
      }
    } catch (error) {
      console.log("🔌 Connectivity check failed");
      setFailedAttempts((prev) => prev + 1);
      setIsOffline(true);
      return false;
    }
  };

  const activateDemoMode = () => {
    console.log("🎮 Activating demo mode for gameId:", gameId);

    // Set demo game data
    setGame({
      _id: "demo-game-id",
      name:
        gameId?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
        "Demo Game",
      type: "jodi",
      description: "Demo game - offline mode",
      startTime: "10:00",
      endTime: "17:30",
      resultTime: "18:00",
      minBet: 10,
      maxBet: 5000,
      jodiPayout: 95,
      harufPayout: 9,
      crossingPayout: 95,
      currentStatus: "open",
      isActive: true,
    });

    // Set demo wallet data
    setWallet({
      depositBalance: 1000,
      winningBalance: 500,
      totalDeposits: 2000,
      totalWithdrawals: 500,
    });

    toast({
      title: "Demo Mode Active",
      description:
        "Running offline with demo data. All features available for testing!",
      className: "border-yellow-500 bg-yellow-50 text-yellow-900",
    });
  };

  const fetchGameData = async () => {
    try {
      // First check if we have connectivity
      const hasConnectivity = await checkConnectivity();

      if (!hasConnectivity) {
        console.log("🔌 No connectivity detected, activating demo mode");
        activateDemoMode();
        return;
      }

      const token = localStorage.getItem("matka_token");
      if (!token) {
        console.log("No auth token found, activating demo mode");
        activateDemoMode();
        return;
      }

      console.log("🔄 Fetching game data for gameId:", gameId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await safeFetch(`/api/games/${gameId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json();
        console.log("✅ Game data received:", data.data);
        console.log("🎯 Current payout rates from server:", {
          jodi: data.data.jodiPayout,
          haruf: data.data.harufPayout,
          crossing: data.data.crossingPayout,
        });

        // Ensure we're using the server data and not falling back to demo
        setGame({
          ...data.data,
          // Force these from server response to avoid any cache issues
          jodiPayout: data.data.jodiPayout || 95,
          harufPayout: data.data.harufPayout || 9,
          crossingPayout: data.data.crossingPayout || 95,
        });

        console.log("🎮 Game state set with payout rates:", {
          jodi: data.data.jodiPayout || 95,
          haruf: data.data.harufPayout || 9,
          crossing: data.data.crossingPayout || 95,
        });
      } else if (response && response.status === 401) {
        console.log("Authentication failed, redirecting to login");
        localStorage.removeItem("matka_token");
        localStorage.removeItem("matka_user");
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please login again to continue.",
        });
        navigate("/login");
      } else if (response && response.status === 404) {
        console.log("Game not found, redirecting to games list");
        toast({
          variant: "destructive",
          title: "Game Not Found",
          description:
            "The requested game could not be found. Redirecting to games list.",
        });
        navigate("/games");
      } else if (response) {
        console.error("Failed to fetch game data:", response.status);
        toast({
          variant: "destructive",
          title: "Server Error",
          description: `Failed to load game data (Error ${response.status}). Please try again.`,
        });
        // Server error, activate demo mode
        activateDemoMode();
      } else {
        // No response (fetch failed), activate demo mode
        console.log("🔌 No response received, activating demo mode");
        activateDemoMode();
      }
    } catch (error: any) {
      console.error("Error fetching game:", error);

      if (error.name === "AbortError") {
        console.log("Game fetch timed out, activating demo mode");
        activateDemoMode();
      } else if (error.message.includes("Failed to fetch")) {
        console.log("Network error, activating demo mode");
        activateDemoMode();
      } else {
        // Other errors, activate demo mode instead of redirecting
        console.log("Unknown error, activating demo mode:", error);
        activateDemoMode();
      }

      // Don't set game to null, let fallback data handle it
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      // Skip wallet fetch if we already have demo wallet data
      if (wallet && wallet.depositBalance === 1000) {
        console.log("💡 Already using demo wallet data, skipping fetch");
        return;
      }

      // Check connectivity first
      const hasConnectivity = await checkConnectivity();
      if (!hasConnectivity) {
        console.log("🔌 No connectivity for wallet, using demo data");
        setWallet({
          depositBalance: 1000,
          winningBalance: 500,
          totalDeposits: 2000,
          totalWithdrawals: 500,
        });
        return;
      }

      const token = localStorage.getItem("matka_token");
      if (!token) {
        console.log("No auth token for wallet fetch, using demo data");
        setWallet({
          depositBalance: 1000,
          winningBalance: 500,
          totalDeposits: 2000,
          totalWithdrawals: 500,
        });
        return;
      }

      console.log("🔄 Fetching wallet data...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await safeFetch("/api/wallet/balance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json();
        console.log("✅ Wallet data received:", data.data);
        setWallet(data.data);
      } else if (response && response.status === 401) {
        console.log("Wallet auth failed");
        localStorage.removeItem("matka_token");
        localStorage.removeItem("matka_user");
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please login again to access your wallet.",
        });
        navigate("/login");
      } else if (response) {
        console.error("Failed to fetch wallet data:", response.status);
        // Set demo wallet data for errors
        setWallet({
          depositBalance: 1000,
          winningBalance: 500,
          totalDeposits: 2000,
          totalWithdrawals: 500,
        });
      } else {
        // No response (fetch failed), use demo wallet
        console.log("🔌 No wallet response, using demo data");
        setWallet({
          depositBalance: 1000,
          winningBalance: 500,
          totalDeposits: 2000,
          totalWithdrawals: 500,
        });
      }
    } catch (error: any) {
      console.error("Error fetching wallet:", error);

      if (error.name === "AbortError") {
        console.log("Wallet fetch timed out");
      } else if (error.message.includes("Failed to fetch")) {
        console.log("Network error fetching wallet - using demo data");
      }

      // Set demo wallet data for better offline experience
      setWallet({
        depositBalance: 1000, // Demo balance for testing
        winningBalance: 500,
        totalDeposits: 2000,
        totalWithdrawals: 500,
      });

      console.log("💡 Using demo wallet data for offline mode");
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

      // Check if in demo mode
      if (game._id === "demo-game-id") {
        // Demo mode - simulate successful bet placement
        toast({
          title: "✅ Demo Bet Placed!",
          description: `₹${betData.betAmount} demo bet placed on ${selectedBetType.toUpperCase()} - ${betData.betNumber}`,
          className: "border-yellow-500 bg-yellow-50 text-yellow-900",
        });

        // Update demo wallet balance
        setWallet((prev) =>
          prev
            ? {
                ...prev,
                depositBalance:
                  prev.depositBalance - parseFloat(betData.betAmount),
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

        return;
      }

      // Use XMLHttpRequest to avoid fetch stream conflicts
      const data: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/games/place-bet", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.onload = function () {
          console.log("📊 XHR status:", xhr.status);
          console.log("📊 XHR response:", xhr.responseText);

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText);
              resolve(responseData);
            } catch (parseError) {
              console.error("❌ Failed to parse JSON:", parseError);
              resolve({
                success: false,
                message: "Invalid response format",
                type: "parse_error",
              });
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              // Add proper error type based on status code
              if (xhr.status === 401) {
                errorData.type = "authentication_error";
              } else if (xhr.status === 400) {
                errorData.type = errorData.type || "validation_error";
              }
              resolve(errorData);
            } catch (parseError) {
              const errorType =
                xhr.status === 401 ? "authentication_error" : "server_error";
              resolve({
                success: false,
                message: `Server error (${xhr.status})`,
                type: errorType,
              });
            }
          }
        };

        xhr.onerror = function () {
          console.error("❌ XHR network error");
          reject(new Error("Network error"));
        };

        xhr.ontimeout = function () {
          console.error("❌ XHR timeout");
          reject(new Error("Request timeout"));
        };

        xhr.timeout = 30000; // 30 second timeout
        xhr.send(JSON.stringify(betPayload));
      });

      console.log("📊 Final data:", data);

      if (data?.success) {
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
                depositBalance:
                  data?.data?.currentBalance || prev.depositBalance,
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
        const errorMessage = data?.message || "Failed to place bet";

        if (
          data?.type === "insufficient_balance" ||
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
        } else if (
          data?.type === "authentication_error" ||
          errorMessage.includes("login") ||
          errorMessage.includes("unauthorized")
        ) {
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

  if (!game && !loading) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Clock className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Demo Mode Active
          </h1>
          <p className="text-muted-foreground mb-6">
            Running in offline demo mode. You can explore the betting interface
            with sample data.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                setLoading(true);
                fetchGameData();
                fetchWalletData();
              }}
              className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/games")}
              className="border-border text-foreground hover:bg-muted"
            >
              Back to Games
            </Button>
          </div>
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
          <div className="flex gap-2">
            <Badge className={getStatusColor(game.currentStatus)}>
              {getStatusText(game.currentStatus)}
            </Badge>
            {game._id === "demo-game-id" && (
              <Badge className="bg-yellow-500 text-black">Demo Mode</Badge>
            )}
          </div>
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
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => navigate("/add-money")}
                      className="flex-1 bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
                    >
                      Add Money
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        console.log("🔄 Manually refreshing game data...");
                        await fetchGameData();
                        await fetchWalletData();
                      }}
                      variant="outline"
                      className="border-matka-gold text-matka-gold hover:bg-matka-gold/10"
                    >
                      🔄
                    </Button>
                  </div>
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
                      !betData.betAmount ||
                      placing
                    }
                    className="w-full bg-matka-gold text-matka-dark hover:bg-matka-gold-dark font-semibold py-3"
                  >
                    {placing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-matka-dark border-t-transparent rounded-full mr-2"></div>
                        Placing Bet...
                      </>
                    ) : game.currentStatus !== "open" ? (
                      `Betting ${game.currentStatus === "closed" ? "Closed" : "Not Open"}`
                    ) : (
                      "Place Bet"
                    )}
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
                disabled={placing}
                className="border-border text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBet}
                disabled={placing}
                className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
              >
                {placing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-matka-dark border-t-transparent rounded-full mr-2"></div>
                    Placing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Bet
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GamePlay;
