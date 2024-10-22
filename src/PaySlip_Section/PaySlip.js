import React, { useState } from 'react';
import './PaySlip.css';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import { IoMdMenu } from "react-icons/io";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { FaFileImport } from "react-icons/fa";




const Loader = () => {
    return (
        <div className="loader-container">
            <div className="outer-loader">
                <div className="inner-loader"></div>
            </div>
        </div>
    );
};

const PaySlip = () => {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [matchedInvoices, setMatchedInvoices] = useState([]);
    const [error, setError] = useState('');
    const [isEditable, setIsEditable] = useState(false);
    const [editableText, setEditableText] = useState('');
    const [imageSrc, setImageSrc] = useState('');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDocumentOptions, setShowDocumentOptions] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult('');
            setMatchedInvoices([]);
            setError('');
            setImageSrc('');
        }
    };

    const handleFileUpload = async () => {
        setIsProcessing(true);
        setResult('');
        setError('');
        setImageSrc('');

        try {
            let extractedText = '';

            if (file.type === 'application/pdf') {
                const images = await extractImagesFromPDF(file);
                setImageSrc(images[0]);
                extractedText = await extractTextFromPDF(file);
            } else {
                extractedText = await extractTextFromImage(file);
                setImageSrc(URL.createObjectURL(file));
            }

            setResult(extractedText);
            setEditableText(extractedText);
            const matched = matchInvoices(extractedText);
            setMatchedInvoices(matched);
        } catch (err) {
            console.error(err);
            setError('Error processing the file. Please try another file.');
        } finally {
            setIsProcessing(false);
        }
    };

    const extractImagesFromPDF = async (file) => {
        const pdfData = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjsLib.getDocument(pdfData).promise;
        const images = [];

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const context = canvas.getContext('2d');
            await page.render({ canvasContext: context, viewport: viewport }).promise;

            images.push(canvas.toDataURL());
        }

        return images;
    };

    const extractTextFromPDF = async (file) => {
        const pdfData = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjsLib.getDocument(pdfData).promise;
        let textContent = '';

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const text = await page.getTextContent();
            const textItems = text.items.map(item => item.str);
            textContent += textItems.join(' ') + '\n';
        }

        return textContent;
    };

    const extractTextFromImage = async (file) => {
        const { data: { text } } = await Tesseract.recognize(
            URL.createObjectURL(file),
            'eng',
            {
                logger: (m) => console.log(m),
            }
        );

        return text;
    };

    const matchInvoices = (extractedText) => {
        const matches = [];

        const employeeName = extractedText.match(/(?:Employee Name|Name)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
        const employeeID = extractedText.match(/(?:Employee ID|ID|Emp#)\s*[:\-]?\s*([0-9A-Z-]+)/i)?.[1];
        const bankName = extractedText.match(/(?:Bank Name|Bank):\s*([^\n]+)/i)?.[1]?.trim();
        const basicSalary = extractedText.match(/(?:Basic Salary)\s*([\d,]+)/i)?.[1];
        const healthInsurance = extractedText.match(/(?:Health Insurance)\s*([\d,]+)/i)?.[1];
        const accountNo = extractedText.match(/(?:Alc No|Account No|Account Number):\s*([0-9]+)/i)?.[1];
        const designation = extractedText.match(/(?:Designation|Job Title):\s*([^\n]+)/i)?.[1]?.trim();
        const payPeriod = extractedText.match(/(?:Pay Period|Period)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
        const grossPay = extractedText.match(/(?:Gross Pay|Total Earnings)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const deductions = extractedText.match(/(?:Deductions|Total Deductions)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const netPay = extractedText.match(/(?:Net Pay|Total Take Home)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const taxWithheld = extractedText.match(/(?:Tax Withheld|tax withheld|Withholding Tax)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const benefits = extractedText.match(/(?:Benefits|Other Deductions)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
        const paymentDate = extractedText.match(/(?:Payment Date|Date Paid)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];

        const matchedDetails = {
            Employee_Name: employeeName || 'Not Matched',
            Employee_ID: employeeID || 'Not Matched',
            BankName: bankName || 'Not Matched',
            Account_Number: accountNo || 'Not Matched',
            PayPeriod: payPeriod || 'Not Matched',
            Designation: designation || 'Not Matched',
            Basic_Salary: basicSalary || 'Not Matched',
            HealthInsurance: healthInsurance || 'Not Matched',
            Gross_Pay: grossPay || 'Not Matched',
            Deductions: deductions || 'Not Matched',
            NetPay: netPay || 'Not Matched',
            TaxWithHeld: taxWithheld || 'Not Matched',
            Benefits: benefits || 'Not Matched',
            Payment_Date: paymentDate || 'Not Matched',
        };

        matches.push(matchedDetails);
        return matches;
    };

    const toggleDropdown = () => {
        setShowDropdown(prev => !prev);
        setShowDocumentOptions(false);
    };

    const toggleDocumentOptions = () => {
        setShowDocumentOptions(prev => !prev);
        setShowDropdown(false);
    };

    const handleImageDoubleClick = () => {
        setZoomLevel((prevLevel) => (prevLevel === 1 ? 2 : 1));
    };

    const handleTextClick = () => {
        setIsEditable(true);
    };

    const handleTextChange = (e) => {
        setEditableText(e.target.value);
    };

    const handleTextBlur = () => {
        setIsEditable(false);
        setResult(editableText);
    };

    return (
        <div className='statement-container'>
            <div className='in-ocr'>
                <FaFileImport className='icon' />
                <h2 className='ocr'>PAY SLIP</h2>
                <div className='in-menu'>
                    <div className='in-category' onClick={toggleDocumentOptions}>
                        <h2 className='ocr-1'>Platform</h2>
                        <MdOutlineKeyboardArrowDown className='icon-1' />
                    </div>

                    <div className='in-category-1'>
                        <h2 className='ocr-1'>Solution</h2>
                        <MdOutlineKeyboardArrowDown className='icon-1' />
                    </div>

                    <div className='in-category-2'>
                        <h2 className='ocr-1'>Resources</h2>
                        <MdOutlineKeyboardArrowDown className='icon-1' />
                    </div>

                    {showDocumentOptions && (
                        <div className="dropdowns-invoices">
                            <a href='Invoice' className='anchor'><button>Invoice</button> </a>
                            <a href='bank' className='anchor'><button>Bank Statement</button> </a>
                            <a href='receipt' className='anchor'><button>Receipt</button> </a>
                            <a href='driverLicence'><button>Driver Licence</button></a>
                            <a href='passport'><button>Passport</button></a>
                            <a href='payslip'><button>Pay Slip</button></a>
                            <a href='identity_proof'><button>Identity Proofing</button></a>
                        </div>
                    )}


                </div>

            </div>
            <div className='in-oc'>
                <h2 className='in-och'>PAY SLIP CONVERTER</h2>
                <input className='in-oci' type="file" accept=".pdf,image/*" onChange={handleFileChange} />
                {file && (
                    <div className='in-ext'>
                        <p>Selected File: {file.name}</p>
                        <button className="ext-text" onClick={handleFileUpload} disabled={isProcessing}>
                            Extract
                        </button>
                    </div>
                )}
            </div>
            {isProcessing && <Loader />}
            {error && <p className="error">{error}</p>}

            {matchedInvoices.length > 0 && (
                <div className='matched'>
                    <div className='col-lg-6 col-md-12 col-sm-12 col-xs-12'>
                        {/* <h2 className='extracted'>Matched Extracted Text </h2> */}
                        <div className='images'>
                            {imageSrc && (
                                <div className='image-previews'
                                    style={{ cursor: zoomLevel === 2 ? 'zoom-out' : 'zoom-in' }}
                                >
                                    <img
                                        src={imageSrc}
                                        alt="Preview"
                                        style={{
                                            maxHeight: '400px',
                                            maxWidth: '320px',
                                            transform: `scale(${zoomLevel})`,
                                            transition: 'transform 0.3s ease'
                                        }}
                                        onDoubleClick={handleImageDoubleClick}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='col-lg-6 col-md-12 col-sm-12 col-xs-12'>
                        <div className='invoice-table' style={{ maxWidth: '100%', maxHeight: '400px', overflow: 'auto' }}>
                            <div>
                                <table className='tab-1'>
                                    <thead className='tab-head'>
                                        <tr className='tab-row'>
                                            <th className='tab-key'>Key</th>
                                            <th className='tab-key'>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matchedInvoices.map((invoice, index) => (
                                            <React.Fragment key={index}>
                                                {invoice.Employee_Name !== 'Not Matched' && (
                                                    <tr className='tab-tr'>
                                                        <td>Employee Name</td>
                                                        <td>{invoice.Employee_Name}</td>
                                                    </tr>
                                                )}

                                                {invoice.Employee_ID !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Employee ID</td>
                                                        <td>{invoice.Employee_ID}</td>
                                                    </tr>
                                                )}

                                                {invoice.Basic_Salary !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Basic Salary</td>
                                                        <td>{invoice.Basic_Salary}</td>
                                                    </tr>
                                                )}


                                                {invoice.BankName !== 'Not Matched' && (
                                                    <tr>
                                                        <td>BankName</td>
                                                        <td>{invoice.BankName}</td>
                                                    </tr>
                                                )}

                                                {invoice.Account_Number !== 'Not Matched' && (
                                                    <tr>
                                                        <td>accountNumber</td>
                                                        <td>{invoice.Account_Number}</td>
                                                    </tr>
                                                )}

                                                {invoice.Designation !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Designation</td>
                                                        <td>{invoice.Designation}</td>
                                                    </tr>
                                                )}


                                                {invoice.HealthInsurance !== 'Not Matched' && (
                                                    <tr>
                                                        <td>HealthInsurance</td>
                                                        <td>{invoice.HealthInsurance}</td>
                                                    </tr>
                                                )}


                                                {invoice.PayPeriod !== 'Not Matched' && (
                                                    <tr>
                                                        <td>PayPeriod</td>
                                                        <td>{invoice.PayPeriod}</td>
                                                    </tr>
                                                )}
                                                {invoice.Gross_Pay !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Gross Pay</td>
                                                        <td>{invoice.Gross_Pay}</td>
                                                    </tr>
                                                )}
                                                {invoice.Deductions !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Deductions</td>
                                                        <td>{invoice.Deductions}</td>
                                                    </tr>
                                                )}
                                                {invoice.NetPay !== 'Not Matched' && (
                                                    <tr>
                                                        <td>NetPay</td>
                                                        <td>{invoice.NetPay}</td>
                                                    </tr>
                                                )}
                                                {invoice.TaxWithHeld !== 'Not Matched' && (
                                                    <tr>
                                                        <td>TaxWithHeld</td>
                                                        <td>{invoice.TaxWithHeld}</td>
                                                    </tr>
                                                )}
                                                {invoice.Benefits !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Benefits</td>
                                                        <td>{invoice.Benefits}</td>
                                                    </tr>
                                                )}
                                                {invoice.Payment_Date !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Payment Date</td>
                                                        <td>{invoice.Payment_Date}</td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {error && <div style={{ color: 'red' }}>{error}</div>}
                        </div>
                    </div>
                </div>
            )}
            <div className='extraction-container'>
                {result && (
                    <div className='in-ocr-1'>
                        <h2 className='ext'>Extracted Text</h2>
                        {isEditable ? (
                            <textarea
                                style={{ width: '100%', maxWidth: '700px' }}
                                value={editableText}
                                onChange={handleTextChange}
                                onBlur={handleTextBlur}
                                autoFocus
                                className='editable-text'
                                rows={15}
                            />
                        ) : (
                            <p className='in-ocp' onClick={handleTextClick}>{result}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaySlip;
