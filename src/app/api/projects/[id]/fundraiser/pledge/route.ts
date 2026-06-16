import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripTags, APP_URL } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import crypto from "crypto";

const MAX_PLEDGE = 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function makeVoucherCode(): string {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 5);
  return `SSH-${rand}-${Date.now()}`;
}

// Public (email required): pledge support, optionally claiming a reward tier (→ voucher).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`pledge:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const session = await getServerSession(authOptions);

  try {
    const fundraiser = await prisma.fundraiser.findUnique({
      where: { projectId: id },
      include: { project: { select: { name: true, owner: { select: { email: true } } } }, rewards: true },
    });
    if (!fundraiser || !fundraiser.isActive) {
      return NextResponse.json({ error: "This fundraiser is not accepting pledges" }, { status: 400 });
    }

    const body = await request.json();
    const name = stripTags(String(body.name || "").trim()).slice(0, 100);
    const email = stripTags(String(body.email || "").trim()).slice(0, 255);
    const message = body.message ? stripTags(String(body.message).trim()).slice(0, 300) : null;
    const rewardId = body.rewardId ? String(body.rewardId) : null;
    let amount = Math.floor(Number(body.amount));

    if (!name) return NextResponse.json({ error: "Your name is required" }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });

    let reward = null;
    if (rewardId) {
      reward = fundraiser.rewards.find((r) => r.id === rewardId) || null;
      if (!reward) return NextResponse.json({ error: "Reward not found" }, { status: 400 });
      if (reward.limit !== null && reward.claimed >= reward.limit) {
        return NextResponse.json({ error: "This reward is sold out" }, { status: 400 });
      }
      amount = reward.amount; // reward locks the amount
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_PLEDGE) {
      return NextResponse.json({ error: `Pledge must be between CHF 1 and CHF ${MAX_PLEDGE}` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const pledge = await tx.fundingPledge.create({
        data: {
          fundraiserId: fundraiser.id,
          userId: session?.user?.id ?? null,
          name, email, amount, message,
          rewardId: reward?.id ?? null,
        },
      });

      await tx.fundraiser.update({
        where: { id: fundraiser.id },
        data: { currentAmount: { increment: amount } },
      });

      let voucherCode: string | null = null;
      if (reward) {
        await tx.fundraiserReward.update({ where: { id: reward.id }, data: { claimed: { increment: 1 } } });
        const voucher = await tx.voucher.create({
          data: {
            code: makeVoucherCode(),
            fundraiserId: fundraiser.id,
            rewardId: reward.id,
            pledgeId: pledge.id,
          },
        });
        voucherCode = voucher.code;
      }
      return { voucherCode };
    });

    const projectName = fundraiser.project.name;
    const projectUrl = `${APP_URL}/projects/${id}`;

    // Supporter confirmation
    sendEmail({
      to: email,
      subject: `Thank you for pledging to ${projectName} — Swiss Startup Hub`,
      text: `Thank you for pledging CHF ${amount} to ${projectName}.${result.voucherCode ? `\n\nYour voucher code: ${result.voucherCode}\nRedeem it with the team to get "${reward?.title}".` : ""}\n\nThe team will contact you about payment details.\n\n${projectUrl}`,
      type: "pledge_confirmation",
    }).catch((err) => logger.error("Pledge supporter email failed", { error: String(err) }));

    // Founder notification
    if (fundraiser.project.owner?.email) {
      sendEmail({
        to: fundraiser.project.owner.email,
        subject: `New pledge: CHF ${amount} for ${projectName}`,
        text: `${name} pledged CHF ${amount} for ${projectName}${reward ? ` with reward: ${reward.title}` : ""}.${message ? `\n\nMessage: "${message}"` : ""}\n\n${projectUrl}`,
        type: "pledge_founder",
      }).catch((err) => logger.error("Pledge founder email failed", { error: String(err) }));
    }

    return NextResponse.json({ success: true, voucherCode: result.voucherCode, rewardTitle: reward?.title ?? null }, { status: 201 });
  } catch (error) {
    logger.error("Pledge error", { id, error: String(error) });
    return NextResponse.json({ error: "Failed to record pledge" }, { status: 500 });
  }
}
