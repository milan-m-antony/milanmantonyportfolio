import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from "npm:nodemailer@6.9.13"; // Using npm specifier for nodemailer

// --- CONFIGURATION (Update these with your actual details) ---
const YOUR_FULL_NAME = "Milan M Antony";
const YOUR_PORTFOLIO_URL = "https://studio-one-hazel.vercel.app"; // Your live portfolio URL
const YOUR_REPLY_EMAIL_ADDRESS = Deno.env.get('SMTP_USERNAME'); // Fetched from secrets

// Replace with your actual social media profile URLs
const YOUR_LINKEDIN_URL = "https://www.linkedin.com/in/milanmantony?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app";
const YOUR_GITHUB_URL = "https://github.com/milan-m-antony";
const YOUR_INSTAGRAM_URL = "https://www.instagram.com/milan_m_antony?igsh=MWs0MHJlZnJwNHU3Zw==";
const YOUR_TWITTER_URL = ""; // Optional: Replace with your actual Twitter/X URL or leave empty

async function sendEmailViaGmail(adminGmailAddress, adminGmailAppPassword, to, subject, htmlBody) {
  if (!adminGmailAddress || !adminGmailAppPassword) {
    console.error("SMTP_USERNAME or SMTP_PASSWORD not configured in Edge Function secrets.");
    throw new Error("SMTP configuration error: Credentials missing.");
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: adminGmailAddress,
      pass: adminGmailAppPassword
    }
  });

  const mailOptions = {
    from: `"${YOUR_FULL_NAME}" <${adminGmailAddress}>`,
    to: to,
    subject: subject,
    html: htmlBody,
    replyTo: adminGmailAddress
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to} via Gmail SMTP (Nodemailer). Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email via Gmail SMTP (Nodemailer):", error);
    let errorMessage = `Failed to send email.`;
    if (error.code === 'EAUTH' || error.responseCode === 535 && error.response?.includes('Username and Password not accepted')) {
      errorMessage += " Gmail authentication failed. Please check your SMTP_USERNAME and SMTP_PASSWORD (App Password). Ensure your Gmail account allows access (e.g., using an App Password if 2FA is enabled).";
    } else if (error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

Deno.serve(async (req)=>{
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  // 2. Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: "Method Not Allowed. Only POST requests are accepted."
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const { submissionId, replyText, recipientEmail, recipientName } = await req.json();

    if (!submissionId || !replyText || !recipientEmail || !recipientName) {
      return new Response(JSON.stringify({
        error: "Missing required parameters: submissionId, replyText, recipientEmail, recipientName are required."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 3. Get Supabase & SMTP credentials from secrets
    const smtpUsername = Deno.env.get('SMTP_USERNAME');
    const smtpPassword = Deno.env.get('SMTP_PASSWORD'); // This should be your Gmail App Password
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!smtpUsername || !smtpPassword || !supabaseUrl || !supabaseServiceRoleKey) {
      console.error("One or more required secrets (SMTP_USERNAME, SMTP_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured for the Edge Function.");
      throw new Error("Server configuration error: Required secrets missing.");
    }

    console.log(`Processing reply for submissionId: ${submissionId} to ${recipientEmail} via Gmail SMTP (Nodemailer).`);

    // 4. Construct the styled HTML email body
    const emailSubject = `Re: Your Inquiry - ${YOUR_FULL_NAME}`;
    const emailHtmlBody = `
      <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 16px; line-height: 1.6; color: #000000; background-color: #ffffff; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #cccccc; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          
          <div style="background-color: #000000; color: #ffffff; padding: 25px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: bold;">Reply from ${YOUR_FULL_NAME}</h1>
          </div>

          <div style="padding: 30px 30px 20px 30px; color: #000000;">
            <p style="margin-top: 0; margin-bottom: 20px;">Hi ${recipientName},</p>
            <p style="margin-bottom: 20px;">Thank you for your message regarding my portfolio. Please find my reply below:</p>
            
            <div style="background-color: #f9f9f9; border: 1px solid #eeeeee; border-left: 4px solid #000000; padding: 15px 20px; margin: 25px 0; color: #000000; font-style: italic;">
              ${replyText.replace(/\n/g, '<br>')}
            </div>
            
            <p style="margin-bottom: 25px;">If you have any additional questions, please feel free to ask.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${YOUR_PORTFOLIO_URL}" target="_blank" style="background-color: #000000; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; border: 1px solid #000000; transition: background-color 0.3s, color 0.3s;"
                 onmouseover="this.style.backgroundColor='#333333'; this.style.borderColor='#333333';"
                 onmouseout="this.style.backgroundColor='#000000'; this.style.borderColor='#000000';">Visit My Portfolio</a>
            </div>
            
            <p style="margin-bottom: 0;">Best regards,</p>
            <p style="margin-top: 5px;"><strong>${YOUR_FULL_NAME}</strong></p>
          </div>

          <div style="background-color: #000000; color: #ffffff; padding: 20px 25px; text-align: center; font-size: 13px; border-top: 1px solid #333333;">
            <p style="margin: 0 0 10px 0;">
              Contact: <a href="mailto:${smtpUsername}" style="color: #ffffff; text-decoration: underline;">${smtpUsername}</a>
            </p>
            <p style="margin: 0 0 15px 0;">
              ${YOUR_LINKEDIN_URL ? `<a href="${YOUR_LINKEDIN_URL}" target="_blank" style="color: #ffffff; text-decoration: underline; margin: 0 7px;">LinkedIn</a>` : ''}
              ${YOUR_GITHUB_URL ? `${YOUR_LINKEDIN_URL ? ' | ' : ''}<a href="${YOUR_GITHUB_URL}" target="_blank" style="color: #ffffff; text-decoration: underline; margin: 0 7px;">GitHub</a>` : ''}
              ${YOUR_INSTAGRAM_URL ? `${YOUR_LINKEDIN_URL || YOUR_GITHUB_URL ? ' | ' : ''}<a href="${YOUR_INSTAGRAM_URL}" target="_blank" style="color: #ffffff; text-decoration: underline; margin: 0 7px;">Instagram</a>` : ''}
              ${YOUR_TWITTER_URL ? `${YOUR_LINKEDIN_URL || YOUR_GITHUB_URL || YOUR_INSTAGRAM_URL ? ' | ' : ''}<a href="${YOUR_TWITTER_URL}" target="_blank" style="color: #ffffff; text-decoration: underline; margin: 0 7px;">X/Twitter</a>` : ''}
            </p>
            <p style="font-size: 11px; color: #aaaaaa; margin: 0 0 10px 0;">
              This email was sent in response to an inquiry submitted via the contact form on <a href="${YOUR_PORTFOLIO_URL}" style="color: #ffffff; text-decoration: underline;">My Portfolio</a>.
            </p>
            <p style="font-size: 11px; color: #aaaaaa; margin: 0;">
              &copy; ${new Date().getFullYear()} ${YOUR_FULL_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    // 5. Send the email
    await sendEmailViaGmail(smtpUsername, smtpPassword, recipientEmail, emailSubject, emailHtmlBody);

    // 6. Update the submission status in Supabase database
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { error: updateError } = await supabaseAdmin.from('contact_submissions').update({
      status: 'Replied',
      notes: `(Replied via Gmail SMTP) ${new Date().toISOString()}:\n\n${replyText}`
    }).eq('id', submissionId);

    if (updateError) {
      console.error("Error updating submission status in database:", updateError);
      // Log but don't necessarily fail the entire function if email sent successfully
    }

    return new Response(JSON.stringify({
      message: "Reply sent successfully via Gmail SMTP and submission status updated."
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error("Error in send-contact-reply Edge Function:", error.message, error.stack ? error.stack : '');
    return new Response(JSON.stringify({
      error: error.message || "An unexpected server error occurred."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}); 