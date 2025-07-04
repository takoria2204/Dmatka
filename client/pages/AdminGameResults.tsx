import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  Trophy,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
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

const AdminGameResults = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [declaring, setDeclaring] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showDeclareModal, setShowDeclareModal] = useState(false);
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
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      const [gamesResponse, resultsResponse] = await Promise.all([
        fetch("/api/admin/games", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/game-results", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json();
        setGames(gamesData.data.games || []);
      }

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setResults(resultsData.data.results || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclareResult = async () => {
    if (!selectedGame) return;

    // Validate result data
    if (selectedGame.type === "jodi" && !resultData.jodiResult) {
      alert("Please enter Jodi result");
      return;
    }
    if (selectedGame.type === "haruf" && !resultData.harufResult) {
      alert("Please enter Haruf result");
      return;
    }
    if (selectedGame.type === "crossing" && !resultData.crossingResult) {
      alert("Please enter Crossing result");
      return;
    }

    setDeclaring(true);
    try {
      const token = localStorage.getItem("admin_token");
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
        alert(
          `Result declared successfully! ${data.data.winnersCount} winners found. Platform profit: ₹${data.data.netProfit.toLocaleString()}`,
        );
        setShowDeclareModal(false);
        setSelectedGame(null);
        setResultData({
          jodiResult: "",
          harufResult: "",
          crossingResult: "",
          resultDate: new Date().toISOString().split("T")[0],
        });
        fetchData();
      } else {
        alert(data.message || "Failed to declare result");
      }
    } catch (error) {
      console.error("Error declaring result:", error);
      alert("Failed to declare result");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
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
          <Button
            onClick={fetchData}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Games List */}
        <Card className="bg-[#2a2a2a] border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Active Games - Declare Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <Card key={game._id} className="bg-[#1a1a1a] border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">{game.name}</h3>
                      <Badge
                        className={
                          game.currentStatus === "open"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }
                      >
                        {game.currentStatus}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <p>Type: {game.type.toUpperCase()}</p>
                      <p>
                        Time: {game.startTime} - {game.endTime}
                      </p>
                      <p>Result Time: {game.resultTime}</p>
                      <p>
                        Bet Range: ₹{game.minBet} - ₹{game.maxBet}
                      </p>
                    </div>
                    <Button
                      onClick={() => openDeclareModal(game)}
                      className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Declare Result
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No results declared yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.slice(0, 10).map((result) => (
                  <Card
                    key={result._id}
                    className="bg-[#1a1a1a] border-gray-600"
                  >
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <h3 className="text-white font-semibold">
                            {result.gameName}
                          </h3>
                          <p className="text-gray-400 text-sm capitalize">
                            {result.gameType}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(result.declaredAt || result.resultDate)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-sm">Results</p>
                          {result.jodiResult && (
                            <p className="text-yellow-400 font-bold text-lg">
                              Jodi: {result.jodiResult}
                            </p>
                          )}
                          {result.harufResult && (
                            <p className="text-yellow-400 font-bold text-lg">
                              Haruf: {result.harufResult}
                            </p>
                          )}
                          {result.crossingResult && (
                            <p className="text-yellow-400 font-bold text-lg">
                              Crossing: {result.crossingResult}
                            </p>
                          )}
                        </div>

                        <div className="text-center">
                          <p className="text-gray-400 text-sm">Total Bets</p>
                          <p className="text-white font-bold text-lg">
                            {result.totalBets}
                          </p>
                          <p className="text-gray-400 text-sm">
                            ₹{result.totalBetAmount.toLocaleString()}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-gray-400 text-sm">
                            Platform Profit
                          </p>
                          <p
                            className={`font-bold text-lg ${result.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            ₹{result.netProfit.toLocaleString()}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Winners: ₹
                            {result.totalWinningAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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

                {(selectedGame.type === "jodi" ||
                  selectedGame.type === "haruf") && (
                  <div>
                    <Label htmlFor="jodiResult" className="text-gray-300">
                      Jodi Result (2 digits: 00-99)
                    </Label>
                    <Input
                      id="jodiResult"
                      placeholder="Enter 2-digit result (e.g., 56)"
                      value={resultData.jodiResult}
                      onChange={(e) =>
                        setResultData((prev) => ({
                          ...prev,
                          jodiResult: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setResultData((prev) => ({
                          ...prev,
                          harufResult: e.target.value,
                        }))
                      }
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
                    <strong>Warning:</strong> Once declared, this result cannot
                    be changed. All winning bets will be automatically credited
                    to users' wallets.
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
                className="bg-yellow-500 text-black hover:bg-yellow-600"
              >
                {declaring ? "Declaring..." : "Declare Result"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminGameResults;
