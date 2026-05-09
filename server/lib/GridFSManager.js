// server/lib/GridFSManager.js
// GridFS bucket management singleton for DICOM file storage
// Provides streaming upload/download without loading full files into memory
// Files are automatically chunked into 255 KB pieces across dicom.files + dicom.chunks collections

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// GridFSBucket is available from the MongoDB driver bundled with Meteor
const MongoInternals = Package['mongo'].MongoInternals;
const { GridFSBucket, ObjectId } = MongoInternals.NpmModules.mongodb.module;

let _bucket = null;
let _db = null;
let _initialized = false;

const BUCKET_NAME = 'dicom';
const CHUNK_SIZE = 255 * 1024; // 255 KB (MongoDB default)

const GridFSManager = {
  /**
   * Initialize the GridFS bucket
   * Called at Meteor.startup after MongoDB connection is ready
   * Uses the same database as Meteor's default MongoDB connection
   */
  initialize() {
    try {
      // Get the raw MongoDB Db object from Meteor's internal driver
      _db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;

      if (!_db) {
        console.error('[GridFSManager] Could not access MongoDB database object');
        return false;
      }

      _bucket = new GridFSBucket(_db, {
        bucketName: BUCKET_NAME,
        chunkSizeBytes: CHUNK_SIZE
      });

      _initialized = true;
      console.log(`[GridFSManager] Initialized: bucket="${BUCKET_NAME}", chunkSize=${CHUNK_SIZE} bytes`);
      return true;
    } catch (error) {
      console.error('[GridFSManager] Initialization failed:', error.message);
      return false;
    }
  },

  /**
   * Check if GridFS is initialized and ready
   * @returns {boolean}
   */
  isInitialized() {
    return _initialized && _bucket !== null;
  },

  /**
   * Get the GridFS bucket instance
   * @returns {GridFSBucket|null}
   */
  getBucket() {
    if (!this.isInitialized()) {
      console.warn('[GridFSManager] Not initialized - call initialize() first');
      return null;
    }
    return _bucket;
  },

  /**
   * Open a writable stream for uploading a file to GridFS
   * @param {string} filename - Original filename
   * @param {Object} metadata - Additional metadata to store with the file
   * @returns {GridFSBucketWriteStream}
   */
  openUploadStream(filename, metadata = {}) {
    if (!this.isInitialized()) {
      throw new Meteor.Error('gridfs-not-initialized', 'GridFS is not initialized');
    }

    return _bucket.openUploadStream(filename, {
      chunkSizeBytes: CHUNK_SIZE,
      metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString()
      }
    });
  },

  /**
   * Open a readable stream for downloading a file from GridFS
   * @param {string} fileId - The GridFS file _id (as string)
   * @param {Object} options - Options like { start, end } for Range requests
   * @returns {GridFSBucketReadStream}
   */
  openDownloadStream(fileId, options = {}) {
    if (!this.isInitialized()) {
      throw new Meteor.Error('gridfs-not-initialized', 'GridFS is not initialized');
    }

    const objectId = new ObjectId(fileId);
    return _bucket.openDownloadStream(objectId, options);
  },

  /**
   * Find a file's metadata by its _id
   * @param {string} fileId - The GridFS file _id (as string)
   * @returns {Promise<Object|null>} - File metadata document or null
   */
  async findFile(fileId) {
    if (!this.isInitialized()) {
      return null;
    }

    try {
      const objectId = new ObjectId(fileId);
      const files = await _bucket.find({ _id: objectId }).toArray();
      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('[GridFSManager] findFile error:', error.message);
      return null;
    }
  },

  /**
   * Delete a file and its chunks from GridFS
   * @param {string} fileId - The GridFS file _id (as string)
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileId) {
    if (!this.isInitialized()) {
      return false;
    }

    try {
      const objectId = new ObjectId(fileId);
      await _bucket.delete(objectId);
      console.log('[GridFSManager] Deleted file:', fileId);
      return true;
    } catch (error) {
      console.error('[GridFSManager] deleteFile error:', error.message);
      return false;
    }
  },

  /**
   * Get storage statistics for the Getting Started wizard
   * @returns {Promise<Object>} - { initialized, bucketName, chunkSize, fileCount, totalSize }
   */
  async getStats() {
    if (!this.isInitialized()) {
      return {
        initialized: false,
        bucketName: BUCKET_NAME,
        chunkSize: CHUNK_SIZE,
        fileCount: 0,
        totalSize: 0
      };
    }

    try {
      const files = await _bucket.find({}).toArray();
      const totalSize = files.reduce(function(sum, file) {
        return sum + (file.length || 0);
      }, 0);

      // Count chunks from the dicom.chunks collection
      let chunkCount = 0;
      try {
        const chunksCollection = _db.collection(BUCKET_NAME + '.chunks');
        chunkCount = await chunksCollection.countDocuments({});
      } catch (chunkError) {
        console.warn('[GridFSManager] Could not count chunks:', chunkError.message);
      }

      return {
        initialized: true,
        bucketName: BUCKET_NAME,
        chunkSize: CHUNK_SIZE,
        fileCount: files.length,
        chunkCount: chunkCount,
        totalSize: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('[GridFSManager] getStats error:', error.message);
      return {
        initialized: true,
        bucketName: BUCKET_NAME,
        chunkSize: CHUNK_SIZE,
        fileCount: 0,
        totalSize: 0,
        error: error.message
      };
    }
  }
};

export default GridFSManager;
