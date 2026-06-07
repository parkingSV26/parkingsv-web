import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  requestUrl.pathname = "/login";
  requestUrl.search = "";

  return NextResponse.redirect(requestUrl);
}
