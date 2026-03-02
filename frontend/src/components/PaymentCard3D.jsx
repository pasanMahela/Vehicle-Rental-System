import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';

export default function PaymentCard3D({
  isFlipped = false,
  isSuccess = false,
  isError = false,
  bookingRef = '---',
  cardType = 'VISA',
  mousePos = { x: 0, y: 0 },
}) {
  const cardRef = useRef();
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const shakeTime = useRef(0);
  const riseOffset = useRef(0);

  useEffect(() => {
    if (!isError) shakeTime.current = 0;
  }, [isError]);

  // Gradient texture for front face (blue to purple)
  const frontGradient = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 512, 256);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(0.5, '#6366f1');
    gradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  useFrame((_, delta) => {
    if (!cardRef.current) return;

    // Mouse-based tilt (max ~15 degrees)
    const tiltFactor = 0.15;
    targetRotation.current.x = -mousePos.y * tiltFactor * (Math.PI / 12);
    targetRotation.current.y = mousePos.x * tiltFactor * (Math.PI / 12);

    // When flipped, invert for back face view
    const flipY = isFlipped ? Math.PI : 0;
    targetRotation.current.y += flipY;

    // Smooth interpolation
    const lerpFactor = 0.08;
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * lerpFactor;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * lerpFactor;

    cardRef.current.rotation.x = currentRotation.current.x;
    cardRef.current.rotation.y = currentRotation.current.y;

    // Rise animation when success
    if (isSuccess) {
      riseOffset.current = Math.min(riseOffset.current + delta * 0.5, 0.15);
      cardRef.current.position.y = riseOffset.current;
    }

    // Shake animation when error
    if (isError) {
      shakeTime.current += delta * 12;
      const shake = Math.sin(shakeTime.current) * 0.03 * Math.exp(-shakeTime.current * 0.3);
      cardRef.current.position.x = shake;
    }
  });

  const frontFace = (
    <group position={[0, 0, 0.051]}>
      {/* Gradient background plane */}
      <mesh>
        <planeGeometry args={[2.8, 1.7]} />
        <meshStandardMaterial map={frontGradient} metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Card number */}
      <Text
        position={[0, 0.35, 0.01]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        •••• •••• •••• 4242
      </Text>
      {/* Chip icon area */}
      <mesh position={[-0.9, 0.25, 0.02]}>
        <planeGeometry args={[0.25, 0.2]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Vehicle Rental */}
      <Text
        position={[-0.9, -0.5, 0.01]}
        fontSize={0.1}
        color="rgba(255,255,255,0.9)"
        anchorX="left"
        anchorY="middle"
      >
        Vehicle Rental
      </Text>
      {/* Booking ref */}
      <Text
        position={[0.9, -0.5, 0.01]}
        fontSize={0.1}
        color="rgba(255,255,255,0.9)"
        anchorX="right"
        anchorY="middle"
      >
        REF: {bookingRef}
      </Text>
      {cardType && (
        <Text
          position={[0.9, 0.5, 0.01]}
          fontSize={0.12}
          color="rgba(255,255,255,0.95)"
          anchorX="right"
          anchorY="middle"
        >
          {cardType}
        </Text>
      )}
    </group>
  );

  const backFace = (
    <group position={[0, 0, -0.051]} rotation={[0, Math.PI, 0]}>
      {/* Dark background */}
      <mesh>
        <planeGeometry args={[2.8, 1.7]} />
        <meshStandardMaterial color="#1e1e2e" metalness={0.2} roughness={0.6} />
      </mesh>
      {/* Black stripe */}
      <mesh position={[0, 0.35, 0.01]}>
        <planeGeometry args={[2.6, 0.5]} />
        <meshStandardMaterial color="#0a0a0f" roughness={0.8} />
      </mesh>
      {/* CVV area */}
      <mesh position={[0.7, -0.2, 0.01]}>
        <planeGeometry args={[0.4, 0.25]} />
        <meshStandardMaterial color="#2d2d3a" roughness={0.6} />
      </mesh>
      <Text
        position={[0.7, -0.2, 0.02]}
        fontSize={0.08}
        color="#888"
        anchorX="center"
        anchorY="middle"
      >
        CVV
      </Text>
    </group>
  );

  return (
    <group ref={cardRef} position={[0, 0, 0]}>
      <Environment preset="city" />
      <RoundedBox args={[2.8, 1.7, 0.102]} radius={0.04} smoothness={4}>
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.5}
          roughness={0.35}
          envMapIntensity={1.2}
          side={THREE.DoubleSide}
        />
      </RoundedBox>
      {frontFace}
      {backFace}
      {/* Green checkmark overlay when success */}
      {isSuccess && (
        <group position={[0, 0, 0.06]}>
          <mesh>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.95} />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.4}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            ✓
          </Text>
        </group>
      )}
      {/* Red glow when error */}
      {isError && (
        <group position={[0, 0, 0.055]}>
          <mesh>
            <planeGeometry args={[2.9, 1.8]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.15} />
          </mesh>
        </group>
      )}
    </group>
  );
}
