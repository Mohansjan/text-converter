const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");
const { type } = require('@testing-library/user-event/dist/type');

mongoose.connect('mongodb://localhost:27017/OCRConverter', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to OCRConverter database');
})
.catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
});

const BankSchema = new mongoose.Schema({
    bankName : {type : String},
    accountNumber : {type : String},
    balance: { type: Number },
    transactionDate: { type: Date },
    amount: { type: String }, 
    statementPeriod: { type: String },
    checkDate: { type: Date },
    transactionDate: { type: Date },
    totalWithdrawals: { type: Number },
    checkNumber: { type: String },   
    fees: { type: Number },           
    transferAmount: { type: Number },
    openingBalance : {type : Number},
    closingBalance : {type : Number},
    totalCredit : {type : Number},
    totalDebit : {type : Number},
    interest: { type: Number },
    description: { type: String },
});


const Bank = mongoose.model('Bank', BankSchema);

const app = express();
app.use(express.json());
app.use(cors());

console.log("App listening at port 5002");

app.get("/", (req, resp) => {
    resp.send("App is Working");
});

app.post("/Bank", async (req, resp) => {
    try {
        
        const BankData = {};
        for (const key in req.body) {
            if (req.body[key] !== null && req.body[key] !== '') {
                BankData[key] = req.body[key];
            }
        }
        
        const newBank = new Bank(BankData);
        const result = await newBank.save();
        
        resp.status(202).send({ success: true, data: result });
    } catch (e) {
        console.error('Error during Bank data saving:', e);
        resp.status(502).send({ error: e.message });
    }
});

app.listen(5002, () => {
    console.log("Server is running on port 5002");
});
