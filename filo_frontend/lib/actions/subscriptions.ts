"use server";

import { MutationState } from "@/types";
import { post } from "../api.server";

export async function switchPlan(_prev: MutationState | null, packageId: string): Promise<MutationState> {
  return await post({
    path: "/subscriptions",
    body: { packageId },
  });
}
