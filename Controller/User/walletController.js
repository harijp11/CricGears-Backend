const Wallet = require("../../Models/walletModel")

async function addMoneytoWallet(req,res){
    try{
        const {amount,_id} = req.body
       
        let myWallet = await Wallet.findOne({user:_id})

        if(!myWallet){
            myWallet = new Wallet({
                user: _id,
                balance: amount,
                transactions:[
                    {
                        transactionDate:new Date(),
                        transactionType:"credit",
                        transactionStatus:"completed",
                        amount : Number(amount),
                    }
                ]
            })

            await myWallet.save()
            return res
            .status(200)
            .json({message:"Wallet created successfully",myWallet})
        }

        myWallet.balance += amount;

        const transactions = {
            transactionDate:new Date(),
            transactionType:"credit",
            transactionStatus:"completed",
            amount : amount,
        }

        myWallet.transactions.push(transactions)
        await myWallet.save()
        return res
        .json({ success: true, message: "Amount added to wallet " });
    }catch(err){
       console.log(err)
    }
}

async function fetchWallet(req,res){
      try{
        const { _id } = req.query;
       let myWallet = await Wallet.findOne({ user: _id });
       if(!myWallet) {
        myWallet = new Wallet({
            user: _id,
            balance: 0,
          });
          await myWallet.save();
          return res.status(200).json({ success: true, myWallet });
       }

       return res.status(200).json({ success: true, myWallet });
      }catch(err){
         console.log(err);
      }
}

module.exports = {addMoneytoWallet,fetchWallet}