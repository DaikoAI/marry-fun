"use client";

import { createAuthClient } from "better-auth/react";
import { web3Client } from "better-auth-web3/client";

export const authClient = createAuthClient({
  plugins: [web3Client()],
});
