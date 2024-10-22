import React, { useState } from 'react';
import './Invoice.css';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import { IoMdMenu } from "react-icons/io";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { FaFileImport } from "react-icons/fa";
import axios from 'axios';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="outer-loader">
        <div className="inner-loader"></div>
      </div>
    </div>
  );
};

const Invoice = () => {
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
  const invoiceNumbersSet = new Set(); 


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
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        logger: (m) => console.log(m),
      }
    );

    return text;
  };


  const matchInvoices = (extractedText) => {
    const matches = [];

    const invoiceNumber = extractedText.match(/(?:INVOICE\s*#|INV-|Invoice\s*No:?)\s*([0-9A-Z-]*)/i)?.[1] || null;

    // Proceed only if we have an invoice number and it's not already matched
    if (invoiceNumber && !invoiceNumbersSet.has(invoiceNumber)) {
      invoiceNumbersSet.add(invoiceNumber);
    }
    const customerName = extractedText.match(/(?:Customer Name|name|Client Name)\s*:\s*([^\n\r]*)/i)?.[1]?.trim() || null;
    const purchaseOrder = extractedText.match(/(?:Order\s*Number|PO|Purchase\s*Order)\s*[:\-]?\s*([\w-]*)/i)?.[1] || null;

    let invoiceDate;
    if (invoiceDate = extractedText.match(/(?:Invoice\s*Date|INVOICE\s*DATE|Date|Invoice\s*Date\s*|Issued\s*On|Date\s*Issued|Invoice\s*Issued)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})?/i)?.[1]) {
      console.log("matched with invoice date format");
    }
    else if (invoiceDate = extractedText.match(/(?:Invoice\s*Date|INVOICE\s*DATE|Date|Invoice\s*Issued|Issued\s*On)\s*\.?\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1]) {
      console.log("matched with invoice date format");
    }
    else if (invoiceDate = extractedText.match(/(?:Invoice\s*Date|INVOICE\s*DATE|Date|Issued\s*On|Invoice\s*Issued)\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i)?.[1]) {
      console.log("matched with invoice date format");
    }
    else if (invoiceDate = extractedText.match(/(?:Invoice\s*Date|INVOICE\s*DATE|Date|Issued\s*On|Invoice\s*Issued)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})/i)?.[1]) {
      console.log("matched with invoice date format");
    }
    else {
      console.log("not found")
    }

    let dueDate;
    if (dueDate = extractedText.match(/(?:Due\s*Date|DUE\s*DATE|Payment\s*Due|Due)\s*[:\-]?\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})?/i)?.[1]) {
      console.log("matched with duedate format", dueDate[1]);
    }
    else if (dueDate = extractedText.match(/(?:Due\s*Date\s*)\d{2}\s+\w{3}\s+\d{4}/)) {

      console.log("matched with duedate format", dueDate[1]);
    }
    else if (dueDate = extractedText.match(/(?:Due\s*Date|DUE\s*DATE|Due\s*By|Due\s*On|Deadline)\s*[:\-]?\s*[A-Za-z]{1,9}\s+\d{1,2},\s+\d{2,4}/i)) {
      console.log("matched with duedate format", dueDate[1]);
    }
    else {
      console.log("no match found");
    }

    const quantity = extractedText.match(/(?:Quantity|QUANTITY|Qty|Quantity\s*Ordered)\s*[:\-]?\s*(\d*)?/i)?.[1] || null;
    const subTotal = extractedText.match(/(?:Subtotal|Sub\s*Total|Net\s*Amount)\s*[:\-]?\s*\$?([\d,]+\.\d{2})?/i)?.[1] || null;

    let total;
    if (total = extractedText.match(/(?:GRAND\s*TOTAL|Total|AMOUNT DUE|Amount\s*Due|Total\s*Amount)\s*[:\-]?\s*\$?([\d,]+\.\d{2})?/i)?.[1]) {
      console.log("matched with total format")
    }
    else if (total = extractedText.match(/(?:Total|TOTAL|Total Amount|TOTAL AMOUNT)\s*[$]?\s*(\d+(\.\d{2})?)/i)?.[1]) {
      console.log("matched data with total format");
    }
    else {
      console.log("no matched data available");
    }

    const billingAddress = extractedText.match(/(?:Billing\s*Address|Billed\s*To)\s*:\s*([\s\S]*?)(?=\n\s*\n|\r\n\r\n|\n$)?/i)?.[1] || null;
    const shippingAddress = extractedText.match(/(?:Shipping\s*Address|Ship\s*To)\s*:\s*([\s\S]*?)(?=\n\s*\n|\r\n\r\n|\n$)?/i)?.[1] || null;

    let tax;

    if (tax = extractedText.match(/(?:Tax\s*Rate|Tax\s*Percentage)\s*:\s*\$?(\d+(\.\d{1,2})?)%?/)) {

      console.log("Matched with Tax Rate or Tax Percentage format:", tax[1]);
    } else if (tax = extractedText.match(/(?:Tax\s*Rate\s+\$?\d+\.\d{2})%?/)) {

      console.log("Matched with Tax Rate format:", tax[1]);
    }
    else if (tax = extractedText.match(/Tax\s+\$?\d+\.\d{2}/)) {
      console.log("Matched with tax format:", tax[1]);
    }
    else if (tax = extractedText.match(/TAX\s*\(\s*\d+%\s*\)\s*\$?\d+\.\d{2}/)) {
      console.log("Matched with tax format:", tax[1]);
    }
    else {

      console.log("No match found");
    }

    const discount = extractedText.match(/(?:Discount|Discounts)\s*[:\-]?\s*\$?([\d,]+\.\d{2})/i)?.[1];

    const matchedDetails = {
      Invoice_Number: invoiceNumber || 'Not Matched',
      Customer_Name: customerName || 'Not Matched',
      Purchase_Order: purchaseOrder || 'Not Matched',
      Invoice_Date: invoiceDate || 'Not Matched',
      Due_Date: dueDate || 'Not Matched',
      Quantity: quantity || 'Not Matched',
      Total: total || 'Not Matched',
      Sub_Total: subTotal || 'Not Matched',
      billing_Address: billingAddress || 'Not Matched',
      shipping_Address: shippingAddress || 'Not Matched',
      Tax: tax || 'Not Matched',
      Discount: discount || 'Not Matched'
    };

    matches.push(matchedDetails);
    return matches;
  };

  const handleImageDoubleClick = () => {
    setZoomLevel((prevLevel) => (prevLevel === 1 ? 2 : 1));

  };

  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
    setShowDocumentOptions(false);
  };

  const toggleDocumentOptions = () => {
    setShowDocumentOptions(prev => !prev);
    setShowDropdown(false);
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


  const saveInvoice = async (invoice) => {
    const invoiceData = {
      invoiceNumber: invoice.Invoice_Number !== 'Not Matched' ? invoice.Invoice_Number : null,
      customerName: invoice.Customer_Name !== 'Not Matched' ? invoice.Customer_Name : null,
      purchaseOrder: invoice.Purchase_Order !== 'Not Matched' ? invoice.Purchase_Order : null,
      invoiceDate: invoice.Invoice_Date !== 'Not Matched' ? new Date(invoice.Invoice_Date).toISOString() : null,
      dueDate: invoice.Due_Date !== 'Not Matched' ? new Date(invoice.Due_Date).toISOString() : null,
      quantity: invoice.Quantity !== 'Not Matched' ? parseInt(invoice.Quantity, 10) : null,
      total: invoice.Total !== 'Not Matched' ? parseFloat(invoice.Total.replace(/[^0-9.-]+/g, "")) : null,
      subTotal: invoice.Sub_Total !== 'Not Matched' ? parseFloat(invoice.Sub_Total.replace(/[^0-9.-]+/g, "")) : null,
      billingAddress: invoice.billing_Address !== 'Not Matched' ? invoice.billing_Address : null,
      shippingAddress: invoice.shipping_Address !== 'Not Matched' ? invoice.shipping_Address : null,
      tax: invoice.Tax !== 'Not Matched' ? parseFloat(invoice.Tax): null,
      discount: invoice.Discount !== 'Not Matched' ? parseFloat(invoice.Discount.replace(/[^0-9.-]+/g, "")) : null,
    };

    
    Object.keys(invoiceData).forEach(key => invoiceData[key] === null && delete invoiceData[key]);

    try {
      const response = await axios.post('http://localhost:5001/invoice', invoiceData);
      console.log('Invoice saved:', response.data);
      alert('Invoice saved successfully!');
    } catch (error) {
      console.error('Error saving invoice:', error.response?.data || error.message);
      alert(`Failed to save invoice: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className='statement-container'>
      <div className='in-ocr'>
        <FaFileImport className='icon' />
        <h2 className='ocr'> INVOICE OCR</h2>
        <div className='in-menu'>
          <div className='in-category'>
            <h2 className='ocr-1' onClick={toggleDocumentOptions}>Platform</h2>
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
        <h2 className='in-och'>Invoice Converter</h2>
        <input className='in-oci' type="file" accept=".pdf,image/*" onChange={handleFileChange} />
        {file && (
          <div className='in-ext'>
            <p>Selected File: {file.name}</p>
            <button className="ext-text" onClick={handleFileUpload} disabled={isProcessing}>
              extract
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
                <div
                  className='image-previews'
                  style={{ cursor: zoomLevel === 2 ? 'zoom-out' : 'zoom-in' }}
                >
                  <img
                    src={imageSrc}
                    alt="Preview"
                    style={{
                      maxHeight: '400px',
                      maxWidth: '300px',
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
                <table className='tab-1' style={{ maxHeight: '400px' }} >
                  <thead className='tab-head'>
                    <tr className='tab-row'>
                      <th className='tab-key'>Key</th>
                      <th className='tab-key'>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedInvoices.map((invoice, index) => (
                      <React.Fragment key={index}>
                        {invoice.Invoice_Number !== 'Not Matched' && (
                          <tr className='tab-tr'>
                            <td>Invoice Number</td>
                            <td>{invoice.Invoice_Number}</td>
                          </tr>
                        )}
                        {invoice.Customer_Name !== 'Not Matched' && (
                          <tr>
                            <td>Customer Name</td>
                            <td>{invoice.Customer_Name}</td>
                          </tr>
                        )}
                        {invoice.Purchase_Order !== 'Not Matched' && (
                          <tr>
                            <td>Purchase Number</td>
                            <td>{invoice.Purchase_Order}</td>
                          </tr>
                        )}
                        {invoice.Invoice_Date !== 'Not Matched' && (
                          <tr>
                            <td>Invoice Date</td>
                            <td>{invoice.Invoice_Date}</td>
                          </tr>
                        )}
                        {invoice.Due_Date !== 'Not Matched' && (
                          <tr>
                            <td>Due Date</td>
                            <td>{invoice.Due_Date}</td>
                          </tr>
                        )}
                        {invoice.Quantity !== 'Not Matched' && (
                          <tr>
                            <td>Quantity</td>
                            <td>{invoice.Quantity}</td>
                          </tr>
                        )}
                        {invoice.Total !== 'Not Matched' && (
                          <tr>
                            <td>Total</td>
                            <td>{invoice.Total}</td>
                          </tr>
                        )}
                        {invoice.Sub_Total !== 'Not Matched' && (
                          <tr>
                            <td>Sub Total</td>
                            <td>{invoice.Sub_Total}</td>
                          </tr>
                        )}

                        {invoice.billing_Address !== 'Not Matched' && (
                          <tr>
                            <td>Billing Address</td>
                            <td>{invoice.billing_Address}</td>
                          </tr>
                        )}

                        {invoice.shipping_Address !== 'Not Matched' && (
                          <tr>
                            <td>shipping Address</td>
                            <td>{invoice.shipping_Address}</td>
                          </tr>
                        )}

                        {invoice.Tax !== 'Not Matched' && (
                          <tr>
                            <td>Tax</td>
                            <td>{invoice.Tax}</td>
                          </tr>
                        )}

                        {invoice.Discount !== 'Not Matched' && (
                          <tr>
                            <td>Discount</td>
                            <td>{invoice.Discount}</td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={2}>
                            <button onClick={() => saveInvoice(invoice)}>
                              Save Invoice
                            </button>
                          </td>
                        </tr>
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

export default Invoice;
