/**
 * TextHighlighter - Automated Text Analysis & Passage Highlighting
 * Classic Script Global Namespace Architecture
 */
(function(window) {
  'use strict';

  var TextHighlighter = {
    // Regex Patterns for Critical Passage Detection
    patterns: [
      {
        type: 'action',
        class: 'md-highlight md-highlight-action',
        // Matches TODO, IMPORTANT, ACTION REQUIRED, NOTE, WARNING, CRITICAL, DEADLINE
        regex: /\b(TODO|IMPORTANT|ACTION REQUIRED|NOTE|WARNING|CRITICAL|DEADLINE|URGENT|PLEASE NOTE|ATTENTION)\b[:\-]?/gi
      },
      {
        type: 'money',
        class: 'md-highlight md-highlight-money',
        // Matches currency amounts e.g., $100, $1,234.50, €50, £10.99, USD 500, EUR 200, 100 USD
        regex: /(\$|€|£|¥|USD\s?|EUR\s?|GBP\s?)\s?\d+(?:,\d{3})*(?:\.\d{1,2})?\b|\b\d+(?:,\d{3})*(?:\.\d{1,2})?\s?(USD|EUR|GBP|AUD|CAD)\b/gi
      },
      {
        type: 'date',
        class: 'md-highlight md-highlight-date',
        // Matches dates e.g., 2026-09-08, 09/08/2026, Sept 8, 2026, 8th September 2026
        regex: /\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})\b/gi
      },
      {
        type: 'email',
        class: 'md-highlight md-highlight-email',
        // Matches email addresses
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi
      }
    ],

    /**
     * Escape raw text string for safe HTML insertion
     * @param {string} str
     * @returns {string}
     */
    escapeHtml: function(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Process plain text content, escape HTML, and wrap detected key passages in <mark> tags
     * @param {string} text - Plain text string
     * @returns {string} Safe HTML with highlighted mark elements
     */
    highlightText: function(text) {
      if (!text) return '';
      var escaped = this.escapeHtml(text);

      // Convert line breaks to <br> for plain text rendering
      var html = escaped.replace(/\r\n|\r|\n/g, '<br>');

      return this.highlightHtml(html);
    },

    /**
     * Process an HTML snippet and inject highlights without destroying existing HTML tags
     * @param {string} htmlSnippet - HTML string
     * @returns {string} Enhanced HTML string with highlights
     */
    highlightHtml: function(htmlSnippet) {
      if (!htmlSnippet) return '';

      // Split HTML string by HTML tags to avoid modifying attributes inside <...>
      var tokens = htmlSnippet.split(/(<[^>]+>)/g);

      for (var i = 0; i < tokens.length; i++) {
        // Skip HTML tags (tokens starting with < and ending with >)
        if (tokens[i].startsWith('<') && tokens[i].endsWith('>')) {
          continue;
        }

        // Apply highlighting patterns to text content nodes
        var textNode = tokens[i];
        if (!textNode || !textNode.trim()) continue;

        for (var p = 0; p < this.patterns.length; p++) {
          var pat = this.patterns[p];
          textNode = textNode.replace(pat.regex, function(match) {
            return '<mark class="' + pat.class + '">' + match + '</mark>';
          });
        }
        tokens[i] = textNode;
      }

      return tokens.join('');
    },

    /**
     * Calculate summary count of matches in text/html content
     * @param {string} text
     * @returns {Object} Count by type e.g., { action: 2, money: 1, date: 3, email: 0 }
     */
    getAnalysisStats: function(text) {
      var stats = { action: 0, money: 0, date: 0, email: 0, total: 0 };
      if (!text) return stats;

      // Strip HTML tags for regex matching
      var cleanText = text.replace(/<[^>]+>/g, ' ');

      for (var p = 0; p < this.patterns.length; p++) {
        var pat = this.patterns[p];
        var matches = cleanText.match(pat.regex);
        if (matches) {
          stats[pat.type] = matches.length;
          stats.total += matches.length;
        }
      }

      return stats;
    }
  };

  // Expose on global window object
  window.TextHighlighter = TextHighlighter;
})(window);
