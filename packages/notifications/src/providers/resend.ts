import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy-key");

export async function sendEmailResend(params: {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const { from, to, replyTo, subject, html, text } = params;
  const res = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
    reply_to: replyTo,
  });
  return { id: (res as any)?.id ?? null, ok: !("error" in (res as any)) };
}
