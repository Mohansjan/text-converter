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

const PassportSchema = new mongoose.Schema({
    passportNumber: { type: String },   
    holderName: { type: String },     
    nationality: { type: String },    
    dateOfBirth: { type: Date },        
    dateOfIssue: { type: Date },           
    dateOfExpiry: { type: Date },         
    issuingAuthority: { type: String },   
    gender: { type: String },  
    placeOfBirth: { type: String },  
    passportType: { type: String },  
    validity: { type: Date },  
    address: { type: String }  
   
});


const Passport = mongoose.model('Passport', PassportSchema);

const app = express();
app.use(express.json());
app.use(cors());

console.log("App listening at port 5005");

app.get("/", (req, resp) => {
    resp.send("App is Working");
});

app.post("/passport", async (req, resp) => {
    try {
        
        const PassportData = {};
        for (const key in req.body) {
            if (req.body[key] !== null && req.body[key] !== '') {
                PassportData[key] = req.body[key];
            }
        }

        
        const newPassport = new Passport(PassportData);
        const result = await newPassport.save();

        
        resp.status(205).send({ success: true, data: result });
    } catch (e) {
        console.error('Error during passport details saving:', e);
        resp.status(505).send({ error: e.message });
    }
});


app.listen(5005, () => {
    console.log("Server is running on port 5005");
});
