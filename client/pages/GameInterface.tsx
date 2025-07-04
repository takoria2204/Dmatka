import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, X } from "lucide-react";

const GameInterface = () => {
  const navigate = useNavigate();
  const { gameName } = useParams();
  const [activeTab, setActiveTab] = useState("Jodi");
  const [selectedNumbers, setSelectedNumbers] = useState<{
    [key: string]: number;
  }>({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [paltiEnabled, setPaltiEnabled] = useState(false);

  // Crossing game state
  const [crossingNumbers, setCrossingNumbers] = useState("");
  const [crossingAmount, setCrossingAmount] = useState("");
  const [jodaCut, setJodaCut] = useState(false);

  // Haruf game state
  const [harufBets, setHarufBets] = useState<{ [key: string]: number }>({});

  const tabs = ["Jodi", "Crossing", "Haruf"];

  // Generate numbers from 0 to 99
  const numbers = Array.from({ length: 100 }, (_, i) => i);

  const handleNumberSelect = (number: number) => {
    if (activeTab === "Jodi") {
      setSelectedNumber(number);
      setShowBetModal(true);
      setBetAmount("");
      setPaltiEnabled(false);
    } else {
      const key = `${activeTab}-${number}`;
      const currentAmount = selectedNumbers[key] || 0;
      const newAmount = currentAmount + 10;

      if (newAmount > 5000) {
        alert("Maximum bet amount is ₹5000 per number");
        return;
      }

      const updatedSelections = { ...selectedNumbers, [key]: newAmount };
      setSelectedNumbers(updatedSelections);

      const total = Object.values(updatedSelections).reduce(
        (sum, amount) => sum + amount,
        0,
      );
      setTotalAmount(total);
    }
  };

  const handleNumberDeselect = (number: number) => {
    const key = `${activeTab}-${number}`;
    const updatedSelections = { ...selectedNumbers };
    delete updatedSelections[key];

    setSelectedNumbers(updatedSelections);

    // Recalculate total
    const total = Object.values(updatedSelections).reduce(
      (sum, amount) => sum + amount,
      0,
    );
    setTotalAmount(total);
  };

  const isNumberSelected = (number: number) => {
    const key = `${activeTab}-${number}`;
    return selectedNumbers[key] > 0;
  };

  const getNumberAmount = (number: number) => {
    const key = `${activeTab}-${number}`;
    return selectedNumbers[key] || 0;
  };

  const handleSaveBet = () => {
    if (!selectedNumber || !betAmount || parseFloat(betAmount) <= 0) {
      alert("Please enter a valid bet amount");
      return;
    }

    const amount = parseFloat(betAmount);
    if (amount > 5000) {
      alert("Maximum bet amount is ₹5000 per number");
      return;
    }

    const key = `${activeTab}-${selectedNumber}`;
    const updatedSelections = { ...selectedNumbers, [key]: amount };
    setSelectedNumbers(updatedSelections);

    const total = Object.values(updatedSelections).reduce(
      (sum, amount) => sum + amount,
      0,
    );
    setTotalAmount(total);

    setShowBetModal(false);
    setSelectedNumber(null);
  };

  const handleHarufBet = (position: string, amount: number) => {
    const newHarufBets = { ...harufBets, [position]: amount };
    setHarufBets(newHarufBets);

    const total = Object.values(newHarufBets).reduce(
      (sum, amount) => sum + amount,
      0,
    );
    setTotalAmount(total);
  };

  const handleSubmit = () => {
    if (totalAmount === 0) {
      alert("Please select at least one number to place a bet");
      return;
    }

    alert(
      `Bet placed successfully!\nTotal Amount: ₹${totalAmount}\nGame: ${gameName}\nType: ${activeTab}`,
    );
    // Here you would typically send the bet to your backend
  };

  const formatGameName = (name: string) => {
    return (
      name
        ?.split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || "Game"
    );
  };

  return (
    <div className="min-h-screen bg-matka-dark">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/matka-games")}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="text-foreground text-xl font-bold">
              {formatGameName(gameName || "")}
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Game Type Tabs */}
        <div className="mb-6">
          <h2 className="text-foreground text-2xl font-bold text-center mb-6">
            Games
          </h2>
          <div className="flex justify-center mb-6">
            <div className="flex bg-card/50 rounded-lg p-1">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  variant={activeTab === tab ? "default" : "ghost"}
                  className={`px-8 py-2 rounded-md transition-all duration-300 ${
                    activeTab === tab
                      ? "bg-matka-gold text-matka-dark font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground text-lg mb-2">
            Choose any number
          </p>
          <p className="text-muted-foreground text-sm">
            *Below 5000 on each number
          </p>
        </div>

        {/* Tab Content */}
        {activeTab === "Jodi" && (
          <>
            {/* Number Grid */}
            <div className="grid grid-cols-5 gap-3 mb-8 max-w-2xl mx-auto">
              {numbers.map((number) => (
                <div key={number} className="relative">
                  <Button
                    onClick={() => handleNumberSelect(number)}
                    onDoubleClick={() => handleNumberDeselect(number)}
                    className={`w-full h-16 text-lg font-bold border-2 transition-all duration-300 ${
                      isNumberSelected(number)
                        ? "bg-matka-gold text-matka-dark border-matka-gold"
                        : "bg-card border-border text-foreground hover:border-matka-gold/50"
                    }`}
                  >
                    {number}
                  </Button>
                  {isNumberSelected(number) && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      ₹{getNumberAmount(number)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "Crossing" && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-matka-dark/80 rounded-xl p-6 border border-matka-gold/30">
              <div className="space-y-6">
                <div>
                  <Label className="text-foreground text-lg mb-2 block">
                    Crossing Numbers
                  </Label>
                  <Input
                    value={crossingNumbers}
                    onChange={(e) => setCrossingNumbers(e.target.value)}
                    placeholder="00"
                    className="bg-muted border-border text-foreground text-lg py-3"
                  />
                </div>

                <div>
                  <Label className="text-foreground text-lg mb-2 block">
                    Crossing Into Amount
                  </Label>
                  <Input
                    value={crossingAmount}
                    onChange={(e) => setCrossingAmount(e.target.value)}
                    placeholder="00"
                    type="number"
                    className="bg-muted border-border text-foreground text-lg py-3"
                  />
                  <p className="text-muted-foreground text-sm mt-2">
                    * Crossing Amount below 5000
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="joda-cut"
                    checked={jodaCut}
                    onCheckedChange={(checked) =>
                      setJodaCut(checked as boolean)
                    }
                  />
                  <Label htmlFor="joda-cut" className="text-foreground">
                    Joda Cut
                  </Label>
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold py-3 rounded-xl"
              onClick={() => {
                if (crossingNumbers && crossingAmount) {
                  setTotalAmount(parseFloat(crossingAmount) || 0);
                  alert("Crossing bet saved!");
                }
              }}
            >
              SAVE
            </Button>

            <div className="mt-8">
              <h3 className="text-foreground text-xl font-bold text-center mb-4">
                Total number of crossing
              </h3>
              <div className="bg-card/50 rounded-lg p-4 border border-border/30">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>No.</span>
                  <span>Value</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Haruf" && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="grid grid-cols-2 gap-6">
              {/* Andar Game */}
              <div>
                <h3 className="text-foreground text-lg font-bold mb-4">
                  Andar Game
                </h3>
                <div className="space-y-3">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="flex gap-2">
                      <Button
                        variant="outline"
                        className="w-16 border-border text-foreground"
                      >
                        A{i}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-border text-foreground"
                        onClick={() => handleHarufBet(`A${i}`, 25)}
                      >
                        {harufBets[`A${i}`] || "00"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bahar Game */}
              <div>
                <h3 className="text-foreground text-lg font-bold mb-4">
                  Bahar Game
                </h3>
                <div className="space-y-3">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="flex gap-2">
                      <Button
                        variant="outline"
                        className="w-16 border-border text-foreground"
                      >
                        B{i}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-border text-foreground"
                        onClick={() => handleHarufBet(`B${i}`, 25)}
                      >
                        {harufBets[`B${i}`] || "00"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold py-3 rounded-xl"
              onClick={() => alert("Haruf bets saved!")}
            >
              SAVE
            </Button>
          </div>
        )}

        {/* Instructions for Jodi only */}
        {activeTab === "Jodi" && (
          <div className="text-center mb-6">
            <p className="text-muted-foreground text-sm mb-2">
              Tap number to place bet • Double tap to remove
            </p>
            <p className="text-muted-foreground text-xs">
              Selected numbers will show bet amount in green
            </p>
          </div>
        )}
      </div>

      {/* Bottom Fixed Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Amount</p>
              <p className="text-foreground text-2xl font-bold">
                ₹{totalAmount}
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={totalAmount === 0}
              className="bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold px-8 py-3 rounded-xl hover:from-yellow-500 hover:to-matka-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SUBMIT
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => {
                setSelectedNumbers({});
                setTotalAmount(0);
              }}
              variant="outline"
              size="sm"
              className="flex-1 border-border text-foreground hover:bg-muted"
            >
              Clear All
            </Button>
            <Button
              onClick={() => {
                // Quick select random numbers
                const randomNumbers = [];
                for (let i = 0; i < 5; i++) {
                  randomNumbers.push(Math.floor(Math.random() * 100));
                }
                const newSelections: { [key: string]: number } = {};
                randomNumbers.forEach((num) => {
                  const key = `${activeTab}-${num}`;
                  newSelections[key] = 10;
                });
                setSelectedNumbers(newSelections);
                setTotalAmount(50);
              }}
              variant="outline"
              size="sm"
              className="flex-1 border-border text-foreground hover:bg-muted"
            >
              Quick Pick
            </Button>
          </div>
        </div>
      </div>

      {/* Add bottom padding to account for fixed bottom section */}
      <div className="h-32"></div>

      {/* Bet Modal */}
      {showBetModal && selectedNumber !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-matka-dark rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-matka-gold text-2xl font-bold">
                    {selectedNumber.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBetModal(false)}
                className="p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-foreground text-lg mb-2 block">
                  Place Amount on selected number
                </Label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="₹ 0"
                  className="bg-muted border-border text-foreground text-lg py-3"
                  max="5000"
                />
                <p className="text-muted-foreground text-sm mt-2">
                  * Jodi Amount below 5000
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-foreground">Palti (Reverse Bet)</Label>
                <Switch
                  checked={paltiEnabled}
                  onCheckedChange={setPaltiEnabled}
                />
              </div>

              <Button
                onClick={handleSaveBet}
                className="w-full bg-gradient-to-r from-matka-gold to-yellow-500 text-matka-dark font-bold py-3 rounded-xl"
              >
                SAVE
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameInterface;
