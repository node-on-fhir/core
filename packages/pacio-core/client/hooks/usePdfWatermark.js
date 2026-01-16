// /packages/pacio-core/client/hooks/usePdfWatermark.js

import { useState, useEffect, useRef } from 'react';
import { Meteor } from 'meteor/meteor';

export function usePdfWatermark(options = {}) {
  const {
    text = 'WATERMARK',
    color = 'rgba(255, 0, 0, 0.2)',
    fontSize = 120,
    rotation = -45,
    opacity = 0.2
  } = options;
  
  const [watermarkedUrl, setWatermarkedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  
  function applyWatermark(pdfUrl, callback) {
    setLoading(true);
    setError(null);
    
    Meteor.call('pacio.generateWatermarkedPdf', pdfUrl, {
      text,
      color,
      fontSize,
      rotation,
      opacity
    }, function(err, result) {
      setLoading(false);
      
      if (err) {
        setError(err.message);
        if (callback) callback(err);
      } else {
        setWatermarkedUrl(result);
        if (callback) callback(null, result);
      }
    });
  }
  
  function createCanvasWatermark() {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 800;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set watermark style
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = opacity;
    
    // Apply rotation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Draw watermark text
    ctx.fillText(text, 0, 0);
    
    ctx.restore();
    
    return canvas.toDataURL('image/png');
  }
  
  function applyClientSideWatermark(element) {
    if (!element) return;
    
    const watermarkDataUrl = createCanvasWatermark();
    
    // Apply as CSS background
    element.style.position = 'relative';
    
    // Create overlay div
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundImage = `url(${watermarkDataUrl})`;
    overlay.style.backgroundRepeat = 'repeat';
    overlay.style.backgroundPosition = 'center';
    overlay.style.backgroundSize = '400px 400px';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '1000';
    overlay.className = 'pdf-watermark-overlay';
    
    // Remove existing watermark if present
    const existingOverlay = element.querySelector('.pdf-watermark-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // Add new watermark
    element.appendChild(overlay);
    
    return function cleanup() {
      overlay.remove();
    };
  }
  
  function removeWatermark(element) {
    if (!element) return;
    
    const overlay = element.querySelector('.pdf-watermark-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
  
  // Cleanup on unmount
  useEffect(function() {
    return function() {
      if (canvasRef.current) {
        canvasRef.current = null;
      }
    };
  }, []);
  
  return {
    applyWatermark,
    applyClientSideWatermark,
    removeWatermark,
    createCanvasWatermark,
    watermarkedUrl,
    loading,
    error
  };
}

// Hook for watermarking multiple PDFs
export function useBatchPdfWatermark(options = {}) {
  const [results, setResults] = useState({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  function applyBatchWatermark(pdfUrls, watermarkOptions, callback) {
    if (!Array.isArray(pdfUrls) || pdfUrls.length === 0) {
      if (callback) callback(new Error('No PDF URLs provided'));
      return;
    }
    
    setProcessing(true);
    setProgress(0);
    const newResults = {};
    let completed = 0;
    
    pdfUrls.forEach(function(url, index) {
      Meteor.call('pacio.generateWatermarkedPdf', url, watermarkOptions, function(err, result) {
        completed++;
        setProgress((completed / pdfUrls.length) * 100);
        
        if (err) {
          newResults[url] = { error: err.message };
        } else {
          newResults[url] = { watermarkedUrl: result };
        }
        
        if (completed === pdfUrls.length) {
          setProcessing(false);
          setResults(newResults);
          if (callback) callback(null, newResults);
        }
      });
    });
  }
  
  return {
    applyBatchWatermark,
    results,
    processing,
    progress
  };
}