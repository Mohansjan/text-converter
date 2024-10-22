import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css';
import Tables from './tables/tables.js';
import MarksSection from './marksSection/marks.js';
import Test from './test/test.js';
import ExambleSection from './exambleSection/examble.js';
import OcrConverter from './OcrConverter/OcrConverter.js';
import Invoice from './InvoiceSection/Invoice.js';
import Bank from './BankStatement/bank.js';
import Receipt from './Receipt/receipt.js';
import DriverLicence from './Driver_License/driver_license.js';
import Passport from './Passport/Passport.js';
import PaySlip from './PaySlip_Section/PaySlip.js';
import Identity from './Identity_Proof/Identity.js';
import axios from 'axios';

const App = () => {

  //   const [name, setName] = useState("");
  //   const [email, setEmail] = useState("");

  //   const handleOnSubmit = async (e) => {
  //     e.preventDefault();
  //     try {
  //         let result = await fetch('http://localhost:5000/register', {
  //             method: "post",
  //             body: JSON.stringify({ name, email }),
  //             headers: {
  //                 'Content-Type': 'application/json'
  //             }
  //         });

  //         if (!result.ok) {
  //             throw new Error('Network response was not ok ' + result.statusText);
  //         }

  //         result = await result.json();
  //         alert("Data saved successfully");
  //         setEmail("");
  //         setName("");
  //     } catch (error) {
  //         console.error('There was a problem with the fetch operation:', error);
  //         alert('Failed to save data');
  //     }
  // };

  return (


    <div className='app'>
      <BrowserRouter>
        <Routes>
          <Route
            path='/'
            element={<OcrConverter />}
          />
          <Route path='/tables' element={<Tables />} />
          <Route path="/marks" element={<MarksSection />} />
          <Route path="/test" element={<Test />} />
          <Route path='/examble' element={<ExambleSection />} />
          <Route path='/Invoice' element={<Invoice />} />
          <Route path='/Bank' element={<Bank />} />
          <Route path='/receipt' element={<Receipt />} />
          <Route path='/driverLicence' element={<DriverLicence />} />
          <Route path='passport' element={<Passport />} />
          <Route path='payslip' element={<PaySlip />} />
          <Route path='identity_proof' element={<Identity />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};


//     <h1>This is React WebApp </h1>
//     <form action="">
//         <input type="text" placeholder="name" 
//         value={name} onChange={(e) => setName(e.target.value)} />
//         <input type="email" placeholder="email" 
//         value={email} onChange={(e) => setEmail(e.target.value)} />
//         <button type="submit" 
//         onClick={handleOnSubmit}>submit</button>
//     </form>

// </>




export default App;
