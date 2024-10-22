import React, { useState } from 'react';
import './bank.css';
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

const Bank = () => {
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
            setZoomLevel(1);
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
        const transactionDate = extractedText.match(/(?:Transaction\s*Date|Date|Date of Transaction)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];
        const amount = extractedText.match(/(?:Amount|Transaction\s*Amount|Credit|Debit)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const accountNumber = extractedText.match(/(?:Account\s*Number|Account\s*No|Acc\s*No)\s*[:\-]?\s*(\d+)/i)?.[1];
        const balance = extractedText.match(/(?:Balance|Current Balance|Available Balance)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const transactionID = extractedText.match(/(?:Transaction\s*ID|Reference\s*Number)\s*[:\-]?\s*([\w-]+)/i)?.[1];
        let bankName;
        if (bankName = extractedText.match(/(?:Bank\s*Name|Financial Institution)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim()) {
            console.log("matched extracted text");
        }
        else if (bankName = extractedText.match(/(.*?)\s*BANK/i)?.[0]) {
            console.log("matched extracted text");
        }
        else {
            console.log("no matches found")
        }
        const openingBalance = extractedText.match(/Opening Balance\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        let closingBalance;
        if (closingBalance = extractedText.match(/Closing Balance\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1]) {
            console.log("matched bank details");
        }
        else if (closingBalance = extractedText.match(/closing balance on April 12, 2004\s*=\s*\$?([\d,]+\.\d{2})/i)?.[1]) {
            console.log("matched bank details")
        }

        else {
            console.log("no matches found");
        }
        const totalCredit = extractedText.match(/(Total money in|Total Deposits|Total Credits|Deposits Total)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[2];
        const totalDebit = extractedText.match(/(Total money out|Total Withdrawals|Total Debits|Withdrawals Total)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[2];
        const totalWithdrawals = extractedText.match(/Total withdrawals from your account\s*-\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const statementPeriod = extractedText.match(/(?:Statement\s*Period|Period)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
        const checkNumber = extractedText.match(/(?:Check\s*Number|Cheque\s*Number|Check\s*No)\s*[:\-]?\s*(\d+)/i)?.[1];
        const fees = extractedText.match(/(?:Fees|Charges|Transaction Fees)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const interest = extractedText.match(/(?:Interest\s*Earned|Interest)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const paymentMethod = extractedText.match(/(?:Payment\s*Method|Method of Payment)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
        const notes = extractedText.match(/(?:Notes|Remarks|Additional Information)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*\n|\r\n\r\n|\n$)/i)?.[1]?.trim();
        const transferAmount = extractedText.match(/(?:Transfer\s*Amount|Transferred\s*Amount)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const checkDate = extractedText.match(/(?:Check\s*Date|Cheque\s*Date)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];
        const transactionCategory = extractedText.match(/(?:Category|Transaction\s*Category)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
        const currency = extractedText.match(/(?:Currency|Type of Currency)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
        const originalAmount = extractedText.match(/(?:Original\s*Amount|Initial\s*Amount)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
        const description = extractedText.match(/(?:Description|Details|Transaction\s*Details)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();


        const matchedDetails = {
            Transaction_Date: transactionDate || 'Not Matched',
            Description: description || 'Not Matched',
            Amount: amount || 'Not Matched',
            Balance: balance || 'Not Matched',
            Account_Number: accountNumber || 'Not Matched',
            Transaction_ID: transactionID || 'Not Matched',
            Bank_Name: bankName || 'Not Matched',
            OpeningBalance: openingBalance || 'not matched',
            ClosingBalance: closingBalance || 'Not Matched',
            TotalWithdrawals: totalWithdrawals || 'Not Matched',
            TotalCredit: totalCredit || 'Not Matched',
            TotalDebit: totalDebit || 'Not Matched',
            StatementPeriod: statementPeriod || 'Not Matched',
            Check_Number: checkNumber || 'Not Matched',
            Fees: fees || 'Not Matched',
            Interest: interest || 'Not Matched',
            Payment_Method: paymentMethod || 'Not Matched',
            Notes: notes || 'Not Matched',
            Transfer_Amount: transferAmount || 'Not Matched',
            CheckDate: checkDate || 'Not Matched',
            Transaction_Category: transactionCategory || 'Not Matched',
            Currency: currency || 'Not Matched',
            Original_Amount: originalAmount || 'Not Matched'
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
            <FaFileImport className='icon'/>
                <h2 className='ocr'>BANK STATEMENT OCR</h2>


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
                        <div className="dropdowns-bank">
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
                <h2 className='in-och'>Bank Statement Converter</h2>
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
                        {/* <h2 className='extracted'>Matched Extracted Text</h2> */}
                        <div className='images'>
                            {imageSrc && (
                               
                                <div className='image-previews'
                                    style={{ cursor: zoomLevel === 2 ? 'zoom-out' : 'zoom-in' }}
                                    >
                                    <img
                                        src={imageSrc}
                                        alt="Preview"
                                        style={{
                                            maxHeight: '450px',
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

                            <table className='tab-1' style={{ maxHeight: '400px' }}>
                                <thead className='tab-head'>
                                    <tr className='tab-row'>
                                        <th className='tab-key'>Key</th>
                                        <th className='tab-key'>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {matchedInvoices.map((invoice, index) => (
                                        <React.Fragment key={index}>

                                            {invoice.Bank_Name !== 'Not Matched' && (
                                                <tr>
                                                    <td>Bank Name</td>
                                                    <td>{invoice.Bank_Name}</td>
                                                </tr>
                                            )}


                                            {invoice.Account_Number !== 'Not Matched' && (
                                                <tr>
                                                    <td>Account Number</td>
                                                    <td>{invoice.Account_Number}</td>
                                                </tr>
                                            )}

                                            {invoice.Transaction_ID !== 'Not Matched' && (
                                                <tr>
                                                    <td>Transaction ID</td>
                                                    <td>{invoice.Transaction_ID}</td>
                                                </tr>
                                            )}

                                            {invoice.Amount !== 'Not Matched' && (
                                                <tr>
                                                    <td>Amount</td>
                                                    <td>{invoice.Amount}</td>
                                                </tr>
                                            )}

                                            {invoice.Balance !== 'Not Matched' && (
                                                <tr>
                                                    <td>Balance</td>
                                                    <td>{invoice.Balance}</td>
                                                </tr>
                                            )}



                                            {invoice.Interest !== 'Not Matched' && (
                                                <tr>
                                                    <td>Interest</td>
                                                    <td>{invoice.Interest}</td>
                                                </tr>
                                            )}

                                            {invoice.OpeningBalance !== 'not matched' && (
                                                <tr>
                                                    <td>opening Balance</td>
                                                    <td>{invoice.OpeningBalance}</td>
                                                </tr>
                                            )}

                                            {invoice.ClosingBalance !== 'Not Matched' && (
                                                <tr>
                                                    <td>closingBalance</td>
                                                    <td>{invoice.ClosingBalance}</td>
                                                </tr>
                                            )}

                                            {invoice.TotalWithdrawals !== 'Not Matched' && (
                                                <tr>
                                                    <td>Total Withdrawals</td>
                                                    <td>{invoice.TotalWithdrawals}</td>
                                                </tr>
                                            )}

                                            {invoice.TotalCredit !== 'Not Matched' && (
                                                <tr>
                                                    <td>Total Credit</td>
                                                    <td>{invoice.TotalCredit}</td>
                                                </tr>
                                            )}

                                            {invoice.TotalDebit !== 'Not Matched' && (
                                                <tr>
                                                    <td>total Debit</td>
                                                    <td>{invoice.TotalDebit}</td>
                                                </tr>
                                            )}

                                            {invoice.StatementPeriod !== 'Not Matched' && (
                                                <tr>
                                                    <td>Statement Period</td>
                                                    <td>{invoice.StatementPeriod}</td>
                                                </tr>
                                            )}
                                            {invoice.Check_Number !== 'Not Matched' && (
                                                <tr>
                                                    <td>Check Number</td>
                                                    <td>{invoice.Check_Number}</td>
                                                </tr>
                                            )}
                                            {invoice.Fees !== 'Not Matched' && (
                                                <tr>
                                                    <td>Fees</td>
                                                    <td>{invoice.Fees}</td>
                                                </tr>
                                            )}

                                            {invoice.Payment_Method !== 'Not Matched' && (
                                                <tr>
                                                    <td>Payment Method</td>
                                                    <td>{invoice.Payment_Method}</td>
                                                </tr>
                                            )}
                                            {invoice.Notes !== 'Not Matched' && (
                                                <tr>
                                                    <td>Notes</td>
                                                    <td>{invoice.Notes}</td>
                                                </tr>
                                            )}

                                            {invoice.Transfer_Amount !== 'Not Matched' && (
                                                <tr>
                                                    <td>Transfer_Amount</td>
                                                    <td>{invoice.Transfer_Amount}</td>
                                                </tr>
                                            )}

                                            {invoice.Transaction_Date !== 'Not Matched' && (
                                                <tr className='tab-tr'>
                                                    <td>Transaction Date</td>
                                                    <td>{invoice.Transaction_Date}</td>
                                                </tr>
                                            )}
                                            {invoice.Description !== 'Not Matched' && (
                                                <tr>
                                                    <td>Description</td>
                                                    <td>{invoice.Description}</td>
                                                </tr>
                                            )}

                                            {invoice.CheckDate !== 'Not Matched' && (
                                                <tr>
                                                    <td>CheckDate</td>
                                                    <td>{invoice.CheckDate}</td>
                                                </tr>
                                            )}

                                            {invoice.Transaction_Category !== 'Not Matched' && (
                                                <tr>
                                                    <td>Transaction Category</td>
                                                    <td>{invoice.Transaction_Category}</td>
                                                </tr>
                                            )}
                                            {invoice.Currency !== 'Not Matched' && (
                                                <tr>
                                                    <td>Currency</td>
                                                    <td>{invoice.Currency}</td>
                                                </tr>
                                            )}
                                            {invoice.Original_Amount !== 'Not Matched' && (
                                                <tr>
                                                    <td>Original_Amount</td>
                                                    <td>{invoice.Original_Amount}</td>
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

export default Bank;
