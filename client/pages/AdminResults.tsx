import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Megaphone,
} from "lucide-react";

interface GameResult {
  _id?: string;
  gameName: string;
  gameType: "single" | "jodi" | "panna";
  sessionType: "open" | "close";
  resultDate: string;
  resultTime: string;
  winningNumber: string;
  status: "pending" | "declared" | "cancelled";
  declaredBy?: string;
  declaredAt?: string;
  totalBets: number;
  totalWinning: number;
  profit: number;
}

const AdminResults = () => {
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResult, setEditingResult] = useState<GameResult | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [formData, setFormData] = useState({
    gameName: "",
    gameType: "single" as const,
    sessionType: "open" as const,
    resultDate: "",
    resultTime: "",
    winningNumber: "",
    status: "pending" as const,
  });

  const navigate = useNavigate();

  // Sample games data
  const games = [
    "KALYAN",
    "MAIN MUMBAI",
    "MILAN DAY",
    "RAJDHANI DAY",
    "SUPREME DAY",
    "SRIDEVI",
    "MADHUR DAY",
    "TIME BAZAR",
    "KALYAN NIGHT",
    "MAIN MUMBAI NIGHT",
  ];

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }

    fetchResults();
  }, [navigate]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      // Since we don't have a backend endpoint yet, using mock data
      const mockResults: GameResult[] = [
        {
          _id: "1",
          gameName: "KALYAN",
          gameType: "single",
          sessionType: "open",
          resultDate: "2024-01-03",
          resultTime: "15:30",
          winningNumber: "156",
          status: "pending",
          totalBets: 125,
          totalWinning: 45000,
          profit: 15000,
        },
        {
          _id: "2",
          gameName: "MAIN MUMBAI",
          gameType: "jodi",
          sessionType: "close",
          resultDate: "2024-01-03",
          resultTime: "16:30",
          winningNumber: "78",
          status: "declared",
          declaredBy: "Admin",
          declaredAt: "2024-01-03T16:35:00Z",
          totalBets: 89,
          totalWinning: 32000,
          profit: 8000,
        },
        {
          _id: "3",
          gameName: "MILAN DAY",
          gameType: "panna",
          sessionType: "open",
          resultDate: "2024-01-03",
          resultTime: "14:00",
          winningNumber: "123",
          status: "declared",
          declaredBy: "Admin",
          declaredAt: "2024-01-03T14:05:00Z",
          totalBets: 67,
          totalWinning: 28000,
          profit: 12000,
        },
      ];

      setResults(mockResults);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResult = () => {
    setEditingResult(null);
    setFormData({
      gameName: "",
      gameType: "single",
      sessionType: "open",
      resultDate: "",
      resultTime: "",
      winningNumber: "",
      status: "pending",
    });
    setShowModal(true);
  };

  const handleEditResult = (result: GameResult) => {
    setEditingResult(result);
    setFormData({
      gameName: result.gameName,
      gameType: result.gameType,
      sessionType: result.sessionType,
      resultDate: result.resultDate,
      resultTime: result.resultTime,
      winningNumber: result.winningNumber,
      status: result.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.gameName || !formData.resultDate || !formData.resultTime) {
        alert("Please fill all required fields");
        return;
      }

      if (formData.status === "declared" && !formData.winningNumber) {
        alert("Please enter winning number for declared result");
        return;
      }

      // Mock save - in production, you'd call your backend API
      const newResult: GameResult = {
        _id: editingResult?._id || String(Date.now()),
        ...formData,
        totalBets: editingResult?.totalBets || 0,
        totalWinning: editingResult?.totalWinning || 0,
        profit: editingResult?.profit || 0,
        declaredBy: formData.status === "declared" ? "Admin" : undefined,
        declaredAt:
          formData.status === "declared" ? new Date().toISOString() : undefined,
      };

      if (editingResult) {
        setResults((prev) =>
          prev.map((r) => (r._id === editingResult._id ? newResult : r)),
        );
        alert("Result updated successfully!");
      } else {
        setResults((prev) => [newResult, ...prev]);
        alert("Result added successfully!");
      }

      setShowModal(false);
      setFormData({
        gameName: "",
        gameType: "single",
        sessionType: "open",
        resultDate: "",
        resultTime: "",
        winningNumber: "",
        status: "pending",
      });
    } catch (error) {
      console.error("Error saving result:", error);
      alert("Failed to save result");
    }
  };

  const handleDeclareResult = async (result: GameResult) => {
    if (!result.winningNumber) {
      alert("Please set winning number first");
      return;
    }

    const confirmDeclare = confirm(
      `Are you sure you want to declare result for ${result.gameName}?`,
    );
    if (!confirmDeclare) return;

    try {
      const updatedResult = {
        ...result,
        status: "declared" as const,
        declaredBy: "Admin",
        declaredAt: new Date().toISOString(),
      };

      setResults((prev) =>
        prev.map((r) => (r._id === result._id ? updatedResult : r)),
      );

      alert("Result declared successfully!");
    } catch (error) {
      console.error("Error declaring result:", error);
      alert("Failed to declare result");
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!confirm("Are you sure you want to delete this result?")) {
      return;
    }

    try {
      setResults((prev) => prev.filter((r) => r._id !== resultId));
      alert("Result deleted successfully!");
    } catch (error) {
      console.error("Error deleting result:", error);
      alert("Failed to delete result");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "declared":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const filteredResults = results.filter((result) => {
    if (activeTab === "all") return true;
    return result.status === activeTab;
  });

  const stats = {
    total: results.length,
    pending: results.filter((r) => r.status === "pending").length,
    declared: results.filter((r) => r.status === "declared").length,
    cancelled: results.filter((r) => r.status === "cancelled").length,
    todayProfit: results
      .filter((r) => r.resultDate === new Date().toISOString().split("T")[0])
      .reduce((sum, r) => sum + r.profit, 0),
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
          <div className="flex gap-2">
            <Button
              onClick={fetchResults}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleAddResult}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Result
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total Results</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.pending}
                </p>
                <p className="text-sm text-yellow-300">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {stats.declared}
                </p>
                <p className="text-sm text-green-300">Declared</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500/20 border-red-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {stats.cancelled}
                </p>
                <p className="text-sm text-red-300">Cancelled</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  ₹{stats.todayProfit.toLocaleString()}
                </p>
                <p className="text-sm text-blue-300">Today's Profit</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Results */}
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
                  All ({stats.total})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No results found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredResults.map((result) => (
                      <Card
                        key={result._id}
                        className="bg-[#1a1a1a] border-gray-600"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <Badge
                                  className={getStatusColor(result.status)}
                                >
                                  {result.status.toUpperCase()}
                                </Badge>
                                <span className="text-white font-semibold text-lg">
                                  {result.gameName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-gray-300"
                                >
                                  {result.gameType.toUpperCase()}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-gray-300"
                                >
                                  {result.sessionType.toUpperCase()}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-gray-400 text-sm">
                                    Date & Time
                                  </p>
                                  <p className="text-white font-medium">
                                    {formatDate(result.resultDate)}
                                  </p>
                                  <p className="text-gray-300 text-sm">
                                    {result.resultTime}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-400 text-sm">
                                    Winning Number
                                  </p>
                                  <p className="text-white font-bold text-xl">
                                    {result.winningNumber || "---"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-400 text-sm">
                                    Bets & Winning
                                  </p>
                                  <p className="text-white font-medium">
                                    {result.totalBets} bets
                                  </p>
                                  <p className="text-green-400 text-sm">
                                    ₹{result.totalWinning.toLocaleString()}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-gray-400 text-sm">
                                    Profit
                                  </p>
                                  <p className="text-green-400 font-bold text-lg">
                                    ₹{result.profit.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {result.status === "declared" &&
                                result.declaredAt && (
                                  <div className="mt-3 p-2 bg-green-900/20 rounded border border-green-500/30">
                                    <p className="text-green-400 text-sm">
                                      <CheckCircle className="h-4 w-4 inline mr-2" />
                                      Declared by {result.declaredBy} on{" "}
                                      {new Date(
                                        result.declaredAt,
                                      ).toLocaleString("en-IN")}
                                    </p>
                                  </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditResult(result)}
                                className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>

                              {result.status === "pending" &&
                                result.winningNumber && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleDeclareResult(result)}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    <Megaphone className="h-3 w-3 mr-1" />
                                    Declare
                                  </Button>
                                )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  result._id && handleDeleteResult(result._id)
                                }
                                className="text-red-400 border-red-400 hover:bg-red-400/20"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Add/Edit Result Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[600px] bg-[#2a2a2a] border-gray-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingResult ? "Edit Result" : "Add New Result"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gameName" className="text-right text-gray-300">
                  Game Name *
                </Label>
                <Select
                  value={formData.gameName}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gameName: value }))
                  }
                >
                  <SelectTrigger className="col-span-3 bg-[#1a1a1a] border-gray-600 text-white">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((game) => (
                      <SelectItem key={game} value={game}>
                        {game}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gameType" className="text-right text-gray-300">
                  Game Type *
                </Label>
                <Select
                  value={formData.gameType}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, gameType: value }))
                  }
                >
                  <SelectTrigger className="col-span-3 bg-[#1a1a1a] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="jodi">Jodi</SelectItem>
                    <SelectItem value="panna">Panna</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="sessionType"
                  className="text-right text-gray-300"
                >
                  Session *
                </Label>
                <Select
                  value={formData.sessionType}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, sessionType: value }))
                  }
                >
                  <SelectTrigger className="col-span-3 bg-[#1a1a1a] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="close">Close</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="resultDate"
                  className="text-right text-gray-300"
                >
                  Date *
                </Label>
                <Input
                  id="resultDate"
                  type="date"
                  value={formData.resultDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      resultDate: e.target.value,
                    }))
                  }
                  className="col-span-3 bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="resultTime"
                  className="text-right text-gray-300"
                >
                  Time *
                </Label>
                <Input
                  id="resultTime"
                  type="time"
                  value={formData.resultTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      resultTime: e.target.value,
                    }))
                  }
                  className="col-span-3 bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="winningNumber"
                  className="text-right text-gray-300"
                >
                  Winning Number
                </Label>
                <Input
                  id="winningNumber"
                  placeholder="e.g., 156, 78, 123"
                  value={formData.winningNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      winningNumber: e.target.value,
                    }))
                  }
                  className="col-span-3 bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right text-gray-300">
                  Status *
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="col-span-3 bg-[#1a1a1a] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="declared">Declared</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {editingResult ? "Update Result" : "Add Result"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminResults;
