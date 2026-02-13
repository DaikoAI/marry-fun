"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls } from "@react-three/drei";
import { Component, memo, Suspense, useRef, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { DoubleSide, Mesh } from "three";
import type { AnimationClip, Group, MeshStandardMaterial } from "three";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// --- Asset paths ---
const MODEL_PATH = "/3d/girl/rigged-mesh.glb";

const ANIM_PATHS = {
  idle: "/3d/girl/animations/idle.glb",
  mirror: "/3d/girl/animations/mirror.glb",
  sit: "/3d/girl/animations/sit.glb",
} as const;

const ANIM_NAMES = Object.keys(ANIM_PATHS) as (keyof typeof ANIM_PATHS)[];

const CROSSFADE_DURATION = 0.8;
const HOLD_MIN = 8;
const HOLD_MAX = 15;

function randomHoldTime() {
  return (HOLD_MIN + Math.random() * (HOLD_MAX - HOLD_MIN)) * 1000;
}

function pickNextAnim(current: string): keyof typeof ANIM_PATHS {
  const candidates = ANIM_NAMES.filter(n => n !== current);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// --- Shared UI ---
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// WebKit WebGL の制限対策: 軽量設定
const CANVAS_DPR: [number, number] = [1, 1.5];

const GL_CONFIG = {
  antialias: false, // 軽量化
  alpha: true,
  stencil: false,
  depth: true,
  powerPreference: "high-performance" as const,
};

class ViewerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function LoadingPanel() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-full bg-black/35 px-4 py-2 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-md">
        Loading...
      </div>
    </div>
  );
}

function ErrorPanel() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-2xl bg-black/40 px-4 py-3 text-center text-xs leading-5 font-medium text-white/85 backdrop-blur-md">
        Failed to load 3D model
      </div>
    </div>
  );
}

/**
 * frameloop="demand" モードでも初回レンダリングを確実に行う
 */
function SceneInitializer() {
  const { invalidate } = useThree();

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  return null;
}

function GirlModel({ reducedMotion, animationEnabled }: { reducedMotion: boolean; animationEnabled: boolean }) {
  const groupRef = useRef<Group>(null);
  const { invalidate } = useThree();
  const currentAnimRef = useRef<keyof typeof ANIM_PATHS>("idle");

  // Load model (mesh+rig) separately from animations
  const modelGltf = useGLTF(MODEL_PATH);
  const idleGltf = useGLTF(ANIM_PATHS.idle);
  const mirrorGltf = useGLTF(ANIM_PATHS.mirror);
  const sitGltf = useGLTF(ANIM_PATHS.sit);

  // Fix mesh rendering: DoubleSide + disable transparency + ensure depth write
  useEffect(() => {
    modelGltf.scene.traverse(child => {
      if (child instanceof Mesh && child.material) {
        const materials = (Array.isArray(child.material) ? child.material : [child.material]) as MeshStandardMaterial[];
        for (const mat of materials) {
          mat.side = DoubleSide;
          mat.transparent = false;
          mat.depthWrite = true;
          mat.alphaTest = 0.5;
        }
      }
    });
  }, [modelGltf.scene]);

  // One clip per animation file, uniquely named to avoid overwriting in useAnimations
  const allClips = useMemo(() => {
    const clips: AnimationClip[] = [];
    const gltfMap = { idle: idleGltf, mirror: mirrorGltf, sit: sitGltf } as const;
    for (const [name, gltf] of Object.entries(gltfMap)) {
      const clip = gltf.animations[0];
      const renamed = clip.clone();
      renamed.name = name;
      clips.push(renamed);
    }
    return clips;
  }, [idleGltf, mirrorGltf, sitGltf]);

  const { actions, mixer } = useAnimations(allClips, groupRef);

  // Start idle animation on mount & set up auto-switching
  const switchAnim = useCallback(
    (to: keyof typeof ANIM_PATHS) => {
      const prev = actions[currentAnimRef.current];
      const next = actions[to];
      if (!next) return;

      next.reset().play();
      if (prev && prev !== next) {
        prev.crossFadeTo(next, CROSSFADE_DURATION, true);
      }
      currentAnimRef.current = to;
    },
    [actions],
  );

  useEffect(() => {
    if (reducedMotion) {
      // Stop all animations and show static pose
      mixer.stopAllAction();
      invalidate();
      return;
    }

    // Start idle
    switchAnim("idle");

    // Auto-switch timer
    let timerId: ReturnType<typeof setTimeout>;
    function scheduleNext() {
      timerId = setTimeout(() => {
        const next = pickNextAnim(currentAnimRef.current);
        switchAnim(next);
        scheduleNext();
      }, randomHoldTime());
    }
    scheduleNext();

    return () => {
      clearTimeout(timerId);
    };
  }, [actions, mixer, reducedMotion, switchAnim, invalidate]);

  // モデルロード完了時に再レンダリング
  useEffect(() => {
    invalidate();
  }, [modelGltf, invalidate]);

  // 回転・浮遊モーション
  useFrame(state => {
    if (reducedMotion || !animationEnabled) return;
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y += 0.003;
    group.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.06;
  });

  return (
    <group ref={groupRef} position={[0, -1.5, 0]} scale={1}>
      <primitive object={modelGltf.scene} />
    </group>
  );
}

// 3D空間内のローディング表示
function ModelLoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color="#666" wireframe />
    </mesh>
  );
}

function Scene({ reducedMotion, animationEnabled }: { reducedMotion: boolean; animationEnabled: boolean }) {
  return (
    <>
      <SceneInitializer />

      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 5, 2]} intensity={1.5} />
      <directionalLight position={[-3, 3, -2]} intensity={0.8} />
      <hemisphereLight intensity={0.5} />

      {/* Suspense を Canvas 内部に配置してCanvas再マウントを防止 */}
      <Suspense fallback={<ModelLoadingFallback />}>
        <GirlModel reducedMotion={reducedMotion} animationEnabled={animationEnabled} />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        target={[0, 1, 0]}
        minPolarAngle={Math.PI / 2.2}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

// クライアントサイドマウント状態を追跡（SSR対応）
const emptySubscribe = () => () => {};

function useClientMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // クライアント: true
    () => false, // サーバー: false
  );
}

// Canvas を安定化するためにメモ化
const StableCanvas = memo(function StableCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Canvas
      dpr={CANVAS_DPR}
      frameloop={reducedMotion ? "demand" : "always"}
      gl={GL_CONFIG}
      camera={{ position: [0, 0, 4.5], fov: 45, near: 0.1, far: 100 }}
    >
      <Scene reducedMotion={reducedMotion} animationEnabled={true} />
    </Canvas>
  );
});

export function ThreeViewer() {
  const reducedMotion = usePrefersReducedMotion();
  const mounted = useClientMounted();

  if (!mounted) {
    return <LoadingPanel />;
  }

  return (
    <ViewerErrorBoundary fallback={<ErrorPanel />}>
      <div className="h-full w-full">
        <StableCanvas reducedMotion={reducedMotion} />
      </div>
    </ViewerErrorBoundary>
  );
}

// Preload model + animations
useGLTF.preload(MODEL_PATH);
useGLTF.preload(ANIM_PATHS.idle);
useGLTF.preload(ANIM_PATHS.mirror);
useGLTF.preload(ANIM_PATHS.sit);
