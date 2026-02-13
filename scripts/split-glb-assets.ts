/**
 * Split GLB assets: extract base rigged mesh and animation-only files.
 *
 * Usage: bun run scripts/split-glb-assets.ts
 *
 * Input:  public/3d/girl/Animation_*_withSkin.glb  (3 files, ~14MB each)
 * Output: public/3d/girl/rigged-mesh.glb           (mesh+rig, no animation)
 *         public/3d/girl/animations/{idle,mirror,sit}.glb  (skeleton+anim only)
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { prune } from "@gltf-transform/functions";
import { logger } from "../src/utils/logger";

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const base = path.join(process.cwd(), "public/3d/girl");
const animDir = path.join(base, "animations");

await mkdir(animDir, { recursive: true });

// 1. Extract base rigged mesh (no animations)
logger.log("Extracting rigged-mesh.glb...");
const meshDoc = await io.read(path.join(base, "Animation_Idle_7_withSkin.glb"));
for (const anim of meshDoc.getRoot().listAnimations()) {
  anim.dispose();
}
await meshDoc.transform(prune());
await io.write(path.join(base, "rigged-mesh.glb"), meshDoc);
logger.log("  -> rigged-mesh.glb written");

// 2. Extract animation-only files (skeleton + keyframes, no mesh/textures)
const animSources: [string, string][] = [
  ["Animation_Idle_7_withSkin.glb", "idle.glb"],
  ["Animation_Mirror_Viewing_withSkin.glb", "mirror.glb"],
  ["Animation_Chair_Sit_Idle_F_withSkin.glb", "sit.glb"],
];

for (const [src, out] of animSources) {
  logger.log(`Extracting animations/${out} from ${src}...`);
  const doc = await io.read(path.join(base, src));

  // Remove mesh references from all nodes so prune() can clean up meshes/textures
  for (const node of doc.getRoot().listNodes()) {
    if (node.getMesh()) node.setMesh(null);
  }

  await doc.transform(prune());
  await io.write(path.join(animDir, out), doc);
  logger.log(`  -> animations/${out} written`);
}

logger.log("\nDone! Asset split complete.");
