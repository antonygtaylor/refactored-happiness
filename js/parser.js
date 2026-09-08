/**
 * FileParser - Multi-Format Client-Side Parser Engine
 * Classic Script Global Namespace Architecture
 *
 * Supports:
 * - ZIP Archives (.zip) via JSZip
 * - Word Documents (.docx, .doc) via Mammoth & Text fallback
 * - Spreadsheets (.xlsx, .xls, .csv) via SheetJS
 * - PowerPoint (.pptx, .ppt) via JSZip XML extraction (slides & speaker notes)
 * - PDF Documents (.pdf) via pdf.js
 * - Text & Markdown (.txt, .md, .json, .log, etc.)
 */
(function(window) {
  'use strict';

  var FileParser = {
    /**
     * Main route entry point to process a file or Blob
     * @param {File|Blob} file - The file to parse
     * @param {string} fileName - File name
     * @returns {Promise<Object>} Resolved object containing parsed result:
     *   { name, size, type, ext, rawText, htmlContent, stats, isArchive, children }
     */
    parseFile: function(file, fileName) {
      var name = fileName || file.name || 'unnamed';
      var ext = this.getExtension(name);

      var result = {
        name: name,
        size: file.size || 0,
        type: file.type || 'application/octet-stream',
        ext: ext,
        rawText: '',
        htmlContent: '',
        stats: { action: 0, money: 0, date: 0, email: 0, total: 0 },
        isArchive: false,
        children: []
      };

      // Route by file extension / format
      if (ext === 'zip') {
        return this.parseZip(file, name);
      } else if (ext === 'docx' || ext === 'doc') {
        return this.parseDocx(file, name, result);
      } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        return this.parseExcel(file, name, result);
      } else if (ext === 'pptx' || ext === 'ppt') {
        return this.parsePptx(file, name, result);
      } else if (ext === 'pdf') {
        return this.parsePdf(file, name, result);
      } else {
        // Plain text / markdown / fallback
        return this.parseText(file, name, result);
      }
    },

    /**
     * Get lowercase extension from filename
     * @param {string} filename
     * @returns {string}
     */
    getExtension: function(filename) {
      if (!filename || filename.indexOf('.') === -1) return '';
      return filename.split('.').pop().toLowerCase();
    },

    /**
     * Parse ZIP Archives recursively
     * @param {Blob|ArrayBuffer} file
     * @param {string} fileName
     * @returns {Promise<Object>}
     */
    parseZip: function(file, fileName) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!window.JSZip) {
          return reject(new Error('JSZip library is not loaded.'));
        }

        var jszip = new window.JSZip();
        jszip.loadAsync(file).then(function(zip) {
          var filePromises = [];
          var childResults = [];

          zip.forEach(function(relativePath, zipEntry) {
            // Ignore directories and hidden/system files (e.g. __MACOSX)
            if (zipEntry.dir || relativePath.startsWith('__MACOSX/') || relativePath.startsWith('.')) {
              return;
            }

            var promise = zipEntry.async('arraybuffer').then(function(buffer) {
              var childName = zipEntry.name.split('/').pop();
              if (!childName) return;

              // Store extracted sub-file in BlobManager
              var blobItem = window.BlobManager ? window.BlobManager.add(buffer, childName, null, true) : null;

              // Recursively parse child file content
              return self.parseFile(blobItem ? blobItem.blob : buffer, childName).then(function(parsedChild) {
                if (blobItem) {
                  parsedChild.blobId = blobItem.id;
                  parsedChild.blobUrl = blobItem.url;
                }
                childResults.push(parsedChild);
              }).catch(function(err) {
                console.warn('Failed parsing zipped file:', childName, err);
              });
            });

            filePromises.push(promise);
          });

          Promise.all(filePromises).then(function() {
            var combinedText = childResults.map(function(c) { return c.rawText || ''; }).join('\n');
            var stats = window.TextHighlighter ? window.TextHighlighter.getAnalysisStats(combinedText) : {};

            resolve({
              name: fileName,
              size: file.size || 0,
              ext: 'zip',
              rawText: combinedText,
              htmlContent: '<div class="archive-summary"><strong>ZIP Archive Extracted:</strong> ' + childResults.length + ' file(s) processed.</div>',
              stats: stats,
              isArchive: true,
              children: childResults
            });
          }).catch(reject);
        }).catch(function(err) {
          reject(new Error('Failed to read ZIP file: ' + err.message));
        });
      });
    },

    /**
     * Parse Word Documents (.docx, .doc) via Mammoth
     */
    parseDocx: function(file, fileName, result) {
      return new Promise(function(resolve) {
        if (!window.mammoth) {
          result.htmlContent = '<p class="error">Mammoth library not loaded.</p>';
          return resolve(result);
        }

        var reader = new FileReader();
        reader.onload = function(e) {
          var arrayBuffer = e.target.result;

          window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
            .then(function(mammothResult) {
              var html = mammothResult.value;
              var tmpDiv = document.createElement('div');
              tmpDiv.innerHTML = html;
              result.rawText = tmpDiv.textContent || tmpDiv.innerText || '';

              result.stats = window.TextHighlighter ? window.TextHighlighter.getAnalysisStats(result.rawText) : {};
              result.htmlContent = window.TextHighlighter ? window.TextHighlighter.highlightHtml(html) : html;
              resolve(result);
            })
            .catch(function(err) {
              console.warn('Mammoth error, falling back to text:', err);
              // Fallback to text parsing
              FileParser.parseText(file, fileName, result).then(resolve);
            });
        };
        reader.onerror = function() {
          FileParser.parseText(file, fileName, result).then(resolve);
        };
        reader.readAsArrayBuffer(file);
      });
    },

    /**
     * Parse Excel / CSV Spreadsheets (.xlsx, .xls, .csv) via SheetJS
     */
    parseExcel: function(file, fileName, result) {
      return new Promise(function(resolve) {
        if (!window.XLSX) {
          result.htmlContent = '<p class="error">XLSX library not loaded.</p>';
          return resolve(result);
        }

        var reader = new FileReader();
        reader.onload = function(e) {
          try {
            var data = new Uint8Array(e.target.result);
            var workbook = window.XLSX.read(data, { type: 'array' });

            var fullText = '';
            var tablesHtml = '';

            workbook.SheetNames.forEach(function(sheetName) {
              var worksheet = workbook.Sheets[sheetName];

              // Convert sheet to raw text
              var sheetText = window.XLSX.utils.sheet_to_txt(worksheet);
              fullText += '\n--- Sheet: ' + sheetName + ' ---\n' + sheetText;

              // Convert sheet to HTML table
              var sheetHtml = window.XLSX.utils.sheet_to_html(worksheet, { id: 'sheet_' + sheetName, header: '', footer: '' });

              // Enhance table with Material class
              sheetHtml = sheetHtml.replace('<table', '<table class="excel-table"');

              tablesHtml += '<h3>Sheet: ' + window.TextHighlighter.escapeHtml(sheetName) + '</h3>';
              tablesHtml += '<div class="table-responsive">' + sheetHtml + '</div>';
            });

            result.rawText = fullText;
            result.stats = window.TextHighlighter ? window.TextHighlighter.getAnalysisStats(fullText) : {};
            result.htmlContent = window.TextHighlighter ? window.TextHighlighter.highlightHtml(tablesHtml) : tablesHtml;
            resolve(result);
          } catch (err) {
            console.error('XLSX parsing error:', err);
            result.htmlContent = '<p class="error">Failed to parse spreadsheet format.</p>';
            resolve(result);
          }
        };
        reader.onerror = function() {
          result.htmlContent = '<p class="error">Error reading spreadsheet file.</p>';
          resolve(result);
        };
        reader.readAsArrayBuffer(file);
      });
    },

    /**
     * Parse PowerPoint Presentations (.pptx) via Zip XML extraction
     */
    parsePptx: function(file, fileName, result) {
      return new Promise(function(resolve) {
        if (!window.JSZip) {
          result.htmlContent = '<p class="error">JSZip library required for PPTX parsing.</p>';
          return resolve(result);
        }

        var jszip = new window.JSZip();
        jszip.loadAsync(file).then(function(zip) {
          var slideFiles = [];
          var noteFiles = [];

          // Find slide and notes XML files
          zip.forEach(function(relativePath) {
            if (relativePath.match(/^ppt\/slides\/slide\d+\.xml$/i)) {
              slideFiles.push(relativePath);
            } else if (relativePath.match(/^ppt\/notesSlides\/notesSlide\d+\.xml$/i)) {
              noteFiles.push(relativePath);
            }
          });

          // Sort numeric slide order e.g. slide1, slide2, slide10
          slideFiles.sort(function(a, b) {
            var numA = parseInt(a.replace(/[^\d]/g, ''), 10);
            var numB = parseInt(b.replace(/[^\d]/g, ''), 10);
            return numA - numB;
          });

          var promises = slideFiles.map(function(slidePath, idx) {
            var slideNum = idx + 1;
            return zip.file(slidePath).async('text').then(function(xmlText) {
              var parser = new DOMParser();
              var xmlDoc = parser.parseFromString(xmlText, 'text/xml');
              // Extract all <a:t> text nodes
              var textNodes = xmlDoc.getElementsByTagName('a:t');
              var slideTexts = [];
              for (var i = 0; i < textNodes.length; i++) {
                if (textNodes[i].textContent) {
                  slideTexts.push(textNodes[i].textContent);
                }
              }

              // Check for corresponding speaker notes
              var notePath = 'ppt/notesSlides/notesSlide' + slideNum + '.xml';
              var noteFile = zip.file(notePath);
              var notePromise = noteFile ? noteFile.async('text') : Promise.resolve(null);

              return notePromise.then(function(noteXml) {
                var notesText = '';
                if (noteXml) {
                  var noteDoc = parser.parseFromString(noteXml, 'text/xml');
                  var noteNodes = noteDoc.getElementsByTagName('a:t');
                  var noteArr = [];
                  for (var j = 0; j < noteNodes.length; j++) {
                    if (noteNodes[j].textContent) {
                      noteArr.push(noteNodes[j].textContent);
                    }
                  }
                  notesText = noteArr.join(' ');
                }

                return {
                  slideNum: slideNum,
                  bodyText: slideTexts.join(' '),
                  speakerNotes: notesText
                };
              });
            });
          });

          Promise.all(promises).then(function(slides) {
            var fullText = '';
            var slidesHtml = '';

            slides.forEach(function(slide) {
              fullText += '\n--- Slide ' + slide.slideNum + ' ---\n' + slide.bodyText;
              if (slide.speakerNotes) {
                fullText += '\nSpeaker Notes: ' + slide.speakerNotes;
              }

              slidesHtml += '<div class="pptx-slide">';
              slidesHtml += '<h4>Slide ' + slide.slideNum + '</h4>';
              slidesHtml += '<p>' + (window.TextHighlighter.escapeHtml(slide.bodyText) || '<em>[No Text]</em>') + '</p>';
              if (slide.speakerNotes) {
                slidesHtml += '<div class="pptx-speaker-notes"><strong>Notes:</strong> ' + window.TextHighlighter.escapeHtml(slide.speakerNotes) + '</div>';
              }
              slidesHtml += '</div>';
            });

            result.rawText = fullText;
            result.stats = window.TextHighlighter ? window.TextHighlighter.getAnalysisStats(fullText) : {};
            result.htmlContent = window.TextHighlighter ? window.TextHighlighter.highlightHtml(slidesHtml) : slidesHtml;
            resolve(result);
          }).catch(function(err) {
            console.error('PPTX extraction error:', err);
            result.htmlContent = '<p class="error">Failed extracting PowerPoint slide contents.</p>';
            resolve(result);
          });
        }).catch(function(err) {
          console.error('PPTX ZIP load error:', err);
          result.htmlContent = '<p class="error">Invalid PPTX archive.</p>';
          resolve(result);
        });
      });
    },

    /**
     * Parse PDF Documents via pdf.js
     */
    parsePdf: function(file, fileName, result) {
      return new Promise(function(resolve) {
        if (!window.pdfjsLib) {
          result.htmlContent = '<p class="error">PDF.js library is not loaded.</p>';
          return resolve(result);
        }

        // Configure PDF.js worker path
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/vendor/pdf.worker.min.js';

        var reader = new FileReader();
        reader.onload = function(e) {
          var typedarray = new Uint8Array(e.target.result);

          window.pdfjsLib.getDocument({ data: typedarray }).promise.then(function(pdf) {
            var numPages = pdf.numPages;
            var pagePromises = [];

            for (var p = 1; p <= numPages; p++) {
              pagePromises.push(
                pdf.getPage(p).then(function(page) {
                  return page.getTextContent().then(function(textContent) {
                    var pageString = textContent.items.map(function(item) {
                      return item.str;
                    }).join(' ');
                    return { pageNum: page.pageNumber, text: pageString };
                  });
                })
              );
            }

            Promise.all(pagePromises).then(function(pages) {
              // Sort pages by number
              pages.sort(function(a, b) { return a.pageNum - b.pageNum; });

              var fullText = '';
              var pdfHtml = '';

              pages.forEach(function(page) {
                fullText += '\n--- Page ' + page.pageNum + ' ---\n' + page.text;
                pdfHtml += '<div class="pdf-page-block">';
                pdfHtml += '<h4>Page ' + page.pageNum + '</h4>';
                pdfHtml += '<p>' + window.TextHighlighter.escapeHtml(page.text) + '</p>';
                pdfHtml += '</div>';
              });

              result.rawText = fullText;
              result.stats = window.TextHighlighter ? window.TextHighlighter.getAnalysisStats(fullText) : {};
              result.htmlContent = window.TextHighlighter ? window.TextHighlighter.highlightHtml(pdfHtml) : pdfHtml;
              resolve(result);
            }).catch(function(err) {
              console.error('PDF page extraction error:', err);
              result.htmlContent = '<p class="error">Failed extracting text from PDF pages.</p>';
              resolve(result);
            });
          }).catch(function(err) {
            console.error('PDF document load error:', err);
            result.htmlContent = '<p class="error">Failed to load PDF document.</p>';
            resolve(result);
          });
        };
        reader.onerror = function() {
          result.htmlContent = '<p class="error">Error reading PDF file.</p>';
          resolve(result);
        };
        reader.readAsArrayBuffer(file);
      });
    },

    /**
     * Parse Plain Text / Markdown Files (.txt, .md, .json, .log)
     */
    parseText: function(file, fileName, result) {
      return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var text = e.target.result || '';
          result.rawText = text;
          result.stats = window.TextHighlighter ? window.TextHighlighter.getAnalysisStats(text) : {};
          result.htmlContent = window.TextHighlighter ? window.TextHighlighter.highlightText(text) : text;
          resolve(result);
        };
        reader.onerror = function() {
          result.htmlContent = '<p class="error">Failed reading text file.</p>';
          resolve(result);
        };
        reader.readAsText(file);
      });
    }
  };

  // Expose on global window object
  window.FileParser = FileParser;
})(window);
