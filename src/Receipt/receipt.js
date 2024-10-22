import React, { useState } from 'react';
import './receipt.css';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import { IoMdMenu } from "react-icons/io";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { FaFileImport } from "react-icons/fa";





const Loader = () => (
  <div className="loader">
    <div className="spinner"></div>
  </div>
);

const Receipt = () => {
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

    const receiptNumber = extractedText.match(/(?:Receipt\s*#|Receipt\s*Number|Rec#|RCPT)\s*[:\-]?\s*([0-9A-Z-]+)/i)?.[1];
    const merchantName = extractedText.match(/(?:Merchant|Store|Vendor)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
    const purchaseDate = extractedText.match(/(?:Purchase\s*Date|Date)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];
    const totalAmount = extractedText.match(/(?:Total|Amount\s*Due|Total\s*Amount)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
    const items = extractedText.match(/(?:Item\s*Description|Description|Items)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*\n|\r\n\r\n|\n$)/i)?.[1]?.trim();
    const paymentMethod = extractedText.match(/(?:Payment\s*Method|Method)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
    const taxAmount = extractedText.match(/(?:Tax|Sales\s*Tax)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
    const discountAmount = extractedText.match(/(?:Discount|Discounts)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];
    const transactionID = extractedText.match(/(?:Transaction\s*ID|Transaction\s*No|Ref#)\s*[:\-]?\s*([\w-]+)/i)?.[1];
    const storeAddress = extractedText.match(/(?:Store\s*Address|Merchant\s*Address)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*\n|\r\n\r\n|\n$)/i)?.[1]?.trim();
    const customerName = extractedText.match(/(?:Customer Name|Client Name|Name)\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
    const discountPercentage = extractedText.match(/(?:Discount|Sale)\s*[:\-]?\s*(\d{1,3}\%)\s*off/i)?.[1];

    const matchedDetails = {
      Receipt_Number: receiptNumber || 'Not Matched',
      Customer_Name: customerName || 'Not Matched',
      Merchant_Name: merchantName || 'Not Matched',
      Purchase_Date: purchaseDate || 'Not Matched',
      Total_Amount: totalAmount || 'Not Matched',
      Items: items || 'Not Matched',
      Payment_Method: paymentMethod || 'Not Matched',
      Tax_Amount: taxAmount || 'Not Matched',
      Discount_Amount: discountAmount || 'Not Matched',
      Transaction_ID: transactionID || 'Not Matched',
      Store_Address: storeAddress || 'Not Matched',
      Discount_percentage: discountPercentage || 'Not Matched'
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
        <h2 className='ocr'> RECEIPT OCR</h2>
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
        <h2 className='in-och'>RECEIPT CONVERTER</h2>
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
                        {invoice.Receipt_Number !== 'Not Matched' && (
                          <tr className='tab-tr'>
                            <td>Receipt Number</td>
                            <td>{invoice.Receipt_Number}</td>
                          </tr>
                        )}
                        {invoice.Customer_Name !== 'Not Matched' && (
                          <tr>
                            <td>Customer Name</td>
                            <td>{invoice.Customer_Name}</td>
                          </tr>
                        )}
                        {invoice.Merchant_Name !== 'Not Matched' && (
                          <tr>
                            <td>Merchant_Name</td>
                            <td>{invoice.Merchant_Name}</td>
                          </tr>
                        )}
                        {invoice.Purchase_Date !== 'Not Matched' && (
                          <tr>
                            <td>Purchase_Date</td>
                            <td>{invoice.Purchase_Date}</td>
                          </tr>
                        )}
                        {invoice.Total_Amount !== 'Not Matched' && (
                          <tr>
                            <td>Total_Amount</td>
                            <td>{invoice.Total_Amount}</td>
                          </tr>
                        )}

                        {invoice.Items !== 'Not Matched' && (
                          <tr>
                            <td>Items</td>
                            <td>{invoice.Items}</td>
                          </tr>
                        )}
                        {invoice.Payment_Method !== 'Not Matched' && (
                          <tr>
                            <td>Payment_Method</td>
                            <td>{invoice.Payment_Method}</td>
                          </tr>
                        )}
                        {invoice.Tax_Amount !== 'Not Matched' && (
                          <tr>
                            <td>Tax Amount</td>
                            <td>{invoice.Tax_Amount}</td>
                          </tr>
                        )}

                        {invoice.Discount_Amount !== 'Not Matched' && (
                          <tr>
                            <td>Discount Amount</td>
                            <td>{invoice.Discount_Amount}</td>
                          </tr>
                        )}

                        {invoice.Transaction_ID !== 'Not Matched' && (
                          <tr>
                            <td>Transaction ID</td>
                            <td>{invoice.Transaction_ID}</td>
                          </tr>
                        )}

                        {invoice.Store_Address !== 'Not Matched' && (
                          <tr>
                            <td>Store Address</td>
                            <td>{invoice.Store_Address}</td>
                          </tr>
                        )}

                        {invoice.Discount_percentage !== 'Not Matched' && (
                          <tr>
                            <td>Discount percentage</td>
                            <td>{invoice.Discount_percentage}</td>
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

export default Receipt;
