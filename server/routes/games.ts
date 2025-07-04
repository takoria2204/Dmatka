import { RequestHandler } from "express";
import mongoose from "mongoose";
import Game from "../models/Game";
import GameResult from "../models/GameResult";
import Bet from "../models/Bet";
import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";
import { AdminRequest } from "../middleware/adminAuth";

// Get all games (public - for users to see available games)
export const getAllGames: RequestHandler = async (req, res) => {
  try {
    const games = await Game.find({ isActive: true })
      .select("-createdBy -__v")
      .sort({ startTime: 1 });

    // Add current game status based on time
    const gamesWithStatus = games.map((game) => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

      let status = "waiting";
      if (currentTime >= game.startTime && currentTime < game.endTime) {
        status = "open";
      } else if (currentTime >= game.endTime && currentTime < game.resultTime) {
        status = "closed";
      } else if (currentTime >= game.resultTime) {
        status = "result_declared";
      }

      return {
        ...game.toObject(),
        currentStatus: status,
      };
    });

    res.json({
      success: true,
      data: gamesWithStatus,
    });
  } catch (error) {
    console.error("Get all games error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get specific game by ID
export const getGameById: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);

    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    if (!game.isActive) {
      res.status(404).json({ message: "Game is not active" });
      return;
    }

    res.json({
      success: true,
      data: game,
    });
  } catch (error) {
    console.error("Get game by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Place a bet (authenticated users)
export const placeBet: RequestHandler = async (req, res) => {
  try {
    const { gameId, betType, betNumber, betAmount, betData } = req.body;
    const userId = (req as any).user._id;
    const user = (req as any).user;

    // Validate input
    if (!gameId || !betType || !betNumber || !betAmount) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (betAmount <= 0) {
      res.status(400).json({ message: "Bet amount must be positive" });
      return;
    }

    // Get game details
    const game = await Game.findById(gameId);
    if (!game || !game.isActive) {
      res.status(404).json({ message: "Game not found or inactive" });
      return;
    }

    // Check if game is open for betting
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    if (currentTime < game.startTime || currentTime >= game.endTime) {
      res.status(400).json({ message: "Game is not open for betting" });
      return;
    }

    // Validate bet amount limits
    if (betAmount < game.minBet) {
      res.status(400).json({
        message: `Minimum bet amount is ₹${game.minBet}`,
      });
      return;
    }

    if (betAmount > game.maxBet) {
      res.status(400).json({
        message: `Maximum bet amount is ₹${game.maxBet}`,
      });
      return;
    }

    // Check user wallet balance
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }

    if (wallet.depositBalance < betAmount) {
      res.status(400).json({
        message: "Insufficient wallet balance",
        currentBalance: wallet.depositBalance,
      });
      return;
    }

    // Calculate potential winning
    let multiplier = 1;
    switch (betType) {
      case "jodi":
        multiplier = game.jodiPayout;
        break;
      case "haruf":
        multiplier = game.harufPayout;
        break;
      case "crossing":
        multiplier = game.crossingPayout;
        break;
      default:
        res.status(400).json({ message: "Invalid bet type" });
        return;
    }

    const potentialWinning = betAmount * multiplier;

    // Create bet record
    const bet = new Bet({
      userId,
      gameId,
      gameName: game.name,
      gameType: game.type,
      betType,
      betNumber,
      betAmount,
      potentialWinning,
      betData,
      gameDate: new Date(),
      gameTime: game.endTime,
      ipAddress: req.ip,
      deviceInfo: req.get("User-Agent"),
    });

    // Deduct amount from wallet
    wallet.depositBalance -= betAmount;
    await wallet.save();

    // Create deduction transaction
    const transaction = await Transaction.create({
      userId,
      type: "bet",
      amount: betAmount,
      status: "completed",
      description: `Bet placed on ${game.name} - ${betType}`,
      gameId: gameId,
      gameName: game.name,
    });

    bet.deductionTransactionId = transaction._id as mongoose.Types.ObjectId;
    await bet.save();

    res.status(201).json({
      success: true,
      message: "Bet placed successfully",
      data: {
        bet,
        currentBalance: wallet.depositBalance,
        potentialWinning,
      },
    });
  } catch (error) {
    console.error("Place bet error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's bets
export const getUserBets: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const gameType = req.query.gameType as string;
    const status = req.query.status as string;

    const query: any = { userId };

    if (gameType && gameType !== "all") {
      query.gameType = gameType;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const [bets, totalBets] = await Promise.all([
      Bet.find(query)
        .populate("gameId", "name type startTime endTime")
        .sort({ betPlacedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Bet.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        bets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalBets / limit),
          totalBets,
          hasNext: page * limit < totalBets,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get user bets error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get game results (public)
export const getGameResults: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const gameType = req.query.gameType as string;
    const gameId = req.query.gameId as string;

    const query: any = { status: "declared" };

    if (gameType && gameType !== "all") {
      query.gameType = gameType;
    }

    if (gameId) {
      query.gameId = gameId;
    }

    const [results, totalResults] = await Promise.all([
      GameResult.find(query)
        .populate("gameId", "name type")
        .sort({ resultDate: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      GameResult.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalResults / limit),
          totalResults,
          hasNext: page * limit < totalResults,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get game results error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN ROUTES

// Create new game (admin)
export const createGame: RequestHandler = async (req, res) => {
  try {
    const adminUser = (req as AdminRequest).admin;
    const gameData = {
      ...req.body,
      createdBy: adminUser?._id,
    };

    const game = new Game(gameData);
    await game.save();

    res.status(201).json({
      success: true,
      message: "Game created successfully",
      data: game,
    });
  } catch (error: any) {
    console.error("Create game error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      res.status(400).json({ message: messages.join(", ") });
    } else if (error.code === 11000) {
      res.status(400).json({ message: "Game name already exists" });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// Get all games for admin
export const getAdminGames: RequestHandler = async (req, res) => {
  try {
    const games = await Game.find()
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    const stats = {
      total: games.length,
      active: games.filter((g) => g.isActive).length,
      jodi: games.filter((g) => g.type === "jodi").length,
      haruf: games.filter((g) => g.type === "haruf").length,
      crossing: games.filter((g) => g.type === "crossing").length,
    };

    res.json({
      success: true,
      data: {
        games,
        stats,
      },
    });
  } catch (error) {
    console.error("Get admin games error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update game (admin)
export const updateGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findByIdAndUpdate(gameId, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "fullName email");

    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    res.json({
      success: true,
      message: "Game updated successfully",
      data: game,
    });
  } catch (error: any) {
    console.error("Update game error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      res.status(400).json({ message: messages.join(", ") });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

// Delete game (admin)
export const deleteGame: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;

    // Check if game has pending bets
    const pendingBets = await Bet.countDocuments({
      gameId,
      status: "pending",
    });

    if (pendingBets > 0) {
      res.status(400).json({
        message: `Cannot delete game with ${pendingBets} pending bets`,
      });
      return;
    }

    const game = await Game.findByIdAndDelete(gameId);

    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    res.json({
      success: true,
      message: "Game deleted successfully",
    });
  } catch (error) {
    console.error("Delete game error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Declare game result (admin)
export const declareResult: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { jodiResult, harufResult, crossingResult, resultDate } = req.body;
    const adminUser = (req as AdminRequest).admin;

    const game = await Game.findById(gameId);
    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    // Check if result already exists for today
    const today = resultDate ? new Date(resultDate) : new Date();
    today.setHours(0, 0, 0, 0);

    const existingResult = await GameResult.findOne({
      gameId,
      resultDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingResult && existingResult.status === "declared") {
      res.status(400).json({ message: "Result already declared for today" });
      return;
    }

    // Get all pending bets for this game today
    const bets = await Bet.find({
      gameId,
      gameDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      status: "pending",
    });

    // Calculate winners and update bets
    let totalWinningAmount = 0;
    let betDistribution = {
      jodi: { totalBets: 0, totalAmount: 0, winningBets: 0, winningAmount: 0 },
      haruf: { totalBets: 0, totalAmount: 0, winningBets: 0, winningAmount: 0 },
      crossing: {
        totalBets: 0,
        totalAmount: 0,
        winningBets: 0,
        winningAmount: 0,
      },
    };

    for (const bet of bets) {
      let isWinner = false;

      // Update bet distribution
      betDistribution[bet.betType as keyof typeof betDistribution].totalBets++;
      betDistribution[
        bet.betType as keyof typeof betDistribution
      ].totalAmount += bet.betAmount;

      // Check if bet is a winner
      switch (bet.betType) {
        case "jodi":
          isWinner = bet.betNumber === jodiResult;
          break;
        case "haruf":
          if (bet.betData?.harufPosition === "first") {
            isWinner = bet.betNumber === jodiResult?.charAt(0);
          } else if (bet.betData?.harufPosition === "last") {
            isWinner = bet.betNumber === jodiResult?.charAt(1);
          } else {
            isWinner = bet.betNumber === harufResult;
          }
          break;
        case "crossing":
          // Implement crossing logic here
          isWinner = bet.betNumber === crossingResult;
          break;
      }

      if (isWinner) {
        bet.isWinner = true;
        bet.winningAmount = bet.potentialWinning;
        bet.actualPayout = bet.potentialWinning;
        bet.status = "won";
        totalWinningAmount += bet.winningAmount;

        betDistribution[bet.betType as keyof typeof betDistribution]
          .winningBets++;
        betDistribution[
          bet.betType as keyof typeof betDistribution
        ].winningAmount += bet.winningAmount;

        // Credit winning amount to user wallet
        const wallet = await Wallet.findOne({ userId: bet.userId });
        if (wallet) {
          wallet.depositBalance += bet.winningAmount;
          await wallet.save();

          // Create winning transaction
          const transaction = await Transaction.create({
            userId: bet.userId,
            type: "bet_winning",
            amount: bet.winningAmount,
            status: "completed",
            description: `Won ${game.name} - ${bet.betType}`,
            balanceAfter: wallet.depositBalance,
          });

          bet.winningTransactionId = transaction._id as mongoose.Types.ObjectId;
        }
      } else {
        bet.isWinner = false;
        bet.status = "lost";
      }

      await bet.save();
    }

    // Calculate platform statistics
    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.betAmount, 0);
    const platformCommission = totalBetAmount * (game.commission / 100);
    const netProfit = totalBetAmount - totalWinningAmount - platformCommission;

    // Create or update game result
    const gameResult =
      existingResult ||
      new GameResult({
        gameId,
        gameName: game.name,
        gameType: game.type,
        resultDate: today,
        drawTime: game.resultTime,
      });

    gameResult.jodiResult = jodiResult;
    gameResult.harufResult = harufResult;
    gameResult.crossingResult = crossingResult;
    gameResult.totalBets = bets.length;
    gameResult.totalBetAmount = totalBetAmount;
    gameResult.totalWinningAmount = totalWinningAmount;
    gameResult.platformCommission = platformCommission;
    gameResult.netProfit = netProfit;
    gameResult.betDistribution = betDistribution;
    gameResult.status = "declared";
    gameResult.isManual = true;
    gameResult.declaredBy = adminUser?._id as mongoose.Types.ObjectId;
    gameResult.declaredAt = new Date();
    gameResult.processedAt = new Date();

    await gameResult.save();

    // Update game status
    game.currentStatus = "result_declared";
    game.lastResultDate = new Date();
    await game.save();

    res.json({
      success: true,
      message: "Result declared successfully",
      data: {
        gameResult,
        winnersCount:
          betDistribution.jodi.winningBets +
          betDistribution.haruf.winningBets +
          betDistribution.crossing.winningBets,
        totalWinningAmount,
        netProfit,
      },
    });
  } catch (error) {
    console.error("Declare result error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get game analytics (admin)
export const getGameAnalytics: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const days = parseInt(req.query.days as string) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get game statistics
    const [game, results, totalBets] = await Promise.all([
      Game.findById(gameId),
      GameResult.find({
        gameId,
        resultDate: { $gte: startDate },
        status: "declared",
      }).sort({ resultDate: -1 }),
      Bet.find({
        gameId,
        betPlacedAt: { $gte: startDate },
      }),
    ]);

    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    // Calculate analytics
    const analytics = {
      game: {
        name: game.name,
        type: game.type,
        totalResults: results.length,
      },
      financial: {
        totalBetAmount: results.reduce((sum, r) => sum + r.totalBetAmount, 0),
        totalWinningAmount: results.reduce(
          (sum, r) => sum + r.totalWinningAmount,
          0,
        ),
        totalCommission: results.reduce(
          (sum, r) => sum + r.platformCommission,
          0,
        ),
        totalProfit: results.reduce((sum, r) => sum + r.netProfit, 0),
      },
      betting: {
        totalBets: totalBets.length,
        averageBetAmount:
          totalBets.length > 0
            ? totalBets.reduce((sum, b) => sum + b.betAmount, 0) /
              totalBets.length
            : 0,
        uniqueUsers: new Set(totalBets.map((b) => b.userId.toString())).size,
      },
      results: results.map((r) => ({
        date: r.resultDate,
        jodiResult: r.jodiResult,
        harufResult: r.harufResult,
        crossingResult: r.crossingResult,
        totalBets: r.totalBets,
        totalAmount: r.totalBetAmount,
        profit: r.netProfit,
      })),
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Get game analytics error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
