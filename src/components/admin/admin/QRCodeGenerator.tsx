import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Download, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface QRCode {
  id: string;
  tableNumber: string;
  url: string;
}

function QRCodeGenerator() {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);
  const baseUrl = window.location.origin;

  const generateQRCode = () => {
    if (!tableNumber.trim()) return;

    const newQRCode: QRCode = {
      id: Date.now().toString(),
      tableNumber: tableNumber.trim(),
      url: `${baseUrl}?table=${tableNumber.trim()}`
    };

    setQRCodes([...qrCodes, newQRCode]);
    setTableNumber('');
    toast.success('QR Code generated successfully');
  };

  const deleteQRCode = (id: string) => {
    setQRCodes(qrCodes.filter(qr => qr.id !== id));
    toast.success('QR Code deleted');
  };

  const downloadQRCode = async (tableNumber: string) => {
    try {
      const qrElement = document.getElementById(`qr-${tableNumber}`);
      if (!qrElement) {
        throw new Error('QR Code element not found');
      }

      // Create a canvas element
      const canvas = document.createElement('canvas');
      const svgData = new XMLSerializer().serializeToString(qrElement);
      const img = new Image();

      // Create a Blob from the SVG data
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Wait for the image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgUrl;
      });

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image on the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      ctx.drawImage(img, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob(blob => resolve(blob!), 'image/png')
      );

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `table-${tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(svgUrl);
      toast.success('QR Code downloaded successfully');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR Code');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Table QR Code Generator</h2>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          placeholder="Enter table number"
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={generateQRCode}
          className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Generate QR
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" ref={qrRef}>
        {qrCodes.map((qr) => (
          <motion.div
            key={qr.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border rounded-lg p-4 flex flex-col items-center"
          >
            <div className="text-lg font-semibold mb-4">Table {qr.tableNumber}</div>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <QRCodeSVG
                id={`qr-${qr.tableNumber}`}
                value={qr.url}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => downloadQRCode(qr.tableNumber)}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => deleteQRCode(qr.id)}
                className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {qrCodes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No QR codes generated yet. Add a table number to get started.
        </div>
      )}
    </div>
  );
}

export default QRCodeGenerator;