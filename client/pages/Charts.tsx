import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowLeft } from "lucide-react";

const Charts = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const gameResults = [
    {
      id: "gali",
      name: "Gali",
      icon: "⚔️",
      winnerNumber: "62",
      color: "from-red-500 to-red-600",
    },
    {
      id: "disawer",
      name: "Disawer",
      icon: "🎲",
      winnerNumber: "41",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      id: "delhi-bazar",
      name: "Delhi Bazar",
      icon: "🦁",
      winnerNumber: "28",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      id: "dubai-market",
      name: "Dubai Market",
      icon: "🏢",
      winnerNumber: "95",
      color: "from-blue-500 to-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </Button>
              <h1 className="text-foreground text-xl font-bold">Charts</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-muted"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(selectedDate).toLocaleDateString()}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Date Selection Info */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground text-lg">
            Select Date to see the winners
          </p>
        </div>

        {/* Results Grid */}
        <div className="space-y-4">
          {gameResults.map((game) => (
            <Card
              key={game.id}
              className="bg-card/90 backdrop-blur-sm border-border/50 hover:border-matka-gold/50 transition-all duration-300"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-matka-gold to-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{game.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-foreground text-xl font-bold">
                        {game.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Winner Number
                      </p>
                    </div>
                  </div>
                  <div className="bg-matka-dark px-6 py-3 rounded-xl border border-matka-gold/30">
                    <span className="text-matka-gold text-2xl font-bold">
                      {game.winnerNumber}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Historical Results */}
        <div className="mt-8">
          <h2 className="text-foreground text-xl font-bold mb-4">
            Previous Results
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 5 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (i + 1));
              return (
                <Card
                  key={i}
                  className="bg-card/50 backdrop-blur-sm border-border/30"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {date.toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <span className="text-foreground">Gali: 45</span>
                        <span className="text-foreground">Disawer: 78</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50">
        <div className="flex items-center justify-around py-3">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 p-3"
            onClick={() => navigate("/dashboard")}
          >
            <span className="text-2xl">🏠</span>
            <span className="text-muted-foreground text-xs">Home</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 p-3"
          >
            <span className="text-2xl">📊</span>
            <span className="text-matka-gold text-xs font-medium">Chart</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 p-3"
          >
            <span className="text-2xl">🏆</span>
            <span className="text-muted-foreground text-xs">My Matches</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 p-3"
          >
            <span className="text-2xl">💬</span>
            <span className="text-muted-foreground text-xs">Chat & Call</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 p-3"
          >
            <span className="text-2xl">🤝</span>
            <span className="text-muted-foreground text-xs">Share & Earn</span>
          </Button>
        </div>
      </div>

      {/* Add bottom padding to account for fixed bottom section */}
      <div className="h-20"></div>
    </div>
  );
};

export default Charts;
