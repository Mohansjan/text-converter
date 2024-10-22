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

const LicenceSchema = new mongoose.Schema({
    drivingLicenceNumber: { type: String },   
    idNumber: { type: String },  
    fullName: { type: String },     
    address: { type: String },    
    dateOfBirth: { type: Date },        
    issueDate: { type: Date },           
    expiryDate: { type: Date },         
    gender: { type: String },   
    dateOfIssue: { type: Date },  
    zipCode: { type: String },  
    eyeColor: { type: String },  
    height: { type: String },  
    weight: { type: Number },  
    licenseClass: { type: String },  
    restrictions: { type: String },  
    endorsements: { type: String }  
   
});


const Licence = mongoose.model('Licence', LicenceSchema);

const app = express();
app.use(express.json());
app.use(cors());

console.log("App listening at port 5004");

app.get("/", (req, resp) => {
    resp.send("App is Working");
});

app.post("/licence", async (req, resp) => {
    try {
        
        const LicenceData = {};
        for (const key in req.body) {
            if (req.body[key] !== null && req.body[key] !== '') {
                LicenceData[key] = req.body[key];
            }
        }

        
        const newLicence = new Licence(LicenceData);
        const result = await newLicence.save();

        
        resp.status(204).send({ success: true, data: result });
    } catch (e) {
        console.error('Error during driver license saving:', e);
        resp.status(504).send({ error: e.message });
    }
});


app.listen(5004, () => {
    console.log("Server is running on port 5004");
});
