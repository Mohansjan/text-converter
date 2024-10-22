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

const InvoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String },   
    customerName: { type: String },     
    purchaseOrder: { type: String },    
    invoiceDate: { type: Date },        
    dueDate: { type: Date },           
    quantity: { type: Number },         
    total: { type: Number },            
    subTotal: { type: Number },         
    billingAddress: { type: String },   
    shippingAddress: { type: String },  
    tax: { type: Number },              
    discount: { type: Number },        
});


const Invoice = mongoose.model('Invoice', InvoiceSchema);

const app = express();
app.use(express.json());
app.use(cors());

console.log("App listening at port 5001");

app.get("/", (req, resp) => {
    resp.send("App is Working");
});

app.post("/invoice", async (req, resp) => {
    try {
        
        const invoiceData = {};
        for (const key in req.body) {
            if (req.body[key] !== null && req.body[key] !== '') {
                invoiceData[key] = req.body[key];
            }
        }

        
        const newInvoice = new Invoice(invoiceData);
        const result = await newInvoice.save();

        
        resp.status(201).send({ success: true, data: result });
    } catch (e) {
        console.error('Error during invoice saving:', e);
        resp.status(501).send({ error: e.message });
    }
});


app.listen(5001, () => {
    console.log("Server is running on port 5001");
});
