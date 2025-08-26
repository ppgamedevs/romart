import { PrismaClient } from "@prisma/client";

// Use direct URL for API to avoid pooler issues
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace('pooler.', 'db.')
    }
  }
});
import { renderTemplate } from "@artfromromania/email";
import { sendEmailResend } from "./providers/resend";
import type { EnqueueEmailParams, NotifTopic } from "./types";

// respectă preferințele userului din UserNotifPref
async function canSendEmail(userId?: string, topic?: NotifTopic) {
  if (!userId) return true;
  const pref = await prisma.userNotifPref.findUnique({ where: { userId } });
  if (!pref) return true;
  if (topic === "ORDER" || topic === "INVOICE" || topic === "SHIPPING") return pref.emailOrder;
  if (topic === "CURATOR" || topic === "COMMISSION") return pref.emailCurator;
  if (topic === "AUTH") return pref.emailAuth;
  if (topic === "CART") return pref.emailCart;
  return true;
}

export async function enqueueEmail<T extends import("@artfromromania/email").TemplateName>(
  args: EnqueueEmailParams<T>
) {
  const { userId, email, topic, template, payload, replyTo } = args;
  const to = email ?? (userId ? (await prisma.user.findUnique({ where: { id: userId } }))?.email! : undefined);
  if (!to) throw new Error("No recipient email");

  const canSend = await canSendEmail(userId, topic);
  if (!canSend) {
    await prisma.notification.create({
      data: { userId, email: to, topic, channel: "EMAIL", template, payload: payload as any, status: "CANCELED" as any },
    });
    return { queued: false, reason: "pref-disabled" };
  }

  // creează Notification (PENDING)
  const notif = await prisma.notification.create({
    data: { userId, email: to, topic, channel: "EMAIL", template, payload: payload as any, status: "PENDING" as any },
  });

  // randează & trimite imediat (MVP fără worker separat)
  const { subject, html, text } = renderTemplate(template, payload as any);
  const res = await sendEmailResend({
    from: process.env.EMAIL_FROM!,
    to,
    replyTo: args.replyTo ?? process.env.EMAIL_REPLY_TO,
    subject,
    html,
    text,
  });

  await prisma.emailLog.create({
    data: {
      notifId: notif.id,
      to,
      subject,
      provider: "RESEND",
      providerId: res.id ?? undefined,
      status: res.ok ? "sent" : "error",
      error: res.ok ? undefined : "resend_error",
    },
  });

  await prisma.notification.update({
    where: { id: notif.id },
    data: { status: res.ok ? ("SENT" as any) : ("FAILED" as any), sentAt: new Date() },
  });

  return { queued: true, ok: res.ok };
}
