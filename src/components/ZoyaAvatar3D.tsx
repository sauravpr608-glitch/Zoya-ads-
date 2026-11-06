import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Float, 
  MeshDistortMaterial, 
  MeshWobbleMaterial, 
  Sphere, 
  Environment, 
  ContactShadows,
  Torus
} from '@react-three/drei';
import * as THREE from 'three';

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface ZoyaAvatar3DProps {
  state: VisualizerState;
}

function AnimatedOrb({ state }: { state: VisualizerState }) {
  const orbRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Map state to colors and distortion values
  const theme = useMemo(() => {
    switch (state) {
      case "listening": return { colorFirst: "#8b5cf6", colorSecond: "#7c3aed", speed: 4, distort: 0.6 }; // Violet
      case "processing": return { colorFirst: "#38bdf8", colorSecond: "#0ea5e9", speed: 6, distort: 0.8 }; // Sky
      case "speaking": return { colorFirst: "#ec4899", colorSecond: "#db2777", speed: 3, distort: 0.4 }; // Pink
      default: return { colorFirst: "#06b6d4", colorSecond: "#0891b2", speed: 1.5, distort: 0.2 }; // Cyan
    }
  }, [state]);

  useFrame((state, delta) => {
    if (orbRef.current) {
      orbRef.current.rotation.y += delta * (theme.speed * 0.2);
      orbRef.current.rotation.z += delta * (theme.speed * 0.1);
    }
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * (theme.speed * 0.1);
      ringRef.current.rotation.y += delta * (theme.speed * 0.15);
    }
  });

  return (
    <>
      <Float speed={theme.speed} rotationIntensity={1} floatIntensity={1}>
        <Sphere ref={orbRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            color={theme.colorFirst}
            speed={theme.speed}
            distort={theme.distort}
            radius={1}
            emissive={theme.colorSecond}
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.9}
          />
        </Sphere>
        
        {/* Decorative Ring */}
        <Torus ref={ringRef} args={[1.5, 0.02, 16, 100]}>
          <meshStandardMaterial 
            color={theme.colorFirst} 
            emissive={theme.colorFirst} 
            emissiveIntensity={2} 
            transparent 
            opacity={0.5} 
          />
        </Torus>
      </Float>

      <Environment preset="city" />
      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4.5}
      />
    </>
  );
}

export default function ZoyaAvatar3D({ state }: ZoyaAvatar3DProps) {
  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <AnimatedOrb state={state} />
      </Canvas>
    </div>
  );
}
