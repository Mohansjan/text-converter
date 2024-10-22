import React, { useState } from 'react';
import './OcrConverter.css';
import Tesseract from 'tesseract.js';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import jsPDF from 'jspdf';
import '../index.css';
import { IoMdMenu } from "react-icons/io";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { FaFileImport } from "react-icons/fa";

console.log(Tesseract.version);
const Loader = () => {
  return (
    <div className="loader-container">
      <div className="outer-loader">
        <div className="inner-loader"></div>
      </div>
    </div>
  );
};

const OcrConverter = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [editableText, setEditableText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDocumentOptions, setShowDocumentOptions] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult('');
      setError('');
    }
  };

  const handleFileUpload = async () => {
    setIsProcessing(true);
    setResult('');
    setError('');

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await extractTextFromImage(file);
      }

      setResult(extractedText);
      setEditableText(extractedText);
    } catch (err) {
      console.error(err);
      setError('Error processing the file. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
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
    const avifToPng = async (file) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    };
  
    let imageBlob = file;
  
    if (file.type === 'image/avif') {
      imageBlob = await avifToPng(file);
    }
  
    const { data: { text } } = await Tesseract.recognize(
      URL.createObjectURL(imageBlob),
      'eng',
      {
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        logger: (m) => console.log(m),
      }
    );
    
  
    return text;
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

  const downloadTextFile = () => {
    if (!result) {
      alert('There is no text to download.');
      return;
    }

    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadExcelFile = () => {
    if (!result) {
      alert('There is no text to download.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet([{ Text: result }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Text');

    XLSX.writeFile(workbook, 'extracted_text.xlsx');
  };

  const downloadPdfFile = () => {
    if (!result) {
      alert('There is no text to download.');
      return;
    }

    const doc = new jsPDF();
    doc.text(result, 10, 10);
    doc.save('extracted_text.pdf');
  };

  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
    setShowDocumentOptions(false); 
  };

  const toggleDocumentOptions = () => {
    setShowDocumentOptions(prev => !prev);
    setShowDropdown(false); 
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
      .then(() => alert('Text copied to clipboard!'))
      .catch(err => alert('Failed to copy text: ' + err));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print</title></head><body>');
    printWindow.document.write('<pre>' + result + '</pre>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div>
      <div className='in-ocr'>
        <FaFileImport className='icon'/>
        <h2 className='ocr'>OCR CONVERTER</h2>

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
        </div>
      </div>

      {showDocumentOptions && (
        <div className="dropdowns-documents">
          <a href='Invoice' className='anchor'><button>Invoice</button> </a>
          <a href='bank' className='anchor'><button>Bank Statement</button> </a>
          <a href='receipt' className='anchor'><button>Receipt</button> </a>
          <a href='driverLicence'><button>Driver Licence</button></a>
          <a href='passport'><button>Passport</button></a>
          <a href='payslip'><button>Pay Slip</button></a>
          <a href='identity_proof'><button>Identity Proofing</button></a>
        </div>
      )}

      <div className='in-oc'>
        <h2 className='in-och'>TEXT CONVERTER OCR</h2>
        <input className='in-oci' type="file" accept=".pdf,image/*,.avif" onChange={handleFileChange} />
        {file && (
          <div className='in-ext'>
            <p>Selected File: {file.name}</p>
            <button className='ext-text' onClick={handleFileUpload} disabled={isProcessing}>
              Extract
            </button>
          </div>
        )}
      </div>

      {isProcessing && <Loader />}
      {error && <p className="error">{error}</p>}
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

          <button className='button-download' onClick={toggleDropdown}>
            Download Options
          </button>
          {showDropdown && (
            <div className="dropdowns-download">
              <button onClick={downloadTextFile}>Download as Text</button>
              <button onClick={downloadExcelFile}>Download as Excel</button>
              <button onClick={downloadPdfFile}>Download as PDF</button>
              <button onClick={handleCopy}>Copy to Clipboard</button>
              <button onClick={handlePrint}>Print Text</button>
            </div>
          )}
        </div>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default OcrConverter;
