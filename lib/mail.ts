import "server-only";

import nodemailer from "nodemailer";

import type { OrderStatus } from "@/lib/constants";

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

type OrderItemSnapshot = {
  name: string;
  quantity: number;
  price: number;
};

type OrderMailPayload = {
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes?: string;
  };
  items: OrderItemSnapshot[];
  subtotal: number;
  status: OrderStatus;
};

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    adminNotifyEmail:
      process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER,
  };
}

export function isMailConfigured(): boolean {
  const { host, user, pass, from } = getSmtpConfig();
  return Boolean(host && user && pass && from);
}

function getTransporter() {
  const { host, port, secure, user, pass } = getSmtpConfig();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function formatItems(items: OrderItemSnapshot[]) {
  return items
    .map(
      (item) =>
        `<li>${item.quantity} × ${item.name} — ${item.price.toLocaleString()}</li>`,
    )
    .join("");
}

export async function sendMail({ to, subject, html }: SendMailInput) {
  const { from } = getSmtpConfig();

  if (!isMailConfigured() || !from) {
    console.info("[mail] SMTP is not configured. Skipping send.", {
      to,
      subject,
      html,
    });
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({ from, to, subject, html });
}

export async function sendOrderReceivedToCustomer(order: OrderMailPayload) {
  await sendMail({
    to: order.customer.email,
    subject: `We received your order ${order.orderNumber}`,
    html: `
      <p>Hello ${order.customer.name},</p>
      <p>Thank you for ordering from Coloured Gemstones. We have received <strong>${order.orderNumber}</strong> and will contact you shortly.</p>
      <p>Items:</p>
      <ul>${formatItems(order.items)}</ul>
      <p>Total: ${order.subtotal.toLocaleString()}</p>
    `,
  });
}

export async function sendNewOrderToAdmin(order: OrderMailPayload) {
  const { adminNotifyEmail } = getSmtpConfig();

  if (!adminNotifyEmail) {
    console.info("[mail] ADMIN_NOTIFY_EMAIL and SMTP_USER are missing. Skipping admin notice.");
    return;
  }

  await sendMail({
    to: adminNotifyEmail,
    subject: `New order ${order.orderNumber}`,
    html: `
      <p>A new order has been placed.</p>
      <p><strong>${order.orderNumber}</strong></p>
      <p>Customer: ${order.customer.name}<br />
      Email: ${order.customer.email}<br />
      Phone: ${order.customer.phone}<br />
      Address: ${order.customer.address}</p>
      ${order.customer.notes ? `<p>Notes: ${order.customer.notes}</p>` : ""}
      <ul>${formatItems(order.items)}</ul>
      <p>Total: ${order.subtotal.toLocaleString()}</p>
    `,
  });
}

export async function sendStatusUpdateToCustomer(
  order: OrderMailPayload,
  status: OrderStatus,
) {
  const statusCopy: Record<OrderStatus, string> = {
    pending: "Your order is pending confirmation.",
    confirmed: "Your order has been confirmed.",
    processing: "Your order is being prepared.",
    shipped: "Your order is on its way.",
    delivered: "Your order has been delivered.",
    cancelled: "Your order has been cancelled.",
  };

  await sendMail({
    to: order.customer.email,
    subject: `Order ${order.orderNumber} is now ${status}`,
    html: `
      <p>Hello ${order.customer.name},</p>
      <p>${statusCopy[status]}</p>
      <p>Order number: <strong>${order.orderNumber}</strong></p>
    `,
  });
}
