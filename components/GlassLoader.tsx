"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Float, Environment } from "@react-three/drei";
import * as THREE from "three";

function GlassShape() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group dispose={null}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <mesh ref={meshRef} scale={2}>
          <icosahedronGeometry args={[1, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={16}
            thickness={2.5} // Increased thickness for more glass effect
            chromaticAberration={1.0} // High for "wow" factor
            anisotropy={0.2}
            distortion={0.5} // Distorted glass look
            distortionScale={0.5}
            temporalDistortion={0.2}
            iridescence={1}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            roughness={0.1}
            clearcoat={1}
            color="#ecfdf5" // Emerald-50 tint
            resolution={512}
            background={new THREE.Color("#ffffff")}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default function GlassLoader() {
  return (
    <div className="absolute inset-0 w-full h-full -z-10">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        {/* Soft, studio-like lighting */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Environment preset="city" />
        <GlassShape />
      </Canvas>
    </div>
  );
}
