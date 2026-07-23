// /packages/pacio-core/server/methods/generateWatermarkedPdf.js

import { Meteor } from 'meteor/meteor';
import { WatermarkedPdfCache, PacioCollectionHelpers } from '../../lib/collections/PacioCollections';

// requireAuth note: generateWatermarkedPdf and getPdfMetadata historically had
// NO auth guard. They are not genuinely public (they operate on document URLs
// tied to patient advance-directive material), so requireAuth now defaults to
// true — a behavior change flagged in the commit message.
Meteor.ServerMethods.define('pacio.generateWatermarkedPdf', {
  description: 'Generate (or return a cached) watermarked copy of a PDF at a URL',
  phi: true,
  positionalParams: ['pdfUrl', 'options'],
  schemaObject: {
    type: 'object',
    properties: { pdfUrl: { type: 'string' }, options: { type: 'object' } },
    required: ['pdfUrl']
  }
}, async function(params, context) {
  const pdfUrl = params.pdfUrl;
  const options = params.options || {};

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
    context.log.info('Returning cached watermarked PDF');
    return cached.watermarkedUrl;
  }

  try {
    // In a real implementation, you would:
    // 1. Download the PDF from the URL
    // 2. Apply watermark using a PDF library like pdf-lib or HummusJS
    // 3. Upload the watermarked PDF to storage
    // 4. Return the new URL

    // For now, we'll simulate this with a placeholder
    context.log.info('Generating watermarked PDF', { pdfUrl, text });

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
    context.log.error('Error generating watermarked PDF', { error: error && error.message });
    throw new Meteor.Error('watermark-failed', 'Failed to generate watermarked PDF');
  }
});

Meteor.ServerMethods.define('pacio.getPdfMetadata', {
  description: 'Extract metadata (title, author, page count) from a PDF at a URL',
  phi: true,
  positionalParams: ['pdfUrl'],
  schemaObject: {
    type: 'object',
    properties: { pdfUrl: { type: 'string' } },
    required: ['pdfUrl']
  }
}, async function(params, context) {
  const pdfUrl = params.pdfUrl;

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
    context.log.error('Error getting PDF metadata', { error: error && error.message });
    throw new Meteor.Error('metadata-failed', 'Failed to get PDF metadata');
  }
});

Meteor.ServerMethods.define('pacio.cleanupWatermarkCache', {
  description: 'Remove expired entries from the watermarked-PDF cache',
  phi: false
}, async function(params, context) {
  const result = await PacioCollectionHelpers.cleanupExpiredCache();
  return {
    success: true,
    entriesRemoved: result
  };
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