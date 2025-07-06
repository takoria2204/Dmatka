import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Plus,
  Edit,
  Trash2,
  Trophy,
  CheckCircle,
  RefreshCw,
  Megaphone,
  Clock,
  AlertCircle,
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
  currentStatus: string;
  isActive: boolean;
  todayBets?: number;
  todayBetAmount?: number;
  hasResult?: boolean;
  needsResult?: boolean;
}

interface GameResult {
  _id: string;
  gameId: string;
  gameName: string;
  gameType: string;
  jodiResult?: string;
  harufResult?: string;
  crossingResult?: string;
  totalBets: number;
  totalBetAmount: number;
  totalWinningAmount: number;
  platformCommission: number;
  netProfit: number;
  status: "declared" | "pending";
  resultDate: string;
  declaredBy?: {
    fullName: string;
  };
  declaredAt?: string;
}

const AdminResults = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [declaring, setDeclaring] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [refreshing, setRefreshing] = useState(false);
  const [resultData, setResultData] = useState({
    jodiResult: "",
    harufResult: "",
    crossingResult: "",
    resultDate: new Date().toISOString().split("T")[0],
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }

    fetchData();

    // Auto-refresh every 30 seconds to get real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchData = async () => {
    try {
      if (!refreshing) setLoading(true);
      const token = localStorage.getItem("admin_token");

      console.log("🔄 Fetching latest data from backend...");

      const today = new Date().toISOString().split("T")[0];
      const [gamesResponse, resultsResponse, betsResponse] = await Promise.all([
        fetch("/api/admin/games", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/game-results?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/bets?date=${today}&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let gamesList = [];
      let resultsList = [];
      let todayBets = [];

      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json();
        gamesList = gamesData.data.games || [];
        setGames(gamesList);
        console.log("✅ Games loaded:", gamesList.length);
      } else {
        console.error("❌ Failed to fetch games:", gamesResponse.status);
      }

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        resultsList = resultsData.data.results || [];
        setResults(resultsList);
        console.log("✅ Results loaded:", resultsList.length);
      } else {
        console.error("❌ Failed to fetch results:", resultsResponse.status);
      }

      if (betsResponse.ok) {
        const betsData = await betsResponse.json();
        todayBets = betsData.data.bets || [];
        console.log("✅ Today's bets loaded:", todayBets.length);
      } else {
        console.error("❌ Failed to fetch bets:", betsResponse.status);
        // Don't break if bets API fails
        todayBets = [];
      }

      // Enhance games with betting statistics
      const gamesWithStats = gamesList.map((game) => {
        const gameBets = todayBets.filter(
          (bet) => bet.gameId === game._id || bet.gameId?._id === game._id,
        );
        const totalBets = gameBets.length;
        const totalBetAmount = gameBets.reduce(
          (sum, bet) => sum + (bet.betAmount || 0),
          0,
        );
        const hasResult = resultsList.some(
          (result) =>
            (result.gameId === game._id || result.gameId?._id === game._id) &&
            result.resultDate.startsWith(today),
        );

        return {
          ...game,
          todayBets: totalBets,
          todayBetAmount: totalBetAmount,
          hasResult: hasResult,
          needsResult:
            totalBets > 0 &&
            !hasResult &&
            (game.currentStatus === "closed" ||
              game.currentStatus === "result_declared"),
        };
      });

      setGames(gamesWithStats);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleDeclareResult = async () => {
    if (!selectedGame) return;

    // Validate result data based on game type
    if (selectedGame.type === "jodi" && !resultData.jodiResult) {
      alert("Please enter Jodi result (2 digits: 00-99)");
      return;
    }
    if (selectedGame.type === "haruf" && !resultData.harufResult) {
      alert("Please enter Haruf result (1 digit: 0-9)");
      return;
    }
    if (selectedGame.type === "crossing" && !resultData.crossingResult) {
      alert("Please enter Crossing result");
      return;
    }

    const confirmDeclare = confirm(
      `⚠️ CONFIRM RESULT DECLARATION\n\nGame: ${selectedGame.name}\nType: ${selectedGame.type.toUpperCase()}\nResult: ${
        resultData.jodiResult ||
        resultData.harufResult ||
        resultData.crossingResult
      }\n\n⚠️ Once declared, this cannot be undone!\nProceed?`,
    );

    if (!confirmDeclare) return;

    setDeclaring(true);
    try {
      const token = localStorage.getItem("admin_token");
      console.log("🎯 Declaring result for game:", selectedGame.name);

      const response = await fetch(
        `/api/admin/games/${selectedGame._id}/declare-result`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(resultData),
        },
      );

      const data = await response.json();

      if (response.ok) {
        const result = data.data;
        console.log("✅ Result declared successfully:", data);

        alert(`🎉 RESULT DECLARED SUCCESSFULLY!

📊 Game: ${selectedGame.name}
🎯 Result: ${resultData.jodiResult || resultData.harufResult || resultData.crossingResult}
👥 Winners: ${result.winnersCount} players
💰 Total Winnings: ₹${result.totalWinningAmount.toLocaleString()}
📈 Platform Profit: ₹${result.netProfit.toLocaleString()}

✅ All winnings have been credited to winners' accounts!`);

        // Close modal and reset form
        setShowDeclareModal(false);
        setSelectedGame(null);
        setResultData({
          jodiResult: "",
          harufResult: "",
          crossingResult: "",
          resultDate: new Date().toISOString().split("T")[0],
        });

        // Immediately refresh data to show updated results
        setTimeout(fetchData, 500);
      } else {
        console.error("❌ Failed to declare result:", data);
        alert(
          `❌ FAILED TO DECLARE RESULT\n\n${data.message || "Unknown error occurred"}\n\nPlease try again.`,
        );
      }
    } catch (error) {
      console.error("❌ Network error declaring result:", error);
      alert(
        "❌ NETWORK ERROR\n\nFailed to declare result. Please check your connection and try again.",
      );
    } finally {
      setDeclaring(false);
    }
  };

  const openDeclareModal = (game: Game) => {
    setSelectedGame(game);
    setResultData({
      jodiResult: "",
      harufResult: "",
      crossingResult: "",
      resultDate: new Date().toISOString().split("T")[0],
    });
    setShowDeclareModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate real-time statistics
  const pendingGames = games.filter(
    (game) =>
      game.needsResult ||
      (game.todayBets && game.todayBets > 0 && !game.hasResult),
  );

  const declaredResults = results.filter(
    (result) => result.status === "declared",
  );

  const today = new Date().toISOString().split("T")[0];
  const todayResults = results.filter(
    (result) =>
      result.resultDate.startsWith(today) && result.status === "declared",
  );

  const stats = {
    totalResults: results.length,
    pending: pendingGames.length,
    declared: declaredResults.length,
    cancelled: 0,
    todayProfit: todayResults.reduce((sum, r) => sum + (r.netProfit || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
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
              Game Results Management
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => {
                const pendingGame = pendingGames[0];
                if (pendingGame) {
                  openDeclareModal(pendingGame);
                } else {
                  alert("No pending games available for result declaration");
                }
              }}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Result
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.totalResults}
              </div>
              <div className="text-sm text-gray-400">Total Results</div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-600 border-yellow-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.pending}
              </div>
              <div className="text-sm text-yellow-100">Pending</div>
            </CardContent>
          </Card>

          <Card className="bg-green-600 border-green-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.declared}
              </div>
              <div className="text-sm text-green-100">Declared</div>
            </CardContent>
          </Card>

          <Card className="bg-red-600 border-red-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.cancelled}
              </div>
              <div className="text-sm text-red-100">Cancelled</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-600 border-blue-500">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">
                ₹{stats.todayProfit.toLocaleString()}
              </div>
              <div className="text-sm text-blue-100">Today's Profit</div>
            </CardContent>
          </Card>
        </div>

        {/* Game Results Section */}
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Game Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-[#1a1a1a]">
                <TabsTrigger value="pending" className="text-white">
                  Pending ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="declared" className="text-white">
                  Declared ({stats.declared})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="text-white">
                  Cancelled ({stats.cancelled})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-white">
                  All ({stats.totalResults})
                </TabsTrigger>
              </TabsList>

              {/* Pending Tab */}
              <TabsContent value="pending" className="mt-6">
                {pendingGames.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No pending results found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingGames.map((game) => (
                      <Card
                        key={game._id}
                        className="bg-[#1a1a1a] border-gray-600"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-yellow-500 text-black">
                                  PENDING
                                </Badge>
                                <h3 className="text-white font-semibold text-lg">
                                  {game.name}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="text-gray-300"
                                >
                                  {game.type.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400">Date & Time</p>
                                  <p className="text-white">
                                    {new Date().toLocaleDateString()}
                                  </p>
                                  <p className="text-gray-300">
                                    {game.startTime} - {game.endTime}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">
                                    Winning Number
                                  </p>
                                  <p className="text-yellow-400 font-bold text-lg">
                                    -
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Status</p>
                                  <p className="text-white capitalize">
                                    {game.currentStatus}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Result Time</p>
                                  <p className="text-white">
                                    {game.resultTime}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => openDeclareModal(game)}
                                className="bg-green-500 text-white hover:bg-green-600"
                                size="sm"
                              >
                                <Megaphone className="h-3 w-3 mr-1" />
                                Declare
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Declared Tab */}
              <TabsContent value="declared" className="mt-6">
                {declaredResults.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No declared results found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {declaredResults.slice(0, 20).map((result) => (
                      <Card
                        key={result._id}
                        className="bg-[#1a1a1a] border-gray-600"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-green-500 text-white">
                                  DECLARED
                                </Badge>
                                <h3 className="text-white font-semibold text-lg">
                                  {result.gameName}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="text-gray-300"
                                >
                                  {result.gameType.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400">Date & Time</p>
                                  <p className="text-white">
                                    {formatDate(
                                      result.declaredAt || result.resultDate,
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">
                                    Winning Number
                                  </p>
                                  <div className="space-y-1">
                                    {result.jodiResult && (
                                      <p className="text-yellow-400 font-bold text-lg">
                                        {result.jodiResult}
                                      </p>
                                    )}
                                    {result.harufResult && (
                                      <p className="text-yellow-400 font-bold">
                                        Haruf: {result.harufResult}
                                      </p>
                                    )}
                                    {result.crossingResult && (
                                      <p className="text-yellow-400 font-bold">
                                        Crossing: {result.crossingResult}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-400">
                                    Bets & Winning
                                  </p>
                                  <p className="text-white">
                                    {result.totalBets} bets
                                  </p>
                                  <p className="text-gray-300">
                                    ₹
                                    {result.totalWinningAmount.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Profit</p>
                                  <p
                                    className={`font-bold ${result.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                                  >
                                    ₹{result.netProfit.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* All Tab */}
              <TabsContent value="all" className="mt-6">
                <div className="space-y-4">
                  {/* Show pending games first */}
                  {pendingGames.map((game) => (
                    <Card
                      key={`pending-${game._id}`}
                      className="bg-[#1a1a1a] border-gray-600"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className="bg-yellow-500 text-black">
                                PENDING
                              </Badge>
                              <h3 className="text-white font-semibold text-lg">
                                {game.name}
                              </h3>
                            </div>
                            <p className="text-gray-400">
                              Game ready for result declaration
                            </p>
                          </div>
                          <Button
                            onClick={() => openDeclareModal(game)}
                            className="bg-green-500 text-white hover:bg-green-600"
                            size="sm"
                          >
                            Declare
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Show declared results */}
                  {declaredResults.slice(0, 10).map((result) => (
                    <Card
                      key={`declared-${result._id}`}
                      className="bg-[#1a1a1a] border-gray-600"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className="bg-green-500 text-white">
                                DECLARED
                              </Badge>
                              <h3 className="text-white font-semibold text-lg">
                                {result.gameName}
                              </h3>
                            </div>
                            <p className="text-gray-400">
                              Result:{" "}
                              {result.jodiResult ||
                                result.harufResult ||
                                result.crossingResult}{" "}
                              | Profit: ₹{result.netProfit.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Cancelled Tab */}
              <TabsContent value="cancelled" className="mt-6">
                <div className="text-center py-8">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No cancelled results found</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Declare Result Modal */}
        <Dialog open={showDeclareModal} onOpenChange={setShowDeclareModal}>
          <DialogContent className="sm:max-w-[500px] bg-[#2a2a2a] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                Declare Result - {selectedGame?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedGame && (
              <div className="space-y-4">
                <div className="bg-gray-800 p-3 rounded">
                  <p className="text-gray-300">
                    <strong>Game:</strong> {selectedGame.name}
                  </p>
                  <p className="text-gray-300">
                    <strong>Type:</strong> {selectedGame.type.toUpperCase()}
                  </p>
                  <p className="text-gray-300">
                    <strong>Result Time:</strong> {selectedGame.resultTime}
                  </p>
                </div>

                <div>
                  <Label htmlFor="resultDate" className="text-gray-300">
                    Result Date
                  </Label>
                  <Input
                    id="resultDate"
                    type="date"
                    value={resultData.resultDate}
                    onChange={(e) =>
                      setResultData((prev) => ({
                        ...prev,
                        resultDate: e.target.value,
                      }))
                    }
                    className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                  />
                </div>

                {selectedGame.type === "jodi" && (
                  <div>
                    <Label htmlFor="jodiResult" className="text-gray-300">
                      Jodi Result (2 digits: 00-99)
                    </Label>
                    <Input
                      id="jodiResult"
                      placeholder="Enter 2-digit result (e.g., 56)"
                      value={resultData.jodiResult}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 2);
                        setResultData((prev) => ({
                          ...prev,
                          jodiResult: value,
                        }));
                      }}
                      className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                      maxLength={2}
                    />
                  </div>
                )}

                {selectedGame.type === "haruf" && (
                  <div>
                    <Label htmlFor="harufResult" className="text-gray-300">
                      Haruf Result (1 digit: 0-9)
                    </Label>
                    <Input
                      id="harufResult"
                      placeholder="Enter single digit (e.g., 7)"
                      value={resultData.harufResult}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 1);
                        setResultData((prev) => ({
                          ...prev,
                          harufResult: value,
                        }));
                      }}
                      className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                      maxLength={1}
                    />
                  </div>
                )}

                {selectedGame.type === "crossing" && (
                  <div>
                    <Label htmlFor="crossingResult" className="text-gray-300">
                      Crossing Result
                    </Label>
                    <Input
                      id="crossingResult"
                      placeholder="Enter crossing result"
                      value={resultData.crossingResult}
                      onChange={(e) =>
                        setResultData((prev) => ({
                          ...prev,
                          crossingResult: e.target.value,
                        }))
                      }
                      className="mt-2 bg-[#1a1a1a] border-gray-600 text-white"
                    />
                  </div>
                )}

                <div className="bg-yellow-500/20 border border-yellow-500/30 p-3 rounded">
                  <p className="text-yellow-300 text-sm">
                    <strong>⚠️ WARNING:</strong> Once declared, this result
                    cannot be changed. All winning bets will be automatically
                    credited to users' wallets.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeclareModal(false)}
                disabled={declaring}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeclareResult}
                disabled={declaring}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                {declaring ? "Declaring..." : "🎯 Declare Result"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminResults;
