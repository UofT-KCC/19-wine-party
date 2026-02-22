import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess }) => {
  useEffect(() => {
    // Create an instance of the scanner
    const html5QrcodeScanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true
    }, false);

    // Render it
    html5QrcodeScanner.render((decodedText) => {
      onScanSuccess(decodedText);
    }, (errorMessage) => {
      // Optional: handle scan errors or ignore them since they trigger frequently
    });

    // Cleanup function when component unmounts
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScanSuccess]);

  return <div id="reader"></div>;
};

export default QRScanner;
