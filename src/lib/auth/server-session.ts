import { headers } from "next/headers";

import { getAuth } from "./auth";

export async function getServerSession() {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
}
