"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { placeOrder, removeCartItem } from "@/server/commerce";
import { addCartItem } from "@/server/commerce";
import { requireActionUser, customerForUser } from "@/server/guard";
import { assertRateLimit } from "@/server/rate-limit";
import { startOnlineCheckout } from "@/server/stripe-flow";

const addSchema = z.object({
  productId: z.string().uuid(),
  eye: z.enum(["RIGHT", "LEFT"]),
  quantity: z.coerce.number().int().min(1).max(12),
});

export async function addToCart(formData: FormData) {
  const session = await requireActionUser();
  const parsed = addSchema.safeParse({
    productId: formData.get("productId"),
    eye: formData.get("eye"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return;
  await addCartItem({ userId: session.user.id, ...parsed.data, purchaseMode: "ONE_TIME" });
  redirect("/carrello");
}

export async function removeFromCart(formData: FormData) {
  const session = await requireActionUser();
  const itemId = String(formData.get("itemId") ?? "");
  await removeCartItem(session.user.id, itemId);
}

export async function checkoutAction(formData: FormData) {
  const session = await requireActionUser();
  await assertRateLimit(`checkout:${session.user.id}`, 8);
  const fulfillment = formData.get("fulfillment") === "SHIPPING" ? "SHIPPING" : "PICKUP";
  const settlement = formData.get("settlement") === "PAY_AT_PICKUP" ? "PAY_AT_PICKUP" : "ONLINE";
  try {
    const order = await placeOrder({
      userId: session.user.id,
      fulfillment,
      settlement,
      customerNote: String(formData.get("note") ?? ""),
    });
    if (settlement === "ONLINE") {
      const profile = await customerForUser(session.user.id);
      const url = await startOnlineCheckout(order.id, profile?.email ?? session.user.email);
      redirect(url);
    }
    redirect(`/area-personale/ordini/${order.id}`);
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false as const, message: error instanceof Error ? error.message : "Ordine non creato." };
  }
}
