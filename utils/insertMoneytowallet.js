const Wallet = require("../Models/walletModel"); // Adjust path as needed

const inserMoneytoWallet = async (amount, userId) => {
  try {
    // Find existing wallet or create new one
    let wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
        transactions: []
      });
    }

    // Create new transaction
    const transaction = {
      transactionDate: new Date(),
      transactionType: "credit",
      transactionStatus: "completed",
      amount: amount
    };

    // Update wallet
    wallet.balance += amount;
    wallet.transactions.push(transaction);

    // Save changes
    await wallet.save();

    return {
      success: true,
      message: "Money added to wallet successfully",
      newBalance: wallet.balance
    };

  } catch (error) {
    console.error("Error adding money to wallet:", error);
    throw new Error("Failed to add money to wallet");
  }
};

module.exports =  inserMoneytoWallet 