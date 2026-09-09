import { BrevoClient } from '@getbrevo/brevo';
import puppeteer from 'puppeteer';
import { IOrder } from '@/app/admin/models/Order';
import { InvoiceTrigger } from '@/redux/types/mailer';
import { buildInvoiceHtml, buildInvoiceSubject } from './invoiceTemplate';

const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'no-reply@supermaxpanel.com';
const senderName = process.env.BREVO_SENDER_NAME ?? 'SuperMax Panel';

/** Renders the invoice HTML to a PDF buffer using headless Chrome */
const generateInvoicePdf = async (html: string): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};

/**
 * Sends an invoice email with a PDF attachment to the customer via Brevo.
 *
 * @param trigger    - what caused this email (order_placed | status_update | payment_added)
 * @param order      - the full order document
 * @param changeNote - optional human-readable description of what changed
 */
const sendInvoiceEmail = async (
  trigger: InvoiceTrigger,
  order: IOrder & { _id: string },
  changeNote?: string
): Promise<void> => {
  if (!order.customerEmail) {
    console.warn('[mailer] skipping invoice — no customer email on order', order._id);
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey === 'your_brevo_api_key_here') {
    console.warn('[mailer] BREVO_API_KEY not configured — skipping invoice email');
    return;
  }

  const client = new BrevoClient({ apiKey });
  const htmlContent = buildInvoiceHtml({ trigger, order, changeNote });
  const subject = buildInvoiceSubject(trigger, String(order._id));
  const shortId = String(order._id).slice(-8).toUpperCase();

  // Generate PDF attachment
  let attachments: { name: string; content: string }[] = [];
  try {
    const pdfBuffer = await generateInvoicePdf(htmlContent);
    attachments = [
      {
        name: `Invoice-${shortId}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ];
    console.log(`[mailer] PDF generated for order ${shortId}`);
  } catch (pdfErr) {
    // PDF generation failure is non-fatal — email still sends without attachment
    console.error('[mailer] PDF generation failed, sending without attachment:', pdfErr);
  }

  try {
    await client.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent,
      sender: { name: senderName, email: senderEmail },
      to: [{ email: order.customerEmail, name: order.customerName }],
      ...(attachments.length > 0 && { attachment: attachments }),
    });
    console.log(`[mailer] Invoice sent (${trigger}) to ${order.customerEmail} ${attachments.length > 0 ? 'with PDF' : 'without PDF'}`);
  } catch (err) {
    // Never throw — email failure must not break the main flow
    console.error('[mailer] Failed to send invoice email:', err);
  }
};

export { sendInvoiceEmail };
