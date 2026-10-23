import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { runDailyJobs } from "@/server/schedule";

export async function GET(request: Request) {
  const secret = getServerEnv().CRON_SECRET;
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }
  const result = await runDailyJobs();
  return NextResponse.json(result);
}
