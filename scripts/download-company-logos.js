/**
 * Script to download company logos
 * Run: node scripts/download-company-logos.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Top tech companies
const COMPANIES = [
  'google', 'microsoft', 'amazon', 'apple', 'meta', 'facebook',
  'netflix', 'tesla', 'uber', 'airbnb', 'spotify', 'twitter',
  'linkedin', 'salesforce', 'oracle', 'ibm', 'adobe', 'nvidia',
  'intel', 'cisco', 'paypal', 'ebay', 'dropbox', 'slack',
  'zoom', 'snapchat', 'pinterest', 'reddit', 'tiktok', 'bytedance',
  'alibaba', 'tencent', 'samsung', 'sony', 'dell', 'hp',
  'vmware', 'servicenow', 'atlassian', 'shopify', 'square', 'stripe',
  'coinbase', 'robinhood', 'doordash', 'instacart', 'lyft', 'booking',
  'expedia', 'goldman-sachs', 'jp-morgan', 'morgan-stanley', 'capital-one',
  'american-express', 'visa', 'mastercard', 'bloomberg', 'accenture',
];

// Create data/company-logos directory
const logosDir = path.join(__dirname, '..', 'public', 'company-logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Download logo from Clearbit
function downloadLogo(company) {
  return new Promise((resolve, reject) => {
    const domain = `${company}.com`;
    const url = `https://logo.clearbit.com/${domain}`;
    const outputPath = path.join(logosDir, `${company}.png`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`✓ ${company} (already exists)`);
      return resolve();
    }

    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✓ ${company}`);
          resolve();
        });
      } else {
        console.log(`✗ ${company} (${response.statusCode})`);
        resolve(); // Don't reject, just skip
      }
    }).on('error', (err) => {
      console.log(`✗ ${company} (${err.message})`);
      resolve(); // Don't reject, just skip
    });
  });
}

// Download all logos with rate limiting
async function downloadAllLogos() {
  console.log(`📥 Downloading logos for ${COMPANIES.length} companies...\n`);
  
  for (let i = 0; i < COMPANIES.length; i++) {
    await downloadLogo(COMPANIES[i]);
    // Rate limit: wait 200ms between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n✅ Done! Logos saved to: ${logosDir}`);
}

downloadAllLogos().catch(console.error);
