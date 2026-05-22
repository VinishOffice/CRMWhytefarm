
  
class WhatsAppMarkdownConverter {
    static convert(html) {
        const conversionRules = [
            { regex: /<(strong|b)>(.*?)<\/\1>/gi, replace: '*$2*' },
            { regex: /<(em|i)>(.*?)<\/\1>/gi, replace: '_$2_' },
            { regex: /<u>(.*?)<\/u>/gi, replace: '_$1_' },
            { regex: /<a\s+href="(.*?)">(.*?)<\/a>/gi, replace: '[$2]($1)' },
            { regex: /<h1>(.*?)<\/h1>/gi, replace: '*$1*' },
            { regex: /<h2>(.*?)<\/h2>/gi, replace: '_$1_' },
            { regex: /<blockquote>(.*?)<\/blockquote>/gi, replace: '> $1' },
            { 
                regex: /<ul>(.*?)<\/ul>/gis, 
                replace: (match, content) => 
                    content.trim()
                        .split(/<li>/gi)
                        .filter(item => item.trim())
                        .map(item => `• ${item.replace(/<\/li>/gi, '').trim()}`)
                        .join('\n')
            },
            { regex: /<code>(.*?)<\/code>/gi, replace: '```$1```' }
        ];

        let markdown = html;
        conversionRules.forEach(rule => {
            markdown = markdown.replace(rule.regex, rule.replace);
        });

        // Handle whitespace and new lines
        markdown = this.handleWhitespaceAndNewLines(markdown);

        return markdown
            .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
    }

    static handleWhitespaceAndNewLines(text) {
        // Replace &nbsp; with a space
        text = text.replace(/&nbsp;/g, ' ');

        // Replace multiple spaces with a single space
        text = text.replace(/\s{2,}/g, ' ');

        // Convert new lines to double new lines for paragraph breaks
        // text = text.replace(/\n/g, '\n\n');
        text = text.replace(/\n/g, '\n');

        return text;
    }
}


class HtmlConverter {
    static convert(html) {
      const conversionRules = [
        { regex: /<(strong|b)>(.*?)<\/\1>/gi, replace: '<b>$2</b>' },
        { regex: /<(em|i)>(.*?)<\/\1>/gi, replace: '<i>$2</i>' },
        { regex: /<u>(.*?)<\/u>/gi, replace: '<u>$1</u>' },
        { 
          regex: /<a\s+href="(.*?)">(.*?)<\/a>/gi, 
          replace: '<a href="$1" style="color:#1da1f2;text-decoration:none;">$2</a>' 
        },
        { regex: /<h1>(.*?)<\/h1>/gi, replace: '<h1 style="color:#000;font-size:22px;">$1</h1>' },
        { regex: /<h2>(.*?)<\/h2>/gi, replace: '<h2 style="color:#333;font-size:18px;">$1</h2>' },
        { 
          regex: /<ul>(.*?)<\/ul>/gis, 
          replace: (match, content) => 
            `<ul style="padding-left:20px;">` + 
            content.trim()
              .split(/<li>/gi)
              .filter(item => item.trim())
              .map(item => `<li>${item.replace(/<\/li>/gi, '').trim()}</li>`)
              .join('') + 
            `</ul>`
        },
        { regex: /<code>(.*?)<\/code>/gi, replace: '<code style="background-color:#f4f4f4;padding:2px 4px;">$1</code>' }
      ];
  
      let htmlEmail = html;
      conversionRules.forEach(rule => {
        htmlEmail = htmlEmail.replace(rule.regex, rule.replace);
      });
  
      // Preserve whitespace and new lines
      return this.preserveFormatting(htmlEmail);
    }

    static preserveFormatting(html) {
      return html
        .replace(/\n/g, '<br>')  // Convert newlines to <br> tags
        .replace(/\s{2,}/g, (match) => {
          // Replace multiple spaces with non-breaking spaces
          return '&nbsp;'.repeat(match.length);
        })
        .replace(/<br>\s*<br>/g, '<br><br>');  // Preserve paragraph breaks
    }

    static cleanAndSanitize(html) {
      return html
        .replace(/<script.*?>.*?<\/script>/gi, '')  // Remove script tags
        .replace(/on\w+=".*?"/gi, '')  // Remove event handlers
        .replace(/<style.*?>.*?<\/style>/gi, '');  // Remove style tags
    }

    // Additional method to handle mixed content
    static convertWithSanitization(html) {
      const sanitizedHtml = this.cleanAndSanitize(html);
      return this.convert(sanitizedHtml);
    }
}

  class EmailMarkdownConverter {
    static convert(html) {
      const conversionRules = [
        { regex: /<(strong|b)>(.*?)<\/\1>/gi, replace: '<b>$2</b>' },
        { regex: /<(em|i)>(.*?)<\/\1>/gi, replace: '<i>$2</i>' },
        { regex: /<u>(.*?)<\/u>/gi, replace: '<u>$1</u>' },
        { 
          regex: /<a\s+href="(.*?)">(.*?)<\/a>/gi, 
          replace: '<a href="$1" style="color:#1da1f2;text-decoration:none;">$2</a>' 
        },
        { regex: /<h1>(.*?)<\/h1>/gi, replace: '<h1 style="color:#000;font-size:22px;">$1</h1>' },
        { regex: /<h2>(.*?)<\/h2>/gi, replace: '<h2 style="color:#333;font-size:18px;">$1</h2>' },
        { 
          regex: /<ul>(.*?)<\/ul>/gis, 
          replace: (match, content) => 
            `<ul style="padding-left:20px;">` + 
            content.trim()
              .split(/<li>/gi)
              .filter(item => item.trim())
              .map(item => `<li>${item.replace(/<\/li>/gi, '').trim()}</li>`)
              .join('') + 
            `</ul>`
        },
        { regex: /<code>(.*?)<\/code>/gi, replace: '<code style="background-color:#f4f4f4;padding:2px 4px;">$1</code>' }
      ];
  
      let htmlEmail = html;
      conversionRules.forEach(rule => {
        htmlEmail = htmlEmail.replace(rule.regex, rule.replace);
      });
  
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              a { text-decoration: none; color: #1da1f2; }
            </style>
          </head>
          <body>
            ${htmlEmail}
          </body>
        </html>
      `;
    }
  }
  
  class MessageFormatter {
    static whatsApp(text, options = {}) {
      const {
        bold = false,
        italic = false,
        underline = false,
        link = null
      } = options;
  
      if (link) {
        return `[${text}](${link})`;
      }
  
      if (bold) return `*${text}*`;
      if (italic) return `_${text}_`;
      if (underline) return `_${text}_`;
  
      return text;
    }
  
    static email(text, options = {}) {
      const {
        bold = false,
        italic = false,
        underline = false,
        link = null,
        color = '#000000'
      } = options;
  
      if (link) {
        return `<a href="${link}" style="color:${color};text-decoration:none;">${text}</a>`;
      }
  
      let styledText = text;
      if (bold) styledText = `<b>${styledText}</b>`;
      if (italic) styledText = `<i>${styledText}</i>`;
      if (underline) styledText = `<u>${styledText}</u>`;
  
      return styledText;
    }
  }
  
  class Communicator {
    static prepareWhatsAppMessage(content) {
      return WhatsAppMarkdownConverter.convert(content);
    }
  
    static prepareEmailContent(content) {
      return EmailMarkdownConverter.convert(content);
    }

    static prepareHtmlContent(content) {
      return HtmlConverter.convert(content);
    }
  
    static formatWhatsAppText(text, options) {
      return MessageFormatter.whatsApp(text, options);
    }
  
    static formatEmailText(text, options) {
      return MessageFormatter.email(text, options);
    }
  }
  
  
  module.exports = {
    WhatsAppMarkdownConverter,
    EmailMarkdownConverter,
    MessageFormatter,
    Communicator
  };