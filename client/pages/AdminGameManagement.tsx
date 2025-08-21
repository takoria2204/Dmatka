import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Clock,
  Trophy,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
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
  isActive: boolean;
  currentStatus: "waiting" | "open" | "closed" | "result_declared";
  lastResultDate?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminGameManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchGames();
  }, [navigate]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchGames();
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/games", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add current status based on time
          const gamesWithStatus = data.data.games.map((game: Game) => ({
            ...game,
            currentStatus: calculateGameStatus(game),
          }));
          setGames(gamesWithStatus);
          setLastUpdated(new Date());
        }
      } else if (response.status === 401) {
        navigate("/admin/login");
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load games",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateGameStatus = (game: Game) => {
    if (!game.isActive) return "waiting";

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    if (currentTime >= game.startTime && currentTime < game.endTime) {
      return "open";
    } else if (currentTime >= game.endTime && currentTime < game.resultTime) {
      return "closed";
    } else if (currentTime >= game.resultTime) {
      return "result_declared";
    } else {
      return "waiting";
    }
  };

  const toggleGameStatus = async (gameId: string, currentActive: boolean) => {
    setUpdating(gameId);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentActive,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "✅ Game Updated",
            description: `Game ${!currentActive ? "started" : "stopped"} successfully`,
            className: "border-green-500 bg-green-50 text-green-900",
          });
          fetchGames();
        }
      } else {
        throw new Error("Failed to update game");
      }
    } catch (error) {
      console.error("Error updating game:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update game status",
      });
    } finally {
      setUpdating(null);
    }
  };

  const forceChangeStatus = async (gameId: string, status: string) => {
    setUpdating(gameId);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/games/${gameId}/force-status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          forceStatus: status,
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Status Updated",
          description: `Game status changed to ${status}`,
          className: "border-green-500 bg-green-50 text-green-900",
        });
        setShowStatusModal(false);
        fetchGames();
      } else {
        throw new Error("Failed to change status");
      }
    } catch (error) {
      console.error("Error changing status:", error);
      toast({
        variant: "destructive",
        title: "Status Change Failed",
        description: "Failed to change game status",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
          <XCircle className="h-3 w-3 mr-1" />
          Stopped
        </Badge>
      );
    }

    switch (status) {
      case "open":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Play className="h-3 w-3 mr-1" />
            Betting Open
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Betting Closed
          </Badge>
        );
      case "waiting":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Waiting to Start
          </Badge>
        );
      case "result_declared":
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Result Declared
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            {status}
          </Badge>
        );
    }
  };

  const getGameIcon = (type: string) => {
    switch (type) {
      case "jodi":
        return <Target className="h-5 w-5" />;
      case "haruf":
        return <Zap className="h-5 w-5" />;
      case "crossing":
        return <Trophy className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
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
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Game Management
                {autoRefresh && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </h1>
              <p className="text-gray-400 text-sm">
                Start, stop, and manage all games
                {autoRefresh && " • Auto-refreshing every 15s"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant="outline"
              size="sm"
              className={`${
                autoRefresh
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "bg-gray-500/20 border-gray-500 text-gray-400"
              }`}
            >
              {autoRefresh ? "Auto ON" : "Auto OFF"}
            </Button>
            <Button
              onClick={fetchGames}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game._id} className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                      {getGameIcon(game.type)}
                    </div>
                    <div>
                      <CardTitle className="text-white">{game.name}</CardTitle>
                      <p className="text-gray-400 text-sm">
                        {game.type.toUpperCase()} Game
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(game.currentStatus, game.isActive)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Game Times */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Start</p>
                      <p className="text-white font-medium">{game.startTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">End</p>
                      <p className="text-white font-medium">{game.endTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Result</p>
                      <p className="text-white font-medium">
                        {game.resultTime}
                      </p>
                    </div>
                  </div>

                  {/* Game Details */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Min Bet</p>
                      <p className="text-green-400 font-medium">
                        ₹{game.minBet}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Max Bet</p>
                      <p className="text-red-400 font-medium">₹{game.maxBet}</p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-3 pt-2 border-t border-gray-600">
                    {/* Start/Stop Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">
                        Game Status
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm ${
                            game.isActive ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {game.isActive ? "Running" : "Stopped"}
                        </span>
                        <Switch
                          checked={game.isActive}
                          onCheckedChange={() =>
                            toggleGameStatus(game._id, game.isActive)
                          }
                          disabled={updating === game._id}
                        />
                      </div>
                    </div>

                    {/* Force Status Change Button */}
                    <Button
                      onClick={() => {
                        setSelectedGame(game);
                        setShowStatusModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                      disabled={updating === game._id}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Force Status Change
                    </Button>

                    {updating === game._id && (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                        <span className="text-gray-400 text-sm ml-2">
                          Updating...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Force Status Change Modal */}
        <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
          <DialogContent className="bg-[#2a2a2a] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                Force Status Change
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-300">
                Force change status for: <strong>{selectedGame?.name}</strong>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["waiting", "open", "closed", "result_declared"].map(
                  (status) => (
                    <Button
                      key={status}
                      onClick={() => setNewStatus(status)}
                      variant={newStatus === status ? "default" : "outline"}
                      className={`${
                        newStatus === status
                          ? "bg-yellow-500 text-black"
                          : "border-gray-600 text-gray-300"
                      }`}
                    >
                      {status.replace("_", " ").toUpperCase()}
                    </Button>
                  ),
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowStatusModal(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  selectedGame &&
                  newStatus &&
                  forceChangeStatus(selectedGame._id, newStatus)
                }
                disabled={!newStatus || updating === selectedGame?._id}
                className="bg-yellow-500 text-black hover:bg-yellow-600"
              >
                {updating === selectedGame?._id ? "Updating..." : "Apply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminGameManagement;
