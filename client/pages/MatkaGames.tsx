import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";

const MatkaGames = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: "delhi-bazar",
      name: "Delhi Bazar",
      icon: "🦁",
      players: 365355,
      status: "Open",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      id: "dubai-market",
      name: "Dubai Market",
      icon: "🏢",
      players: 256663,
      status: "Open",
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "shri-ganesh",
      name: "Shri Ganesh",
      icon: "🐘",
      players: 189660,
      status: "Open",
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "faridabad",
      name: "Faridabad",
      icon: "🏛️",
      players: 76530,
      status: "Open",
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "gaziabad",
      name: "Gaziabad",
      icon: "🏗️",
      players: 61602,
      status: "Open",
      color: "from-green-500 to-green-600",
    },
    {
      id: "galli",
      name: "Galli",
      icon: "⚔️",
      players: 52718,
      status: "Open",
      color: "from-red-500 to-red-600",
    },
    {
      id: "disawer",
      name: "Disawer",
      icon: "🎲",
      players: 45454,
      status: "Open",
      color: "from-indigo-500 to-indigo-600",
    },
  ];

  const topGames = games.slice(0, 6);

  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="text-foreground text-xl font-bold">Matka Game</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Top Games Icons */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-6">
          {topGames.map((game) => (
            <div
              key={game.id}
              className="flex flex-col items-center min-w-[80px] cursor-pointer"
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-matka-gold to-yellow-500 rounded-lg flex items-center justify-center mb-2 shadow-lg border border-matka-gold/30">
                <span className="text-2xl">{game.icon}</span>
              </div>
              <span className="text-foreground text-xs text-center font-medium">
                {game.name}
              </span>
            </div>
          ))}
        </div>

        {/* Live Games Section */}
        <h2 className="text-foreground text-2xl font-bold mb-6">Live Games</h2>

        <div className="space-y-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-gradient-to-r from-matka-gold to-yellow-500 rounded-2xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-matka-dark/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">{game.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-matka-dark text-xl font-bold">
                      {game.name}
                    </h3>
                    <p className="text-matka-dark/70 text-sm">
                      {game.players.toLocaleString()} people are playing
                    </p>
                    <div className="mt-2">
                      <span className="bg-matka-dark text-matka-gold px-4 py-1 rounded-full text-sm font-semibold">
                        {game.status}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/game/${game.id}`)}
                  className="bg-matka-dark hover:bg-matka-dark/80 text-matka-gold font-bold px-6 py-3 rounded-xl"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Play
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatkaGames;
