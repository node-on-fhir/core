// /packages/pacio-core/server/methods/generateWatermarkedPdf.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { WatermarkedPdfCache, PacioCollectionHelpers } from '../../lib/collections/PacioCollections';

Meteor.methods({
  'pacio.generateWatermarkedPdf': async function(pdfUrl, options = {}) {
    check(pdfUrl, String);
    check(options, Object);
    
    const {
      text = 'WATERMARK',
      color = 'rgba(255, 0, 0, 0.3)',
      fontSize = 120,
      rotation = -45,
      opacity = 0.3
    } = options;
    
    // Check cache first
    const cached = await PacioCollectionHelpers.getCachedWatermarkedPdf(pdfUrl, text);
    if (cached) {
      console.log('Returning cached watermarked PDF');
      return cached.watermarkedUrl;
    }
    
    try {
      // In a real implementation, you would:
      // 1. Download the PDF from the URL
      // 2. Apply watermark using a PDF library like pdf-lib or HummusJS
      // 3. Upload the watermarked PDF to storage
      // 4. Return the new URL
      
      // For now, we'll simulate this with a placeholder
      console.log(`Generating watermarked PDF for ${pdfUrl} with text "${text}"`);
      
      // Simulated watermarked URL (in production, this would be the actual watermarked PDF)
      const watermarkedUrl = `${pdfUrl}?watermark=${encodeURIComponent(text)}`;
      
      // Cache the result
      await PacioCollectionHelpers.cacheWatermarkedPdf(
        pdfUrl,
        text,
        watermarkedUrl,
        { color, fontSize, rotation, opacity }
      );
      
      return watermarkedUrl;
      
    } catch (error) {
      console.error('Error generating watermarked PDF:', error);
      throw new Meteor.Error('watermark-failed', 'Failed to generate watermarked PDF');
    }
  },
  
  'pacio.getPdfMetadata': async function(pdfUrl) {
    check(pdfUrl, String);
    
    try {
      // In a real implementation, you would:
      // 1. Download the PDF
      // 2. Extract metadata using a PDF library
      // 3. Return the metadata
      
      // Placeholder implementation
      return {
        title: 'PDF Document',
        author: 'Unknown',
        subject: 'Document',
        keywords: [],
        creator: 'Unknown',
        producer: 'Unknown',
        creationDate: new Date(),
        modificationDate: new Date(),
        pageCount: 1
      };
      
    } catch (error) {
      console.error('Error getting PDF metadata:', error);
      throw new Meteor.Error('metadata-failed', 'Failed to get PDF metadata');
    }
  },
  
  'pacio.cleanupWatermarkCache': async function() {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const result = await PacioCollectionHelpers.cleanupExpiredCache();
    return {
      success: true,
      entriesRemoved: result
    };
  }
});

// Set up periodic cleanup of expired cache entries
if (Meteor.isServer) {
  Meteor.startup(function() {
    // Run cleanup every hour
    Meteor.setInterval(async function() {
      try {
        await PacioCollectionHelpers.cleanupExpiredCache();
      } catch (error) {
        console.error('Error cleaning up watermark cache:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  });
}