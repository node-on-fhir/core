// /packages/pacio-core/lib/utilities/PdfUtils.js

import { get } from 'lodash';

export const PdfUtils = {
  // Check if a URL is a PDF
  isPdfUrl: function(url) {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf') || 
           url.includes('application/pdf');
  },
  
  // Extract filename from URL
  getFilenameFromUrl: function(url) {
    if (!url) return 'document.pdf';
    
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Remove query parameters
    const cleanFilename = filename.split('?')[0];
    
    // Ensure it has .pdf extension
    if (!cleanFilename.endsWith('.pdf')) {
      return cleanFilename + '.pdf';
    }
    
    return cleanFilename;
  },
  
  // Generate a filename based on document metadata
  generateFilename: function(metadata = {}) {
    const type = get(metadata, 'type', 'document');
    const date = get(metadata, 'date');
    const patientName = get(metadata, 'patientName', '');
    
    let filename = type.toLowerCase().replace(/\s+/g, '-');
    
    if (patientName) {
      filename += '_' + patientName.toLowerCase().replace(/\s+/g, '-');
    }
    
    if (date) {
      const dateStr = new Date(date).toISOString().split('T')[0];
      filename += '_' + dateStr;
    }
    
    return filename + '.pdf';
  },
  
  // Convert base64 to blob
  base64ToBlob: function(base64Data, contentType = 'application/pdf') {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  },
  
  // Convert blob to base64
  blobToBase64: function(blob, callback) {
    const reader = new FileReader();
    reader.onloadend = function() {
      const base64 = reader.result.split(',')[1];
      callback(null, base64);
    };
    reader.onerror = function(error) {
      callback(error);
    };
    reader.readAsDataURL(blob);
  },
  
  // Download PDF from URL
  downloadPdf: function(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || this.getFilenameFromUrl(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  
  // Download PDF from base64 data
  downloadPdfFromBase64: function(base64Data, filename = 'document.pdf') {
    const blob = this.base64ToBlob(base64Data);
    const url = URL.createObjectURL(blob);
    
    this.downloadPdf(url, filename);
    
    // Clean up
    setTimeout(function() {
      URL.revokeObjectURL(url);
    }, 100);
  },
  
  // Open PDF in new tab
  openPdfInNewTab: function(url) {
    window.open(url, '_blank');
  },
  
  // Open PDF from base64 in new tab
  openPdfFromBase64InNewTab: function(base64Data) {
    const blob = this.base64ToBlob(base64Data);
    const url = URL.createObjectURL(blob);
    
    window.open(url, '_blank');
    
    // Clean up after a delay
    setTimeout(function() {
      URL.revokeObjectURL(url);
    }, 60000); // 1 minute
  },
  
  // Print PDF
  printPdf: function(url) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    
    iframe.onload = function() {
      iframe.contentWindow.print();
      setTimeout(function() {
        document.body.removeChild(iframe);
      }, 1000);
    };
    
    document.body.appendChild(iframe);
  },
  
  // Get PDF metadata (requires server-side processing)
  getPdfMetadata: function(url, callback) {
    if (Meteor.isClient) {
      Meteor.call('pacio.getPdfMetadata', url, callback);
    } else {
      // Server-side implementation would go here
      callback(new Error('getPdfMetadata must be called from client'));
    }
  },
  
  // Watermark configuration presets
  WatermarkPresets: {
    REVOKED: {
      text: 'REVOKED',
      color: 'rgba(255, 0, 0, 0.3)',
      fontSize: 120,
      rotation: -45
    },
    DRAFT: {
      text: 'DRAFT',
      color: 'rgba(128, 128, 128, 0.3)',
      fontSize: 100,
      rotation: -45
    },
    CONFIDENTIAL: {
      text: 'CONFIDENTIAL',
      color: 'rgba(0, 0, 255, 0.2)',
      fontSize: 80,
      rotation: -45
    },
    EXPIRED: {
      text: 'EXPIRED',
      color: 'rgba(255, 140, 0, 0.3)',
      fontSize: 100,
      rotation: -45
    }
  },
  
  // Get appropriate watermark for document status
  getWatermarkForStatus: function(status) {
    switch (status) {
      case 'entered-in-error':
        return this.WatermarkPresets.REVOKED;
      case 'draft':
        return this.WatermarkPresets.DRAFT;
      case 'expired':
        return this.WatermarkPresets.EXPIRED;
      default:
        return null;
    }
  },
  
  // Format file size
  formatFileSize: function(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Validate PDF file
  validatePdfFile: function(file) {
    const errors = [];
    
    if (!file) {
      errors.push('No file provided');
      return errors;
    }
    
    // Check file type
    if (file.type !== 'application/pdf') {
      errors.push('File must be a PDF');
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }
    
    // Check filename
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      errors.push('File must have .pdf extension');
    }
    
    return errors;
  }
};