import mongoose from "mongoose";
import Game from "../models/Game";
import Bet from "../models/Bet";
import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";
import GameResult from "../models/GameResult";
import { config } from "dotenv";

config();

async function testResultDeclaration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("Connected to MongoDB");

    // Find Kalyan game
    const game = await Game.findOne({ name: "Kalyan" });
    if (!game) {
      console.log("❌ Kalyan game not found");
      return;
    }
    console.log("🎮 Found game:", game.name, game._id);

    // Find all pending bets for Kalyan
    const bets = await Bet.find({
      gameId: game._id,
      status: "pending",
    }).populate("userId", "fullName mobile");

    console.log(`📊 Found ${bets.length} pending bets:`);
    bets.forEach((bet, index) => {
      console.log(
        `  ${index + 1}. ${bet.userId?.fullName} bet ₹${bet.betAmount} on ${bet.betNumber} (${bet.betType})`,
      );
    });

    if (bets.length === 0) {
      console.log("❌ No pending bets found for Kalyan");
      return;
    }

    // Use the first bet's number as winning result for testing
    const winningNumber = bets[0].betNumber;
    console.log(
      `🎯 Declaring result as: ${winningNumber} (to make first bet win)`,
    );

    // Process result declaration
    let winnersCount = 0;
    let totalWinningAmount = 0;

    for (const bet of bets) {
      const isWinner = bet.betNumber === winningNumber;
      console.log(
        `   ${bet.betNumber} === ${winningNumber} = ${isWinner ? "✅ WINNER" : "❌ LOSER"}`,
      );

      if (isWinner) {
        // Update bet to winner
        bet.isWinner = true;
        bet.winningAmount = bet.potentialWinning;
        bet.status = "won";
        winnersCount++;
        totalWinningAmount += bet.winningAmount;

        // Credit winning to user wallet
        const wallet = await Wallet.findOne({ userId: bet.userId });
        if (wallet) {
          const oldBalance = wallet.winningBalance;
          wallet.winningBalance += bet.winningAmount;
          wallet.totalWinnings += bet.winningAmount;
          await wallet.save();

          console.log(
            `💰 Credited ₹${bet.winningAmount} to ${bet.userId?.fullName} (${oldBalance} → ${wallet.winningBalance})`,
          );

          // Create winning transaction
          await Transaction.create({
            userId: bet.userId,
            type: "win",
            amount: bet.winningAmount,
            status: "completed",
            description: `🎉 Won ${game.name} - ${bet.betType.toUpperCase()} - Number: ${bet.betNumber}`,
            gameId: game._id,
            gameName: game.name,
            referenceId: `WIN_${Date.now()}_${bet.userId}`,
          });
        }
      } else {
        bet.status = "lost";
      }

      await bet.save();
    }

    // Create game result record
    await GameResult.create({
      gameId: game._id,
      gameName: game.name,
      gameType: game.type,
      jodiResult: winningNumber,
      resultDate: new Date(),
      drawTime: game.resultTime,
      totalBets: bets.length,
      totalBetAmount: bets.reduce((sum, bet) => sum + bet.betAmount, 0),
      totalWinningAmount,
      status: "declared",
      isManual: true,
      processedAt: new Date(),
    });

    console.log("\n=== RESULT SUMMARY ===");
    console.log(`🎮 Game: ${game.name}`);
    console.log(`��� Result: ${winningNumber}`);
    console.log(`👥 Total Bets: ${bets.length}`);
    console.log(`🏆 Winners: ${winnersCount}`);
    console.log(`💰 Total Winnings: ₹${totalWinningAmount.toLocaleString()}`);
    console.log("✅ Result declaration completed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

testResultDeclaration();
