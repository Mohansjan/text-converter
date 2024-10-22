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

const PaySlipSchema = new mongoose.Schema({
    employeeName: { type: String },        
    employeeID: { type: String },         
    bankName: { type: String },            
    basicSalary: { type: Number },       
    healthInsurance: { type: Number },     
    accountNo: { type: String },           
    designation: { type: String },        
    payPeriod: { type: String },         
    grossPay: { type: Number },           
    deductions: { type: Number },          
    netPay: { type: Number },            
    taxWithheld: { type: Number },        
    benefits: { type: String },           
    paymentDate: { type: Date },    
});

const PaySlip = mongoose.model('PaySlip', PaySlipSchema);

const app = express();
app.use(express.json());
app.use(cors());

console.log("App listening at port 5006");

app.get("/", (req, resp) => {
    resp.send("App is Working");
});

app.post("/payslip", async (req, resp) => {
    try {
        
        const PaySlipData = {};
        for (const key in req.body) {
            if (req.body[key] !== null && req.body[key] !== '') {
                PaySlipData[key] = req.body[key];
            }
        }

        
        const newPaySlip = new PaySlip(PaySlipData);
        const result = await newPaySlip.save();

        
        resp.status(206).send({ success: true, data: result });
    } catch (e) {
        console.error('Error during passport details saving:', e);
        resp.status(506).send({ error: e.message });
    }
});


app.listen(5006, () => {
    console.log("Server is running on port 5006");
});
