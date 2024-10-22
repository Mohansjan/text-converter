import React, { useState } from 'react';
import './Passport.css';
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

const Passport = () => {

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

    const passportNumber = extractedText.match(/(?:Passport\s*Number|Passport\s*No|Passport\s*#)\s*[:\-]?\s*([A-Z0-9]+)/i)?.[1] || null;
    const dateOfIssue = extractedText.match(/(?:Date\s*of\s*Issue|Issued\s*On|Issue\s*Date)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1] || null;
    const dateOfExpiry = extractedText.match(/(?:Date\s*of\s*Expiry|Expiry\s*Date|Expires\s*On)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1] || null;
    const holderName = extractedText.match(/(?:Name|Passport Holder\s*Name|Full\s*Name)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim() || null;
    const nationality = extractedText.match(/(?:Nationality|Citizenship)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim() || null;
    const dateOfBirth = extractedText.match(/(?:Date\s*of\s*Birth|DOB)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1] || null;
    const issuingAuthority = extractedText.match(/(?:Issuing Authority|Issued By|Authority)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim() || null;
    const placeOfBirth = extractedText.match(/(?:Place\s*of\s*Birth|Birthplace)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim() || null;
    const gender = extractedText.match(/(?:Gender|Sex)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim() || null;
    const passportType = extractedText.match(/(?:Passport Type|Type of Passport)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim() || null;
    const validity = extractedText.match(/(?:Validity|Valid\s*Until)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1] || null;
    const address = extractedText.match(/(?:Address|Residential Address)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*\n|\r\n\r\n|\n$)/i)?.[1]?.trim() || null;

    const matchedDetails = {
      Passport_Number: passportNumber || 'Not Matched',
      Date_Of_Issue: dateOfIssue || 'Not Matched',
      Date_Of_Expiry: dateOfExpiry || 'Not Matched',
      Holder_Name: holderName || 'Not Matched',
      Nationality: nationality || 'Not Matched',
      Date_Of_Birth: dateOfBirth || 'Not Matched',
      Issuing_Authority: issuingAuthority || 'Not Matched',
      Place_Of_Birth: placeOfBirth || 'Not Matched',
      Gender: gender || 'Not Matched',
      PassportType: passportType || 'Not Matched',
      Validity: validity || 'Not Matched',
      Address: address || 'Not Matched'
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
        <h2 className='ocr'> PASSPORT OCR</h2>
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
        <h2 className='in-och'>Passport Converter</h2>
        <input className='in-oci' type="file" accept=".pdf,image/*" onChange={handleFileChange} />
        {file && (
          <div className='in-ext'>
            <p>Selected File: {file.name}</p>
            <button className="ext-text" onClick={handleFileUpload} disabled={isProcessing}>
              extarct
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
                        {invoice.Passport_Number !== 'Not Matched' && (
                          <tr className='tab-tr'>
                            <td>Passport Number</td>
                            <td>{invoice.Passport_Number}</td>
                          </tr>
                        )}
                        {invoice.Date_Of_Issue !== 'Not Matched' && (
                          <tr>
                            <td>Date Of Issue</td>
                            <td>{invoice.Date_Of_Issue}</td>
                          </tr>
                        )}
                        {invoice.Date_Of_Expiry !== 'Not Matched' && (
                          <tr>
                            <td>Date Of Expiry</td>
                            <td>{invoice.Date_Of_Expiry}</td>
                          </tr>
                        )}
                        {invoice.Holder_Name !== 'Not Matched' && (
                          <tr>
                            <td>Holder Name</td>
                            <td>{invoice.Holder_Name}</td>
                          </tr>
                        )}
                        {invoice.Nationality !== 'Not Matched' && (
                          <tr>
                            <td>Nationality</td>
                            <td>{invoice.Nationality}</td>
                          </tr>
                        )}
                        {invoice.Date_Of_Birth !== 'Not Matched' && (
                          <tr>
                            <td>Date Of Birth</td>
                            <td>{invoice.Date_Of_Birth}</td>
                          </tr>
                        )}
                        {invoice.Address !== 'Not Matched' && (
                          <tr>
                            <td>Address</td>
                            <td>{invoice.Address}</td>
                          </tr>
                        )}
                        {invoice.Issuing_Authority !== 'Not Matched' && (
                          <tr>
                            <td>Issuing Authority</td>
                            <td>{invoice.Issuing_Authority}</td>
                          </tr>
                        )}

                        {invoice.Place_Of_Birth !== 'Not Matched' && (
                          <tr>
                            <td>Place Of Birth</td>
                            <td>{invoice.Place_Of_Birth}</td>
                          </tr>
                        )}

                        {invoice.Gender !== 'Not Matched' && (
                          <tr>
                            <td>Gender</td>
                            <td>{invoice.Gender}</td>
                          </tr>
                        )}

                        {invoice.PassportType !== 'Not Matched' && (
                          <tr>
                            <td>PassportType</td>
                            <td>{invoice.PassportType}</td>
                          </tr>
                        )}

                        {invoice.Validity !== 'Not Matched' && (
                          <tr>
                            <td>Validity</td>
                            <td>{invoice.Validity}</td>
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

export default Passport;