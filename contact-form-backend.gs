/**
 * Google Apps Script - Contact Form Backend
 * Portfolio Website: unfunky.xyz
 * 
 * SETUP INSTRUCTIONS:
 * ==================
 * 1. Go to https://script.google.com
 * 2. Create a new project (name it "Portfolio Contact Form")
 * 3. Copy this entire file into the Code.gs editor
 * 4. Update the CONFIG object below with your details
 * 5. Click Deploy > New deployment
 * 6. Select "Web app" as the type
 * 7. Set "Execute as" to "Me"
 * 8. Set "Who has access" to "Anyone"
 * 9. Click Deploy and copy the Web App URL
 * 10. Paste that URL into your index.html CONTACT_FORM_CONFIG.appsScriptUrl
 * 
 * OPTIONAL: Create a Google Sheet for logging
 * 1. Create a new Google Sheet
 * 2. Add headers: Timestamp | Name | Email | Message | Status | Source
 * 3. Copy the Sheet ID from the URL (the long string between /d/ and /edit)
 * 4. Paste it in CONFIG.sheetId below
 */

// =============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// =============================================================================
const CONFIG = {
  // Your email address to receive contact form submissions
  recipientEmail: 'alweiner.tech@gmail.com',
  
  // Your name for the auto-reply email
  yourName: 'Al Weiner',
  
  // Google Sheet ID for logging submissions (optional - set to null to disable)
  // Find this in your sheet URL: https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
  sheetId: null,
  
  // Whether to send an auto-reply to the person who contacted you
  sendAutoReply: true,
  
  // Your website URL
  websiteUrl: 'https://unfunky.xyz',
  
  // Your LinkedIn URL (for auto-reply)
  linkedInUrl: 'https://www.linkedin.com/in/al-weiner-29865529a/',
  
  // Your GitHub URL (for auto-reply)
  githubUrl: 'https://github.com/ajgreenboy'
};

// =============================================================================
// MAIN HANDLER - DO NOT MODIFY BELOW THIS LINE
// =============================================================================

/**
 * Handles POST requests from the contact form
 */
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return createResponse(false, 'Missing required fields');
    }
    
    // Validate email format
    if (!isValidEmail(data.email)) {
      return createResponse(false, 'Invalid email format');
    }
    
    // Sanitize inputs
    const sanitizedData = {
      name: sanitize(data.name),
      email: sanitize(data.email),
      message: sanitize(data.message),
      timestamp: data.timestamp || new Date().toISOString(),
      source: data.source || 'unknown'
    };
    
    // Log to Google Sheet (if configured)
    if (CONFIG.sheetId) {
      logToSheet(sanitizedData);
    }
    
    // Send notification email to you
    sendNotificationEmail(sanitizedData);
    
    // Send auto-reply to the person (if enabled)
    if (CONFIG.sendAutoReply) {
      sendAutoReply(sanitizedData);
    }
    
    // Return success response
    return createResponse(true, 'Message sent successfully');
    
  } catch (error) {
    console.error('Error processing form submission:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Handles GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Contact form API is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a JSON response
 */
function createResponse(success, message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Validates email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitizes input to prevent XSS
 */
function sanitize(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .substring(0, 5000); // Limit length
}

/**
 * Logs submission to Google Sheet
 */
function logToSheet(data) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.sheetId).getActiveSheet();
    
    // Add row with submission data
    sheet.appendRow([
      new Date(data.timestamp),  // Timestamp
      data.name,                  // Name
      data.email,                 // Email
      data.message,               // Message
      'Unread',                   // Status
      data.source                 // Source
    ]);
    
  } catch (error) {
    console.error('Error logging to sheet:', error);
    // Don't throw - we still want to send emails even if logging fails
  }
}

/**
 * Sends notification email to you
 */
function sendNotificationEmail(data) {
  const subject = `🔔 Portfolio Contact: ${data.name}`;
  
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #007aff, #5856d6); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057; width: 100px;">Name</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; color: #212529;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057;">Email</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #dee2e6;">
              <a href="mailto:${data.email}" style="color: #007aff; text-decoration: none;">${data.email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #495057; vertical-align: top;">Message</td>
            <td style="padding: 12px 0; color: #212529; white-space: pre-wrap;">${data.message}</td>
          </tr>
        </table>
      </div>
      
      <div style="background: #fff; padding: 16px 24px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #6c757d;">
          Received: ${new Date(data.timestamp).toLocaleString()}<br>
          Source: ${data.source}
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 24px;">
        <a href="mailto:${data.email}?subject=Re: Your message from unfunky.xyz" 
           style="display: inline-block; padding: 12px 24px; background: #007aff; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Reply to ${data.name}
        </a>
      </div>
    </div>
  `;
  
  const plainBody = `
New Contact Form Submission
============================

Name: ${data.name}
Email: ${data.email}

Message:
${data.message}

---
Received: ${new Date(data.timestamp).toLocaleString()}
Source: ${data.source}
  `.trim();
  
  MailApp.sendEmail({
    to: CONFIG.recipientEmail,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    replyTo: data.email
  });
}

/**
 * Sends auto-reply to the person who contacted you
 */
function sendAutoReply(data) {
  const subject = `Thanks for reaching out, ${data.name.split(' ')[0]}!`;
  
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #34c759, #30d158); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Message Received! ✓</h1>
      </div>
      
      <div style="background: #fff; padding: 24px; border: 1px solid #e9ecef; border-top: none;">
        <p style="font-size: 16px; color: #212529; line-height: 1.6;">
          Hi ${data.name.split(' ')[0]},
        </p>
        
        <p style="font-size: 16px; color: #212529; line-height: 1.6;">
          Thanks for your message! I've received it and will get back to you within 24 hours.
        </p>
        
        <p style="font-size: 16px; color: #212529; line-height: 1.6;">
          In the meantime, feel free to:
        </p>
        
        <ul style="font-size: 16px; color: #212529; line-height: 1.8;">
          <li><a href="${CONFIG.websiteUrl}#homelab" style="color: #007aff;">Explore my homelab infrastructure</a></li>
          <li><a href="${CONFIG.githubUrl}" style="color: #007aff;">Check out my GitHub projects</a></li>
          <li><a href="${CONFIG.linkedInUrl}" style="color: #007aff;">Connect with me on LinkedIn</a></li>
        </ul>
        
        <p style="font-size: 16px; color: #212529; line-height: 1.6;">
          Best regards,<br>
          <strong>${CONFIG.yourName}</strong>
        </p>
      </div>
      
      <div style="background: #f8f9fa; padding: 16px 24px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 12px; color: #6c757d;">
          This is an automated response from <a href="${CONFIG.websiteUrl}" style="color: #007aff;">${CONFIG.websiteUrl}</a>
        </p>
      </div>
    </div>
  `;
  
  const plainBody = `
Hi ${data.name.split(' ')[0]},

Thanks for your message! I've received it and will get back to you within 24 hours.

In the meantime, feel free to:
- Explore my homelab infrastructure: ${CONFIG.websiteUrl}#homelab
- Check out my GitHub projects: ${CONFIG.githubUrl}
- Connect with me on LinkedIn: ${CONFIG.linkedInUrl}

Best regards,
${CONFIG.yourName}

---
This is an automated response from ${CONFIG.websiteUrl}
  `.trim();
  
  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: CONFIG.yourName
  });
}

// =============================================================================
// TEST FUNCTION - Run this to test your setup
// =============================================================================

/**
 * Test the email functionality (run this manually from the Apps Script editor)
 */
function testEmailSend() {
  const testData = {
    name: 'Test User',
    email: CONFIG.recipientEmail, // Sends to yourself for testing
    message: 'This is a test message from the contact form setup.',
    timestamp: new Date().toISOString(),
    source: 'test'
  };
  
  try {
    sendNotificationEmail(testData);
    console.log('✅ Notification email sent successfully!');
    
    if (CONFIG.sendAutoReply) {
      sendAutoReply(testData);
      console.log('✅ Auto-reply email sent successfully!');
    }
    
    if (CONFIG.sheetId) {
      logToSheet(testData);
      console.log('✅ Logged to Google Sheet successfully!');
    }
    
    console.log('\n🎉 All tests passed! Your contact form backend is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
