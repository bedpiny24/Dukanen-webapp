import { Router } from "express";
import { db, conversationsTable, messagesTable, usersTable, productsTable } from "@workspace/db";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import {
  CreateConversationBody,
  ListMessagesParams,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const buyerConvs = await db.select().from(conversationsTable).where(eq(conversationsTable.buyerId, userId));
  const sellerConvs = await db.select().from(conversationsTable).where(eq(conversationsTable.sellerId, userId));
  const seen = new Set<number>();
  const convs = [...buyerConvs, ...sellerConvs]
    .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const enriched = await Promise.all(
    convs.map(async (conv) => {
      const [lastMsg] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, conv.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      const [{ cnt: unreadCount }] = await db
        .select({ cnt: count() })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, conv.id),
            eq(messagesTable.isRead, false),
            sql`${messagesTable.senderId} != ${userId}`
          )
        );

      const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, conv.buyerId));
      const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, conv.sellerId));
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, conv.productId));

      return {
        ...conv,
        buyerName: buyer?.name ?? null,
        sellerName: seller?.name ?? null,
        productTitle: product?.title ?? null,
        productImageUrl: product?.imageUrls?.[0] ?? null,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.createdAt?.toISOString() ?? null,
        unreadCount: Number(unreadCount ?? 0),
      };
    })
  );

  res.json(enriched);
});

router.post("/conversations", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { productId, sellerId, initialMessage } = parsed.data;
  const buyerId = req.user!.userId;

  // check if conversation already exists
  const [existing] = await db
    .select()
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.productId, productId),
        eq(conversationsTable.buyerId, buyerId),
        eq(conversationsTable.sellerId, sellerId)
      )
    );

  let conv = existing;
  if (!conv) {
    [conv] = await db.insert(conversationsTable).values({ productId, buyerId, sellerId }).returning();
  }

  // send initial message
  await db.insert(messagesTable).values({
    conversationId: conv.id,
    senderId: buyerId,
    content: initialMessage,
    isRead: false,
  });

  const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, buyerId));
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, sellerId));
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));

  res.status(201).json({
    ...conv,
    buyerName: buyer?.name ?? null,
    sellerName: seller?.name ?? null,
    productTitle: product?.title ?? null,
    productImageUrl: product?.imageUrls?.[0] ?? null,
    lastMessage: initialMessage,
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
  });
});

router.get("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, params.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const userId = req.user!.userId;
  if (conv.buyerId !== userId && conv.sellerId !== userId && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // mark messages as read
  const allMsgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id));

  const unreadFromOthers = allMsgs.filter((m) => !m.isRead && m.senderId !== userId).map((m) => m.id);
  if (unreadFromOthers.length > 0) {
    await db.update(messagesTable).set({ isRead: true }).where(inArray(messagesTable.id, unreadFromOthers));
  }

  const msgs = allMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const senderIds = [...new Set(msgs.map((m) => m.senderId))];
  const senders = senderIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, senderIds))
    : [];
  const senderMap = new Map(senders.map((s) => [s.id, s]));

  const enriched = msgs.map((m) => ({
    ...m,
    senderName: senderMap.get(m.senderId)?.name ?? null,
  }));

  res.json(enriched);
});

router.post("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, params.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const userId = req.user!.userId;
  if (conv.buyerId !== userId && conv.sellerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    conversationId: params.data.id,
    senderId: userId,
    content: parsed.data.content,
    isRead: false,
  }).returning();

  await db.update(conversationsTable).set({ updatedAt: new Date() }).where(eq(conversationsTable.id, params.data.id));

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json({ ...msg, senderName: sender?.name ?? null });
});

export default router;
