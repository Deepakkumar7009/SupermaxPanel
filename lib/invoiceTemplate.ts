import { InvoiceTrigger, InvoiceContext } from '@/redux/types/mailer';

const formatDate = (d: Date | string) => {
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const rupee = (n: number) => {
  return `&#8377; ${n.toFixed(2)}`;
};

const buildInvoiceHtml = (ctx: InvoiceContext): string => {
  const { order, trigger, changeNote } = ctx;

  const paidAmount = order.paidAmount ?? 0;
  const advanceAmount = order.advanceAmount ?? 0;
  const dueAmount = Math.max(0, order.totalAmount - paidAmount);

  const subjectBannerMap: Record<InvoiceTrigger, { title: string; color: string }> = {
    order_placed: { title: 'Order Confirmation', color: '#16a34a' },
    status_update: { title: 'Order Status Updated', color: '#2563eb' },
    payment_added: { title: 'Payment Received', color: '#7c3aed' },
  };

  const banner = subjectBannerMap[trigger];

  const itemRows = order.items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:8px 4px;">${item.name}</td>
        <td style="padding:8px 4px;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 4px;text-align:right;">${rupee(item.price)}</td>
        <td style="padding:8px 4px;text-align:right;font-weight:600;">${rupee(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const paymentRows =
    order.payments && order.payments.length > 0
      ? order.payments
          .map(
            (p) => `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:6px 4px;text-transform:capitalize;">${p.type} — ${p.method}</td>
            <td style="padding:6px 4px;">${formatDate(p.date)}</td>
            <td style="padding:6px 4px;text-align:right;color:#16a34a;font-weight:600;">${rupee(p.amount)}</td>
          </tr>`
          )
          .join("")
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Invoice #${order._id}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#1f2328;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- Header Banner -->
      <tr><td style="background:${banner.color};padding:24px 32px;">
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${banner.title}</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
          Order #${String(order._id).slice(-8).toUpperCase()} &nbsp;|&nbsp; ${formatDate(order.createdAt)}
        </p>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:28px 32px;">

        ${changeNote ? `<div style="background:#f0f9ff;border-left:4px solid ${banner.color};padding:12px 16px;border-radius:6px;margin-bottom:20px;font-size:13px;color:#374151;">${changeNote}</div>` : ""}

        <!-- Customer Info -->
        <h3 style="margin:0 0 10px;font-size:15px;color:#374151;">Customer Details</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#57606a;margin-bottom:24px;">
          <tr>
            <td style="padding:3px 0;width:50%;"><strong>Name:</strong> ${order.customerName}</td>
            <td style="padding:3px 0;"><strong>Email:</strong> ${order.customerEmail}</td>
          </tr>
          ${order.customerMobile ? `<tr><td style="padding:3px 0;"><strong>Mobile:</strong> ${order.customerMobile}</td><td></td></tr>` : ""}
          ${order.customerAddress ? `<tr><td colspan="2" style="padding:3px 0;"><strong>Address:</strong> ${order.customerAddress}</td></tr>` : ""}
          ${order.note ? `<tr><td colspan="2" style="padding:3px 0;"><strong>Note:</strong> ${order.note}</td></tr>` : ""}
        </table>

        <!-- Order Status -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td><strong>Order Status:</strong></td>
            <td align="right">
              <span style="text-transform:capitalize;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;background:#fef9c3;color:#854d0e;border:1px solid #fde68a;">
                ${order.status}
              </span>
            </td>
            <td width="20"></td>
            <td><strong>Payment:</strong></td>
            <td align="right">
              <span style="text-transform:capitalize;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;">
                ${order.paymentStatus}
              </span>
            </td>
          </tr>
        </table>

        <!-- Items Table -->
        <h3 style="margin:0 0 10px;font-size:15px;color:#374151;">Order Items</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:24px;">
          <thead>
            <tr style="background:#f7f8fa;border-bottom:2px solid #e5e7eb;">
              <th style="padding:8px 4px;text-align:left;">Product</th>
              <th style="padding:8px 4px;text-align:center;">Qty</th>
              <th style="padding:8px 4px;text-align:right;">Unit Price</th>
              <th style="padding:8px 4px;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <!-- Payment Summary -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fa;border-radius:8px;padding:16px;font-size:13px;margin-bottom:${paymentRows ? "24px" : "0"};">
          <tr><td colspan="2" style="padding-bottom:8px;font-size:14px;font-weight:700;color:#1f2328;">Payment Summary</td></tr>
          <tr>
            <td style="padding:4px 0;color:#57606a;">Order Total</td>
            <td style="text-align:right;font-weight:600;">${rupee(order.totalAmount)}</td>
          </tr>
          ${advanceAmount > 0 ? `<tr><td style="padding:4px 0;color:#57606a;">Advance Paid</td><td style="text-align:right;color:#7c3aed;font-weight:600;">${rupee(advanceAmount)}</td></tr>` : ""}
          <tr>
            <td style="padding:4px 0;color:#57606a;">Total Paid</td>
            <td style="text-align:right;color:#16a34a;font-weight:600;">${rupee(paidAmount)}</td>
          </tr>
          <tr style="border-top:1px solid #e5e7eb;">
            <td style="padding:8px 0 0;font-weight:700;">Amount Due</td>
            <td style="text-align:right;padding-top:8px;font-weight:700;font-size:15px;color:${dueAmount > 0 ? "#dc2626" : "#16a34a"};">${rupee(dueAmount)}</td>
          </tr>
        </table>

        <!-- Payment History -->
        ${
          paymentRows
            ? `<h3 style="margin:0 0 10px;font-size:15px;color:#374151;">Payment History</h3>
               <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
                 <thead><tr style="background:#f7f8fa;border-bottom:2px solid #e5e7eb;">
                   <th style="padding:6px 4px;text-align:left;">Type</th>
                   <th style="padding:6px 4px;text-align:left;">Date</th>
                   <th style="padding:6px 4px;text-align:right;">Amount</th>
                 </tr></thead>
                 <tbody>${paymentRows}</tbody>
               </table>`
            : ""
        }

      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f7f8fa;padding:16px 32px;text-align:center;color:#57606a;font-size:12px;border-top:1px solid #e5e7eb;">
        This is a system-generated invoice from <strong>SuperMax Panel</strong>. Please keep it for your records.
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
};

const buildInvoiceSubject = (trigger: InvoiceTrigger, orderId: string): string => {
  const shortId = String(orderId).slice(-8).toUpperCase();
  const map: Record<InvoiceTrigger, string> = {
    order_placed: `Order Confirmed #${shortId} — Invoice`,
    status_update: `Order #${shortId} Status Updated`,
    payment_added: `Payment Received — Order #${shortId}`,
  };
  return map[trigger];
};

export { buildInvoiceHtml, buildInvoiceSubject };
