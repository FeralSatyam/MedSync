import { useRef, useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';
import toast from 'react-hot-toast';

const SimpleCamera = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualName, setManualName] = useState('');
  const [detectedNames, setDetectedNames] = useState([]);

  // Common medicine names in Nepal for suggestions
  const commonMedicines = [
    'Paracetamol', 'Metformin', 'Amoxicillin', 'Cetirizine', 'Omeprazole',
    'Losartan', 'Atorvastatin', 'Azithromycin', 'Ciprofloxacin', 'Diclofenac',
    'Ibuprofen', 'Amlodipine', 'Pantoprazole', 'Levothyroxine', 'Gabapentin',
    'Tramadol', 'Doxycycline', 'Cefixime', 'Montelukast', 'Budesonide'
  ];

  const startCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { exact: facingMode } }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facingMode }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (fallbackErr) {
        console.error("Camera error:", fallbackErr);
        alert("Could not access camera. Please check permissions.");
        onClose();
      }
    }
  };

  const flipCamera = () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // Preprocess image for better OCR
  const preprocessImage = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Increase contrast and convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
      const contrast = 1.5; // Increase contrast
      const adjusted = 128 + contrast * (brightness - 128);
      const final = Math.min(255, Math.max(0, adjusted));
      data[i] = final;     // R
      data[i+1] = final;   // G
      data[i+2] = final;   // B
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const extractMedicineNames = (text) => {
    const candidates = new Set();
    
    // Clean text
    const cleanText = text
      .replace(/[©®™°=_~|]/g, ' ')
      .replace(/[^\w\s\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Pattern 1: Common medicine names (direct match)
    for (const medicine of commonMedicines) {
      if (cleanText.match(new RegExp(medicine, 'i'))) {
        candidates.add(medicine);
      }
    }
    
    // Pattern 2: Brand name with hyphen (e.g., Pyremust-650)
    const hyphenMatches = cleanText.match(/([A-Z][a-z]+(?:[A-Za-z]*)-?\d+)/gi);
    if (hyphenMatches) {
      hyphenMatches.forEach(m => candidates.add(m));
    }
    
    // Pattern 3: Capitalized words with 4+ characters
    const words = cleanText.split(/\s+/);
    for (const word of words) {
      if (word.length >= 4 && word.length <= 30 && /^[A-Z][a-z]+/.test(word)) {
        if (!['The', 'And', 'For', 'With', 'From', 'This', 'That', 'Tablet', 'Capsule'].includes(word)) {
          candidates.add(word);
        }
      }
    }
    
    // Pattern 4: ALL CAPS words (typical on packaging)
    const allCaps = cleanText.match(/[A-Z]{4,}(?:\s+[A-Z]{4,})*/g);
    if (allCaps) {
      allCaps.forEach(m => {
        if (m.length < 30) candidates.add(m);
      });
    }
    
    // Pattern 5: Words ending with common suffixes
    const suffixes = /(?:mycin|icillin|pirin|zole|done|pine|zine|lol|pril|statin|azole|oxacin|vir)$/i;
    for (const word of words) {
      if (suffixes.test(word) && word.length > 3) {
        candidates.add(word);
      }
    }
    
    return Array.from(candidates).slice(0, 5); // Return top 5 candidates
  };

  const takePhotoAndExtract = async () => {
    if (!videoRef.current) return;
    
    setProcessing(true);
    
    try {
      // Capture image
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(videoRef.current, 0, 0);
      
      // Preprocess image for better OCR
      const processedCanvas = preprocessImage(canvas);
      
      const blob = await new Promise(resolve => {
        processedCanvas.toBlob(resolve, 'image/jpeg', 0.95);
      });
      
      const processingToast = toast.loading('Scanning medicine name...', { duration: 0 });
      
      // Try multiple OCR configurations
      let bestText = '';
      let bestConfidence = 0;
      
      // First try with default settings
      const result1 = await Tesseract.recognize(blob, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      bestText = result1.data.text;
      bestConfidence = result1.data.confidence || 0;
      
      // Try with tessedit_char_whitelist for better medicine name detection
      const result2 = await Tesseract.recognize(blob, 'eng', {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-0123456789',
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress (optimized): ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      // Use the result with higher confidence or combine both
      const combinedText = result2.data.text + ' ' + bestText;
      
      toast.dismiss(processingToast);
      
      console.log('OCR Result 1:', bestText);
      console.log('OCR Result 2:', result2.data.text);
      
      // Extract candidates
      const candidates = extractMedicineNames(combinedText);
      setDetectedNames(candidates);
      
      if (candidates.length > 0) {
        // Show selection dialog if multiple candidates
        if (candidates.length === 1) {
          const confirmed = confirm(`Detected: ${candidates[0]}\n\nUse this medicine name?`);
          if (confirmed) {
            onCapture(candidates[0]);
            onClose();
          } else {
            setShowManualEntry(true);
            setManualName(candidates[0]);
          }
        } else {
          // Multiple candidates - let user choose
          const options = candidates.map((name, i) => `${i + 1}. ${name}`).join('\n');
          const choice = prompt(
            `Multiple medicine names detected:\n${options}\n\nEnter number to select, or type a new name:`,
            '1'
          );
          
          if (choice && !isNaN(choice) && choice >= 1 && choice <= candidates.length) {
            onCapture(candidates[choice - 1]);
            onClose();
          } else if (choice && choice.trim()) {
            onCapture(choice.trim());
            onClose();
          } else {
            setShowManualEntry(true);
          }
        }
      } else {
        // No candidates found
        toast.error('Could not detect medicine name');
        setShowManualEntry(true);
      }
      
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('OCR failed. Please enter manually.');
      setShowManualEntry(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = () => {
    if (manualName.trim()) {
      onCapture(manualName.trim());
      onClose();
    } else {
      toast.error('Please enter a medicine name');
    }
  };

  // Manual entry modal
  if (showManualEntry) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-semibold text-navy mb-4">Enter Medicine Name</h3>
          
          <input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="e.g., Paracetamol"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 mb-4 focus:outline-none focus:border-mint"
            autoFocus
          />
          
          {detectedNames.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {detectedNames.map((name, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setManualName(name)}
                    className="bg-gray-100 text-navy px-3 py-1 rounded-full text-sm hover:bg-gray-200"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleManualSubmit}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
            >
              Confirm
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-navy">Scan Medicine Box</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>
        
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full rounded-lg"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                          w-64 h-24 border-2 border-yellow-400 rounded-lg opacity-75">
              <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs whitespace-nowrap">
                Position medicine name here
              </div>
            </div>
          </div>
          
          {processing && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
                <p className="text-white text-sm">Reading text...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex gap-3">
          <button 
            onClick={flipCamera}
            disabled={processing}
            className="bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            🔄 Flip
          </button>
          
          <button 
            onClick={takePhotoAndExtract}
            disabled={processing}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {processing ? 'Processing...' : '📸 Capture & Extract'}
          </button>
          
          <button 
            onClick={() => {
              setShowManualEntry(true);
              onClose();
            }}
            disabled={processing}
            className="bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            Manual
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-3">
          {facingMode === 'environment' ? 'Using back camera' : 'Using front camera'} • Tap Capture for auto-detect
        </p>
      </div>
    </div>
  );
};

export default SimpleCamera;