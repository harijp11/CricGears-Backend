const Wallet = require("../../Models/walletModel");

async function addMoneytoWallet(req, res) {
  try {
    const { amount, _id } = req.body;

    let myWallet = await Wallet.findOne({ user: _id });

    if (!myWallet) {
      myWallet = new Wallet({
        user: _id,
        balance: amount,
        transactions: [
          {
            transactionDate: new Date(),
            transactionType: "credit",
            transactionStatus: "completed",
            amount: Number(amount),
          },
        ],
      });

      await myWallet.save();
      return res
        .status(200)
        .json({ message: "Wallet created successfully", myWallet });
    }

    myWallet.balance += amount;

    const transactions = {
      transactionDate: new Date(),
      transactionType: "credit",
      transactionStatus: "completed",
      amount: amount,
    };

    myWallet.transactions.push(transactions);
    await myWallet.save();
    return res.json({ success: true, message: "Amount added to wallet " });
  } catch (err) {
    console.log(err);
  }
}

async function fetchWallet(req, res) {
  try {
    const { _id } = req.query;

    const page = req.query.page || 1;
    const limit = req.query.limit || 6;
    const skip = (page - 1) * limit;

    let myWallet = await Wallet.findOne({ user: _id });
    if (!myWallet) {
      myWallet = new Wallet({
        user: _id,
        balance: 0,
      });
      await myWallet.save();
      return res.status(200).json({
        success: true,
        myWallet: {
          ...myWallet.toObject(),
          totalTransactions: 0,
          currentPage: 1,
          totalPages: 1,
          transactions: []
        },
      });
    }

    const totalTransactions = myWallet.transactions.length

    const paginatedTransactions = myWallet.transactions
    .sort((a, b) => b.transactionDate - a.transactionDate)
    .slice(skip, skip + limit);

    return res.status(200).json({
        success: true,
        myWallet: {
          ...myWallet.toObject(),
          transactions: paginatedTransactions,
          totalTransactions,
          currentPage: page,
          totalPages: Math.ceil(totalTransactions / limit)
        }
      });
  } catch (err) {
    console.log(err);
  }
}

module.exports = { addMoneytoWallet, fetchWallet };
