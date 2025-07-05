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

    // Add current game status based on time or forced status
    const gamesWithStatus = games.map((game) => {
      // If admin has forced a status, use that
      if (game.forcedStatus && game.isActive) {
        return {
          ...game.toObject(),
          currentStatus: game.forcedStatus,
        };
      }

      // Otherwise calculate based on time
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

      let status = "waiting";
      if (game.isActive) {
        if (currentTime >= game.startTime && currentTime < game.endTime) {
          status = "open";
        } else if (
          currentTime >= game.endTime &&
          currentTime < game.resultTime
        ) {
          status = "closed";
        } else if (currentTime >= game.resultTime) {
          status = "result_declared";
        }
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

    // Calculate current status
    let currentStatus = "";
    if (game.forcedStatus && game.isActive) {
      currentStatus = game.forcedStatus;
    } else if (game.isActive) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      if (currentTime >= game.startTime && currentTime < game.endTime) {
        currentStatus = "open";
      } else if (currentTime >= game.endTime && currentTime < game.resultTime) {
        currentStatus = "closed";
      } else if (currentTime >= game.resultTime) {
        currentStatus = "result_declared";
      } else {
        currentStatus = "waiting";
      }
    } else {
      currentStatus = "waiting";
    }

    res.json({
      success: true,
      data: {
        ...game.toObject(),
        currentStatus,
      },
    });
  } catch (error) {
    console.error("Get game by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Place a bet (authenticated users) - Atomic operation with transaction
export const placeBet: RequestHandler = async (req, res) => {
  console.log("=== PLACE BET API CALLED ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  console.log("User ID:", (req as any).user?._id);

  // Start a database session for atomic transactions
  const session = await mongoose.startSession();

  try {
    const { gameId, betType, betNumber, betAmount, betData } = req.body;
    const userId = (req as any).user._id;
    const userEmail = (req as any).user.email;

    // Validate required fields
    if (!gameId || !betType || !betNumber || !betAmount) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: gameId, betType, betNumber, betAmount",
      });
    }

    if (betAmount <= 0) {
      console.log("❌ Invalid bet amount:", betAmount);
      return res.status(400).json({
        success: false,
        message: "Bet amount must be greater than 0",
      });
    }

    // Get game details
    const game = await Game.findById(gameId);
    if (!game || !game.isActive) {
      console.log("❌ Game not found or inactive");
      return res.status(404).json({
        success: false,
        message: "Game not found or inactive",
      });
    }

    // Check if game is open for betting (respect admin forced status)
    let gameStatus = "";

    if (game.forcedStatus && game.isActive) {
      // Admin has forced a status
      gameStatus = game.forcedStatus;
      console.log("🎯 Using admin forced status:", gameStatus);
    } else if (game.isActive) {
      // Calculate based on time
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      if (currentTime >= game.startTime && currentTime < game.endTime) {
        gameStatus = "open";
      } else if (currentTime >= game.endTime && currentTime < game.resultTime) {
        gameStatus = "closed";
      } else if (currentTime >= game.resultTime) {
        gameStatus = "result_declared";
      } else {
        gameStatus = "waiting";
      }
      console.log(
        "⏰ Using time-based status:",
        gameStatus,
        "Current:",
        currentTime,
      );
    } else {
      gameStatus = "waiting";
      console.log("⏸️ Game is inactive");
    }

    if (gameStatus !== "open") {
      console.log("❌ Game not open for betting. Status:", gameStatus);
      return res.status(400).json({
        success: false,
        message: `Betting is ${gameStatus === "waiting" ? "not started yet" : gameStatus === "closed" ? "closed" : "not available"} for this game`,
      });
    }

    console.log("✅ Game is open for betting. Status:", gameStatus);

    // Validate bet amount limits
    if (betAmount < game.minBet || betAmount > game.maxBet) {
      console.log(
        "❌ Bet amount out of range:",
        betAmount,
        "Range:",
        game.minBet,
        "-",
        game.maxBet,
      );
      return res.status(400).json({
        success: false,
        message: `Bet amount must be between ₹${game.minBet} and ₹${game.maxBet}`,
      });
    }

    // Start atomic transaction
    await session.withTransaction(async () => {
      // Get user wallet with session lock
      let wallet = await Wallet.findOne({ userId }).session(session);
      if (!wallet) {
        console.log("Creating new wallet for user");
        wallet = await Wallet.create([{ userId }], { session });
        wallet = wallet[0];
      }

      console.log(
        "💰 Current wallet balance:",
        wallet.depositBalance,
        "Required:",
        betAmount,
      );

      // Check sufficient balance
      if (wallet.depositBalance < betAmount) {
        throw new Error(
          `Insufficient wallet balance. Current: ���${wallet.depositBalance}, Required: ₹${betAmount}`,
        );
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
          throw new Error("Invalid bet type");
      }

      const potentialWinning = betAmount * multiplier;

      // Create transaction record first
      const transaction = await Transaction.create(
        [
          {
            userId,
            type: "bet",
            amount: betAmount,
            status: "completed",
            description: `Bet placed on ${game.name} - ${betType.toUpperCase()} - ${betNumber}`,
            gameId: gameId,
            gameName: game.name,
            referenceId: `BET_${Date.now()}_${userId}`,
          },
        ],
        { session },
      );

      // Create bet record
      const bet = await Bet.create(
        [
          {
            userId,
            gameId,
            gameName: game.name,
            gameType: game.type,
            betType,
            betNumber,
            betAmount,
            potentialWinning,
            betData: {
              ...betData,
              userEmail,
              ipAddress: req.ip,
              userAgent: req.get("User-Agent"),
            },
            gameDate: new Date(),
            gameTime: game.endTime,
            status: "pending",
            deductionTransactionId: transaction[0]._id,
          },
        ],
        { session },
      );

      // Deduct amount from wallet atomically
      wallet.depositBalance -= betAmount;
      wallet.totalBets += betAmount;
      await wallet.save({ session });

      console.log("✅ Bet placed successfully!");
      console.log("Bet ID:", bet[0]._id);
      console.log("Transaction ID:", transaction[0]._id);
      console.log("New wallet balance:", wallet.depositBalance);

      // Store data for response
      req.betResult = {
        bet: bet[0],
        transaction: transaction[0],
        currentBalance: wallet.depositBalance,
        potentialWinning,
      };
    });

    // Send success response
    const result = (req as any).betResult;
    res.status(201).json({
      success: true,
      message: `Bet placed successfully on ${game.name}`,
      data: {
        betId: result.bet._id,
        gameId: game._id,
        gameName: game.name,
        betType: betType.toUpperCase(),
        betNumber,
        betAmount,
        potentialWinning: result.potentialWinning,
        currentBalance: result.currentBalance,
        transactionId: result.transaction._id,
        status: "pending",
      },
    });
  } catch (error: any) {
    console.error("❌ Place bet error:", error.message);

    // Send appropriate error response
    if (error.message.includes("Insufficient")) {
      res.status(400).json({
        success: false,
        message: error.message,
        type: "insufficient_balance",
      });
    } else if (error.message.includes("Invalid")) {
      res.status(400).json({
        success: false,
        message: error.message,
        type: "validation_error",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to place bet. Please try again.",
        type: "server_error",
      });
    }
  } finally {
    await session.endSession();
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

    console.log(`✅ Game ${game.name} updated - isActive: ${game.isActive}`);

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

// Force change game status (admin)
export const forceGameStatus: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { forceStatus } = req.body;

    if (
      !["waiting", "open", "closed", "result_declared"].includes(forceStatus)
    ) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const game = await Game.findById(gameId);
    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }

    // Store the forced status in a custom field
    const updatedGame = await Game.findByIdAndUpdate(
      gameId,
      {
        forcedStatus: forceStatus,
        lastStatusChange: new Date(),
      },
      { new: true },
    );

    console.log(`✅ Game ${game.name} status forced to: ${forceStatus}`);

    res.json({
      success: true,
      message: `Game status changed to ${forceStatus}`,
      data: updatedGame,
    });
  } catch (error: any) {
    console.error("Force game status error:", error);
    res.status(500).json({ message: "Server error" });
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
          wallet.winningBalance += bet.winningAmount;
          wallet.totalWinnings += bet.winningAmount;
          await wallet.save();

          // Create winning transaction
          const transaction = await Transaction.create({
            userId: bet.userId,
            type: "win",
            amount: bet.winningAmount,
            status: "completed",
            description: `🎉 Won ${game.name} - ${bet.betType.toUpperCase()} - Number: ${bet.betNumber}`,
            gameId: gameId,
            gameName: game.name,
            referenceId: `WIN_${Date.now()}_${bet.userId}`,
          });

          bet.winningTransactionId = transaction._id as mongoose.Types.ObjectId;

          console.log(
            `💰 Winner! User ${bet.userId} won ₹${bet.winningAmount} on ${bet.betNumber}`,
          );
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
