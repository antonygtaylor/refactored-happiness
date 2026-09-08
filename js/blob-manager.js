/**
 * BlobManager - Client-side BLOB Handle & Memory Management
 * Classic Script Global Namespace Architecture
 */
(function(window) {
  'use strict';

  var BlobManager = {
    // Map storing blob entries keyed by unique ID
    // Structure: { [id]: { blob, url, name, size, mimeType, isArchiveChild } }
    store: new Map(),

    /**
     * Store a file or raw ArrayBuffer/Blob and create an object URL handle
     * @param {Blob|ArrayBuffer|Uint8Array} data - The raw binary data
     * @param {string} fileName - Original file name
     * @param {string} [mimeType] - MIME type
     * @param {boolean} [isArchiveChild=false] - Flag if extracted from ZIP/Archive
     * @returns {Object} Blob metadata object containing handle URL and id
     */
    add: function(data, fileName, mimeType, isArchiveChild) {
      var blob;
      if (data instanceof Blob) {
        blob = data;
      } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        blob = new Blob([data], { type: mimeType || 'application/octet-stream' });
      } else {
        blob = new Blob([data], { type: mimeType || 'text/plain' });
      }

      var id = 'blob_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      var url = URL.createObjectURL(blob);

      var item = {
        id: id,
        blob: blob,
        url: url,
        name: fileName || 'file',
        size: blob.size,
        type: mimeType || blob.type || 'application/octet-stream',
        isArchiveChild: !!isArchiveChild,
        createdAt: new Date()
      };

      this.store.set(id, item);
      return item;
    },

    /**
     * Get a stored blob item by ID
     * @param {string} id
     * @returns {Object|null}
     */
    get: function(id) {
      return this.store.get(id) || null;
    },

    /**
     * Remove a stored blob item and revoke its URL handle to prevent memory leaks
     * @param {string} id
     */
    remove: function(id) {
      var item = this.store.get(id);
      if (item) {
        if (item.url) {
          URL.revokeObjectURL(item.url);
        }
        this.store.delete(id);
      }
    },

    /**
     * Revoke all managed object URLs and clear the store map
     */
    clearAll: function() {
      this.store.forEach(function(item) {
        if (item.url) {
          URL.revokeObjectURL(item.url);
        }
      });
      this.store.clear();
    },

    /**
     * Helper utility to format file size in human-readable string
     * @param {number} bytes
     * @returns {string}
     */
    formatSize: function(bytes) {
      if (bytes === 0) return '0 B';
      var k = 1024;
      var sizes = ['B', 'KB', 'MB', 'GB'];
      var i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
  };

  // Expose on global window object
  window.BlobManager = BlobManager;
})(window);
