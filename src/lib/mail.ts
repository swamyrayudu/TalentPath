import nodemailer from 'nodemailer';

// Lazy initialize transporter to prevent error on server startup if environment variables are not loaded yet
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  // Use Google OAuth2 if credentials and a refresh token are provided
  if (user && clientId && clientSecret && refreshToken && !refreshToken.includes('your-refresh-token')) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
      },
    });
    return transporter;
  }

  // Fallback to standard SMTP
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const pass = process.env.SMTP_PASS;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
}

/**
 * Sends a premium HTML welcome email to the newly registered user.
 * Falls back to console logging if SMTP is not configured.
 */
export async function sendWelcomeEmail(to: string, name: string) {
  const from = process.env.SMTP_FROM || '"TalentPath" <noreply@talentpath.com>';
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const displayName = name && !/khub\s*team/i.test(name) ? `, ${name}` : '';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TalentPath</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            color: #334155;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #f1f5f9;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
            padding: 48px 24px;
            text-align: center;
          }
          .logo {
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.05em;
            text-decoration: none;
          }
          .content {
            padding: 40px 32px;
          }
          h1 {
            font-size: 26px;
            color: #0f172a;
            margin-top: 0;
            margin-bottom: 16px;
            font-weight: 700;
            letter-spacing: -0.02em;
          }
          p {
            font-size: 16px;
            line-height: 1.7;
            color: #475569;
            margin-bottom: 24px;
          }
          .features {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid #f1f5f9;
          }
          .feature-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .feature-item:last-child {
            margin-bottom: 0;
          }
          .feature-icon {
            font-size: 24px;
            margin-right: 16px;
            margin-top: 2px;
          }
          .feature-text h3 {
            margin: 0;
            font-size: 16px;
            color: #1e293b;
            font-weight: 600;
          }
          .feature-text p {
            margin: 4px 0 0 0;
            font-size: 14px;
            color: #64748b;
            line-height: 1.5;
          }
          .cta-container {
            text-align: center;
            margin: 36px 0;
          }
          .cta-button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 36px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
            transition: all 0.2s ease;
          }
          .footer {
            background-color: #f8fafc;
            padding: 28px 24px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            font-size: 13px;
            color: #94a3b8;
          }
          .footer a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <a href="${dashboardUrl}" class="logo">TalentPath</a>
          </div>
          <div class="content">
            <h1>Welcome to TalentPath${displayName}! 🚀</h1>
            <p>We are excited to join you on your learning journey. TalentPath is designed to give you structured, high-quality resources to master algorithms, ace tech interviews, and build strong career foundations.</p>
            
            <div class="features">
              <div class="feature-item">
                <span class="feature-icon">🔍</span>
                <div class="feature-text">
                  <h3>Master DSA Patterns</h3>
                  <p>Study questions categorized by core algorithmic patterns to make complex problems highly intuitive.</p>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">💻</span>
                <div class="feature-text">
                  <h3>AI Mock Interviews</h3>
                  <p>Sharpen your coding and system design skills with realistic, interactive interviews.</p>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🧠</span>
                <div class="feature-text">
                  <h3>Interactive Aptitude Tests</h3>
                  <p>Boost your quantitative and verbal skills with adaptive quizzes and thorough step-by-step explanations.</p>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📈</span>
                <div class="feature-text">
                  <h3>Curated Roadmaps</h3>
                  <p>Progress along targeted learning paths tailored for modern web development, engineering practices, and more.</p>
                </div>
              </div>
            </div>

            <div class="cta-container">
              <a href="${dashboardUrl}" class="cta-button">Explore Your Dashboard</a>
            </div>
            
            <p>If you have questions, feedback, or need guidance, feel free to contact us by responding directly to this email.</p>
            <p>Best regards,<br><strong>The TalentPath Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TalentPath. All rights reserved.</p>
            <p>Start learning today on <a href="${dashboardUrl}">TalentPath</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Fallback to console logs if credentials aren't set
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  const hasSmtp = smtpUser && smtpPass && !smtpUser.includes('your-smtp-username') && !smtpPass.includes('your-smtp-app-password');
  const hasOAuth2 = smtpUser && googleClientId && googleClientSecret && googleRefreshToken && !googleRefreshToken.includes('your-refresh-token');

  if (!hasSmtp && !hasOAuth2) {
    return { messageId: 'simulated-message-id' };
  }

  const client = getTransporter();
  const info = await client.sendMail({
    from,
    to,
    subject: 'Welcome to TalentPath! 🚀',
    html: htmlContent,
  });
  return info;
}
