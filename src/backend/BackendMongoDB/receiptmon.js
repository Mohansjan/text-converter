const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");

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

const ReceiptSchema = new mongoose.Schema({
    receiptNumber: { type: String },      
    customerName: { type: String },       
    purchaseDate: { type: Date },         
    totalAmount: { type: Number },        
    items: { type: String },             
    paymentMethod: { type: String },     
    taxAmount: { type: Number },       
    discountAmount: { type: Number },     
    transactionID: { type: String },     
    storeAddress: { type: String },       
    discountPercentage: { type: String }, 
});

const Receipt = mongoose.model('Receipt', ReceiptSchema);

const app = express();
app.use(express.json());
app.use(cors());

console.log("App listening at port 5003");

app.get("/", (req, resp) => {
    resp.send("App is Working");
});

app.post("/receipt", async (req, resp) => {
    try {
        
        const ReceiptData = {};
        for (const key in req.body) {
            if (req.body[key] !== null && req.body[key] !== '') {
                ReceiptData[key] = req.body[key];
            }
        }

        
        const newReceipt = new Receipt(ReceiptData);
        const result = await newReceipt.save();

        
        resp.status(203).send({ success: true, data: result });
    } catch (e) {
        console.error('Error during invoice saving:', e);
        resp.status(503).send({ error: e.message });
    }
});


app.listen(5003, () => {
    console.log("Server is running on port 5003");
});
