/**
 * Main Application Logic & UI Alpine.js Store Integration
 * Classic Script Global Namespace Architecture
 */
(function(window) {
  'use strict';

  // Wait for DOMContentLoaded to initialize Alpine component state
  document.addEventListener('alpine:init', function() {
    Alpine.data('docApp', function() {
      return {
        files: [],          // Parsed files array [{ id, blobUrl, name, size, type, ext, rawText, htmlContent, stats, isArchive, children }]
        searchQuery: '',    // Filter text query
        isLoading: false,   // Processing state spinner
        isDragging: false,  // Drag over state for drop-zone
        selectedTab: 'all', // Active filter tab ('all', 'docx', 'xlsx', 'pptx', 'pdf', 'zip', 'txt')

        init: function() {
          console.log('DocuHighlight PWA App initialized.');
        },

        /**
         * Handle file selection event from file input
         */
        handleFileSelect: function(event) {
          var inputFiles = event.target.files;
          if (inputFiles && inputFiles.length > 0) {
            this.processFiles(Array.from(inputFiles));
            // Reset input value to allow re-uploading same file if desired
            event.target.value = '';
          }
        },

        /**
         * Handle drop event on drag-and-drop zone
         */
        handleDrop: function(event) {
          this.isDragging = false;
          var droppedFiles = event.dataTransfer.files;
          if (droppedFiles && droppedFiles.length > 0) {
            this.processFiles(Array.from(droppedFiles));
          }
        },

        /**
         * Process batch of files sequentially
         * @param {File[]} fileList
         */
        processFiles: function(fileList) {
          var self = this;
          self.isLoading = true;

          var parsePromises = fileList.map(function(file) {
            // Save raw file into BlobManager
            var blobItem = window.BlobManager ? window.BlobManager.add(file, file.name, file.type, false) : null;

            return window.FileParser.parseFile(file, file.name).then(function(parsed) {
              if (blobItem) {
                parsed.id = blobItem.id;
                parsed.blobUrl = blobItem.url;
              } else {
                parsed.id = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
              }
              return parsed;
            });
          });

          Promise.all(parsePromises).then(function(results) {
            results.forEach(function(item) {
              self.files.unshift(item); // Prepend new files to list
            });
            self.isLoading = false;
          }).catch(function(err) {
            console.error('Error processing uploaded files:', err);
            self.isLoading = false;
          });
        },

        /**
         * Remove single file item from list and BlobManager memory
         * @param {string} id
         */
        removeFile: function(id) {
          var idx = this.files.findIndex(function(f) { return f.id === id; });
          if (idx !== -1) {
            var item = this.files[idx];
            // Revoke child blob URLs if archive
            if (item.children && item.children.length > 0) {
              item.children.forEach(function(child) {
                if (child.blobId && window.BlobManager) {
                  window.BlobManager.remove(child.blobId);
                }
              });
            }
            if (window.BlobManager) {
              window.BlobManager.remove(id);
            }
            this.files.splice(idx, 1);
          }
        },

        /**
         * Clear all parsed files and release Blob memory handles
         */
        clearAll: function() {
          if (window.BlobManager) {
            window.BlobManager.clearAll();
          }
          this.files = [];
        },

        /**
         * Trigger browser print dialog for current parsed document view
         */
        printReport: function() {
          window.print();
        },

        /**
         * Get filtered files based on active tab and search query
         */
        get filteredFiles() {
          var self = this;
          var query = self.searchQuery.trim().toLowerCase();

          return self.files.filter(function(file) {
            // Tab filter
            if (self.selectedTab !== 'all') {
              if (self.selectedTab === 'docx' && !['docx', 'doc'].includes(file.ext)) return false;
              if (self.selectedTab === 'xlsx' && !['xlsx', 'xls', 'csv'].includes(file.ext)) return false;
              if (self.selectedTab === 'pptx' && !['pptx', 'ppt'].includes(file.ext)) return false;
              if (self.selectedTab === 'pdf' && file.ext !== 'pdf') return false;
              if (self.selectedTab === 'zip' && file.ext !== 'zip') return false;
              if (self.selectedTab === 'txt' && !['txt', 'md', 'json', 'log'].includes(file.ext)) return false;
            }

            // Search query filter
            if (query) {
              var inName = file.name.toLowerCase().includes(query);
              var inText = file.rawText ? file.rawText.toLowerCase().includes(query) : false;
              return inName || inText;
            }

            return true;
          });
        },

        /**
         * Computed total highlight stats across all files
         */
        get totalStats() {
          var total = { action: 0, money: 0, date: 0, email: 0, sum: 0 };
          this.files.forEach(function(f) {
            if (f.stats) {
              total.action += f.stats.action || 0;
              total.money += f.stats.money || 0;
              total.date += f.stats.date || 0;
              total.email += f.stats.email || 0;
              total.sum += f.stats.total || 0;
            }
          });
          return total;
        },

        /**
         * Helper to format bytes
         */
        formatSize: function(bytes) {
          return window.BlobManager ? window.BlobManager.formatSize(bytes) : bytes + ' B';
        }
      };
    });
  });
})(window);
