import { prisma } from "@artfromromania/db";

export async function grantCuratorCommission(args: {
  orderId: string; 
  ticketId?: string | null; 
  platformFeeMinor: number; 
  grossMinor: number;
}) {
  // 1) găsește curatorul asociat ticketului
  if (!args.ticketId) return;
  const t = await prisma.ticket.findUnique({ 
    where: { id: args.ticketId }, 
    select: { curatorId: true }
  });
  if (!t?.curatorId) return;

  const basis = (process.env.CURATOR_COMMISSION_BASIS || "PLATFORM_FEE").toUpperCase();
  const pct = parseFloat(process.env.CURATOR_COMMISSION_PCT || "0.08");
  const basisMinor = basis === "GROSS" ? args.grossMinor : args.platformFeeMinor;
  const commissionMinor = Math.max(0, Math.round(basisMinor * pct));

  await prisma.curatorCommission.create({
    data: {
      ticketId: args.ticketId!,
      curatorId: t.curatorId,
      orderId: args.orderId,
      basisMinor,
      pct,
      commissionMinor,
      status: "EARNED",
      earnedAt: new Date()
    }
  });

  // update stats
  const profile = await prisma.curatorProfile.findUnique({ 
    where: { id: t.curatorId }, 
    select: { id: true }
  });
  if (profile) {
    await prisma.curatorStats.upsert({
      where: { curatorId: profile.id },
      update: { 
        commissionMinorEarned: { increment: commissionMinor }, 
        lastUpdated: new Date() 
      },
      create: { 
        curatorId: profile.id, 
        commissionMinorEarned: commissionMinor 
      }
    });
  }
}
