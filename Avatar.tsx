"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { Suspense, useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { VoiceState } from "@/hooks/useVoice";

// Needs public/avatar.glb: a rigged, ARKit-blendshape model (e.g. Ready Player Me with ?morphTargets=ARKit).
function Model({ state, mouth }: { state: VoiceState; mouth: MutableRefObject<number> }) {
  const { scene } = useGLTF("/avatar.glb");
  const meshes = useRef<THREE.SkinnedMesh[]>([]);
  const nextBlink = useRef(2); const blink = useRef(0);
  useEffect(() => { const m: THREE.SkinnedMesh[] = []; scene.traverse((o: any) => { if (o.morphTargetDictionary) m.push(o); }); meshes.current = m; }, [scene]);

  const set = (name: string, v: number) => meshes.current.forEach((m) => { const i = m.morphTargetDictionary?.[name]; if (i !== undefined) m.morphTargetInfluences![i] = THREE.MathUtils.lerp(m.morphTargetInfluences![i], v, 0.25); });

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    nextBlink.current -= dt;
    if (nextBlink.current <= 0) { blink.current = 1; nextBlink.current = 2 + Math.random() * 4; }
    blink.current = Math.max(0, blink.current - dt * 8);
    const b = Math.sin(blink.current * Math.PI);
    set("eyeBlinkLeft", b); set("eyeBlinkRight", b);
    set("jawOpen", state === "speaking" ? mouth.current * 0.7 : 0);
    mouth.current *= 0.9;
    const smile = state === "speaking" || state === "idle" ? 0.25 : 0;
    set("mouthSmileLeft", smile); set("mouthSmileRight", smile);
    set("browInnerUp", state === "listening" ? 0.45 : state === "thinking" ? 0.2 : 0);
    set("eyeLookUpLeft", state === "thinking" ? 0.5 : 0); set("eyeLookUpRight", state === "thinking" ? 0.5 : 0);
    const head = scene.getObjectByName("Head");
    const tilt = state === "thinking" ? 0.12 : 0;
    scene.rotation.y = Math.sin(t * 0.5) * 0.06;
    if (head) head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, tilt + Math.sin(t * 0.8) * 0.02, 0.1);
  });
  return <primitive object={scene} position={[0, -1.55, 0]} scale={1.05} />;
}

export function Avatar({ state, mouth }: { state: VoiceState; mouth: MutableRefObject<number> }) {
  return (
    <Canvas camera={{ position: [0, 0.1, 1.1], fov: 28 }} dpr={[1, 1.75]} aria-label={`JARVIS avatar, ${state}`}>
      <ambientLight intensity={0.5} /><directionalLight position={[2, 3, 3]} intensity={1.4} color="#d9fff0" /><pointLight position={[-2, 1, 1]} intensity={0.8} color="#d4af37" />
      <Suspense fallback={null}><Model state={state} mouth={mouth} /><Environment preset="city" /></Suspense>
    </Canvas>
  );
}
