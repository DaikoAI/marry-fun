import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// OpenNext Cloudflare: enable local bindings during `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withNextIntl(nextConfig);
void initOpenNextCloudflareForDev();
