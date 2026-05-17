import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';

const CameraCapture = ({ onMedicineNameExtracted }) => {
  const webcamRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const captureAndExtract = async () => {
    if (!webcamRef.current) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      // Capture image from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      
      // Extract text using Tesseract.js
      const { data: { text } } = await Tesseract.recognize(
        imageSrc,
        'eng', // Language
        {
          logger: (m) => console.log(m), // Optional: track progress
        }
      );
      
      // Parse medicine name from extracted text
      const medicineName = extractMedicineName(text);
      
      if (medicineName) {
        onMedicineNameExtracted(medicineName);
        setCapturing(false); // Close camera after success
      } else {
        setError('Could not find medicine name. Please try again.');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const extractMedicineName = (text) => {
    // Common medicine name patterns
    const patterns = [
      // Look for common medicine name patterns
      /(?:Brand|Medicine|Product)\s*Name:\s*([A-Za-z0-9\s]+)/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/m, // Capitalized words
      /([A-Z]{2,}(?:\s+[A-Z][a-z]+)+)/, // All caps or mixed
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Fallback: Take first line that looks like a name (2+ words, starts with capital)
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 3 && 
          trimmed.length < 50 && 
          /^[A-Z][a-z]+\s+[A-Za-z]/.test(trimmed)) {
        return trimmed;
      }
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan Medicine Box</h3>
          <button
            onClick={() => setCapturing(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="relative">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full rounded-lg"
            videoConstraints={{
              facingMode: "environment" // Use back camera on mobile
            }}
          />
          
          {processing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                <p>Processing image...</p>
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="mt-4 flex gap-3">
          <button
            onClick={captureAndExtract}
            disabled={processing}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Capture & Extract
          </button>
          <button
            onClick={() => setCapturing(false)}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-3 text-center">
          Position the medicine name clearly in frame
        </p>
      </div>
    </div>
  );
};

export default CameraCapture;