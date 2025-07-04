import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Download,
  Filter,
  Eye,
  DollarSign,
  Trophy,
  Clock,
} from "lucide-react";

interface Bet {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    mobile: string;
  };
  gameId: string;
  gameName: string;
  gameType: "jodi" | "haruf" | "crossing";
  betType: "jodi" | "haruf" | "crossing";
  betNumber: string;
  betAmount: number;
  potentialWinning: number;
  winningAmount?: number;
  actualPayout?: number;
  isWinner?: boolean;
  status: "pending" | "won" | "lost" | "cancelled" | "refunded";
  betPlacedAt: string;
  gameDate: string;
  gameTime: string;
  betData?: {
    jodiNumber?: string;
    harufDigit?: string;
    harufPosition?: "first" | "last";
    crossingCombination?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BetStats {
  totalBets: number;
  totalAmount: number;
  totalWinnings: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
}

const AdminBets = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [gameTypeFilter, setGameTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBets: 0,
    hasPrev: false,
    hasNext: false,
  });

  const navigate = useNavigate();

  // Check admin authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminUser = localStorage.getItem("admin_user");

    if (!token || !adminUser) {
      navigate("/admin/login");
      return;
    }
  }, [navigate]);

  const fetchBets = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        console.error("No admin token found");
        navigate("/admin/login");
        return;
      }

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "20",
        ...(gameFilter !== "all" && { gameId: gameFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/bets?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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
      setBets(data.data.bets);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error("Error fetching bets:", error);
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error("Network error - backend server may not be running");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, [pagination.currentPage, gameFilter, statusFilter]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchBets();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "lost":
        return "text-red-500";
      case "cancelled":
        return "text-gray-500";
      default:
        return "text-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <Trophy className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "lost":
        return <DollarSign className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-matka-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-matka-gold border-t-transparent rounded-full"></div>
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
              onClick={() => navigate("/admin/dashboard")}
              className="text-foreground hover:text-matka-gold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Bet Management
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-muted"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by user, game, numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 bg-input border-border text-foreground"
                />
              </div>
              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Game" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="delhi-bazar">Delhi Bazar</SelectItem>
                  <SelectItem value="gali">Gali</SelectItem>
                  <SelectItem value="disawer">Disawer</SelectItem>
                  <SelectItem value="faridabad">Faridabad</SelectItem>
                  <SelectItem value="ghaziabad">Ghaziabad</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                className="bg-matka-gold text-matka-dark hover:bg-matka-gold-dark"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bets Table */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">
              Bets ({pagination.totalBets})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Game
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Bet Details
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bets.map((bet) => (
                    <tr
                      key={bet._id}
                      className="border-b border-border/50 hover:bg-muted/50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">
                            {bet.userId?.fullName || "N/A"}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {bet.userId?.mobile || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">
                            {bet.gameName}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {bet.betType}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">
                            {bet.betNumbers?.join(", ") || "N/A"}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            Potential: {formatAmount(bet.potentialWin || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">
                            {formatAmount(bet.amount)}
                          </span>
                          {bet.winAmount && (
                            <span className="text-green-500 text-sm">
                              Won: {formatAmount(bet.winAmount)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div
                          className={`flex items-center gap-2 ${getStatusColor(bet.status)}`}
                        >
                          {getStatusIcon(bet.status)}
                          <span className="capitalize font-medium">
                            {bet.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-sm">
                            {formatDate(bet.placedAt)}
                          </span>
                          {bet.resultAt && (
                            <span className="text-muted-foreground text-sm">
                              Result: {formatDate(bet.resultAt)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-matka-gold"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {bets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No bets found</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage - 1,
                    }))
                  }
                  className="border-border text-foreground hover:bg-muted"
                >
                  Previous
                </Button>
                <span className="text-muted-foreground text-sm py-2 px-4">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage + 1,
                    }))
                  }
                  className="border-border text-foreground hover:bg-muted"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBets;
