const Wallet = require("../Models/walletModel");

async function refundAmounttoWallet(userId, refundAmt) {
  try {
    const _id = userId;
    const amount = refundAmt;

    let myWallet = await Wallet.findOne({ user: _id });

    if (!myWallet) {
      console.log("no wallet existing");
      myWallet = new Wallet({
        user: _id,
        balance: amount,
        transactions: [
          {
            transactionDate: new Date(),
            transactionType: "credit",
            transactionStatus: "completed",
            amount: amount,
          },
        ],
      });
      await myWallet.save();
      return 
    }
    
    myWallet.balance += +amount;
    const transactions = {
      transactionDate: new Date(),
      transactionType: "credit",
      transactionStatus: "completed",
      amount: amount,
    };

    myWallet.transactions.push(transactions);
    await myWallet.save();
  } catch (err) {
    console.log(err);
  }
}

module.exports = { refundAmounttoWallet };
