import React, { useState } from 'react';
import './driver_license.css';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import { IoMdMenu } from "react-icons/io";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { FaFileImport } from "react-icons/fa";



const Loader =()=>{
    return(
      <div className="loader-container">
      <div className="outer-loader">
        <div className="inner-loader"></div>
      </div>
    </div>
    );
  };


const DriverLicence = () => {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [matchedInvoices, setMatchedInvoices] = useState([]);
    const [error, setError] = useState('');
    const [isEditable, setIsEditable] = useState(false);
    const [editableText, setEditableText] = useState('');
    const [imageSrc, setImageSrc] = useState('');
    const [zoomLevel, setZoomLevel] = useState('');
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

        const drivingLicenseNumber = extractedText.match(/(?:Driver License Number|License No|DL No|DL Number)\s*[:\-]?\s*([A-Z0-9-]+)/i)?.[1];
        const fullName = extractedText.match(/(?:Full Name|Name|Driver's Name)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
        const address = extractedText.match(/(?:Address|Residential Address|Home Address)\s*:\s*([\s\S]*?)(?=\n\s*\n|\r\n\r\n|\n$)/i)?.[1];
        const dateOfBirth = extractedText.match(/\b(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(\d{4})\b/)?.[0];
        const issueDate = extractedText.match(/(?:Issue Date|Issued)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];
        const expiryDate = extractedText.match(/(?:Expiry Date|Expiration Date|Valid Until)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];
        const gender = extractedText.match(/(?:Gender|Sex)\s*[:\-]?\s*(M|F|Male|Female)/i)?.[1];
        const dateOfIssue = extractedText.match(/(?:Date of Issue|Issued On)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];
        const zipCode = extractedText.match(/(?:Zip Code|Postal Code|ZIP)\s*[:\-]?\s*([0-9]{5}(-[0-9]{4})?)/i)?.[1];
        const eyeColor = extractedText.match(/(?:Eye Color|Eyes)\s*[:\-]?\s*([A-Za-z]+)/i)?.[1];
        const height = extractedText.match(/(?:Height|Ht)\s*[:\-]?\s*([\d]+(?:'\d{1,2})?)/i)?.[1];
        const weight = extractedText.match(/(?:Weight|Wgt)\s*[:\-]?\s*(\d+)\s*lbs/i)?.[1];
        const licenseClass = extractedText.match(/(?:Class|License Class|Class of License)\s*[:\-]?\s*([A-Z]+)/i)?.[1];
        const restrictions = extractedText.match(/(?:Restrictions|Restriction Codes)\s*[:\-]?\s*([^\n\r]+)/i)?.[1];
        const endorsements = extractedText.match(/(?:Endorsements|Endorsement Codes)\s*[:\-]?\s*([^\n\r]+)/i)?.[1];
        const idNumber = extractedText.match(/(?:ID Number|Document Number|ID|Identifier)\s*[:\-]?\s*([A-Z0-9-]+)/i)?.[1];

        const matchedDetails = {
            drivingLicense_number: drivingLicenseNumber || 'Not Matched',
            Fulll_Name: fullName || 'Not Matched',
            Address: address || 'Not Matched',
            DateOfBirth: dateOfBirth || 'Not Matched',
            Issue_Date: issueDate || 'Not Matched',
            Expiry_Date: expiryDate || 'Not Matched',
            Gender: gender || 'Not Matched',
            DateOfIssue: dateOfIssue || 'Not Matched',
            Zip_Code: zipCode || 'Not Matched',
            Eye_Color: eyeColor || 'Not Matched',
            Height: height || 'Not Matched',
            Weight: weight || 'Not Matched',
            License_Class: licenseClass || 'Not Matched',
            Restrictions: restrictions || 'Not Matched',
            EndorSements: endorsements || 'Not Matched',
            Id_Number: idNumber || 'Not Matched'
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
                <h2 className='ocr'>DRIVER LICENCE</h2>
                <div className='in-menu'>
          <div className='in-category' onClick={toggleDocumentOptions}>
          <h2 className='ocr-1'>Platform</h2>
        <MdOutlineKeyboardArrowDown className='icon-1'/>
           </div>

           <div className='in-category-1'>
          <h2 className='ocr-1'>Solution</h2>
          <MdOutlineKeyboardArrowDown className='icon-1'/>
           </div>

           <div className='in-category-2'>
          <h2 className='ocr-1'>Resources</h2>
          <MdOutlineKeyboardArrowDown className='icon-1'/>
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
                <h2 className='in-och'>Driving Licence Converter</h2>
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
                         {/* <h2 className='extracted'>Matched Extracted Text</h2>  */}
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
                        <div className='invoice-table' style={{ maxWidth: '100%',maxHeight : '400px',overflow:'auto'}}>
                            <div>
                                <table className='tab-1' style = {{maxHeight : '400px'}}>
                                    <thead className='tab-head'>
                                        <tr className='tab-row'>
                                            <th className='tab-key'>Key</th>
                                            <th className='tab-key'>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matchedInvoices.map((invoice, index) => (
                                            <React.Fragment key={index}>

                                                {invoice.Id_Number !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Id_Number</td>
                                                        <td>{invoice.Id_Number}</td>
                                                    </tr>
                                                )}
                                                {invoice.drivingLicense_number !== 'Not Matched' && (
                                                    <tr className='tab-tr'>
                                                        <td>drivingLicense Number</td>
                                                        <td>{invoice.drivingLicense_number}</td>
                                                    </tr>
                                                )}
                                                {invoice.Fulll_Name !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Full Name</td>
                                                        <td>{invoice.Fulll_Name}</td>
                                                    </tr>
                                                )}
                                                {invoice.Address !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Address</td>
                                                        <td>{invoice.Address}</td>
                                                    </tr>
                                                )}
                                                {invoice.DateOfBirth !== 'Not Matched' && (
                                                    <tr>
                                                        <td>date Of Birth</td>
                                                        <td>{invoice.DateOfBirth}</td>
                                                    </tr>
                                                )}
                                                {invoice.Issue_Date !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Issue Date</td>
                                                        <td>{invoice.Issue_Date}</td>
                                                    </tr>
                                                )}
                                                {invoice.Expiry_Date !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Expiry Date</td>
                                                        <td>{invoice.Expiry_Date}</td>
                                                    </tr>
                                                )}
                                                {invoice.Gender !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Gender</td>
                                                        <td>{invoice.Gender}</td>
                                                    </tr>
                                                )}
                                                {invoice.DateOfIssue !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Date Of Issue</td>
                                                        <td>{invoice.DateOfIssue}</td>
                                                    </tr>
                                                )}
                                                {invoice.Zip_Code !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Zip Code</td>
                                                        <td>{invoice.Zip_Code}</td>
                                                    </tr>
                                                )}
                                                {invoice.Eye_Color !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Eye Color</td>
                                                        <td>{invoice.Eye_Color}</td>
                                                    </tr>
                                                )}
                                                {invoice.Height !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Height</td>
                                                        <td>{invoice.Height}</td>
                                                    </tr>
                                                )}
                                                {invoice.Weight !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Weight</td>
                                                        <td>{invoice.Weight}</td>
                                                    </tr>
                                                )}
                                                {invoice.License_Class !== 'Not Matched' && (
                                                    <tr>
                                                        <td>License_Class</td>
                                                        <td>{invoice.License_Class}</td>
                                                    </tr>
                                                )}

                                                {invoice.Restrictions !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Restriction</td>
                                                        <td>{invoice.Restrictions}</td>
                                                    </tr>
                                                )}

                                                {invoice.EndorSements !== 'Not Matched' && (
                                                    <tr>
                                                        <td>Endorsements</td>
                                                        <td>{invoice.EndorSements}</td>
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



export default DriverLicence;