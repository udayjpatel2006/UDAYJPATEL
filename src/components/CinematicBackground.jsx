import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// -------------------------------------------------------------
// SHADERS FOR AURORA FLOWING LIGHT WAVES
// -------------------------------------------------------------
const auroraVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const auroraFragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // Simple pseudo-random hash
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // 2D Value Noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  // Fractional Brownian Motion (FBM)
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial alignment artifacts
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Center & scale UV coords
    vec2 uv = vUv;
    
    // Domain warping for organic, flowy aurora smoke movement
    vec2 q = vec2(0.0);
    q.x = fbm(uv + uTime * 0.03);
    q.y = fbm(uv + vec2(2.0, 5.0) - uTime * 0.02);

    vec2 r = vec2(0.0);
    r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + uTime * 0.015);
    r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + uTime * 0.01);

    // Final warped noise value
    float f = fbm(uv + r * 1.5);

    // Color Palette mapping (Very subtle, dark, aesthetic)
    // #0A0A0A (0.04, 0.04, 0.04) -> Base Dark Gray
    // #111827 (0.067, 0.094, 0.153) -> Deep Navy Blue
    // #1E3A8A (0.118, 0.227, 0.541) -> Dark Royal Navy Blue
    // #60A5FA (0.376, 0.647, 0.98) -> Soft Glow Blue
    
    vec3 baseColor = vec3(0.039, 0.039, 0.039); // #0A0A0A
    vec3 navyColor = vec3(0.067, 0.094, 0.153); // #111827
    vec3 royalColor = vec3(0.118, 0.227, 0.541); // #1E3A8A
    vec3 glowColor = vec3(0.376, 0.647, 0.98); // #60A5FA

    // Blend base and navy background
    vec3 color = mix(baseColor, navyColor, clamp(f * 2.2, 0.0, 1.0));
    
    // Add royal navy waves
    color = mix(color, royalColor, clamp(length(q) * 1.2, 0.0, 1.0) * 0.45);
    
    // Add highlights of soft glow blue waves (low opacity & extremely subtle)
    color = mix(color, glowColor, clamp(length(r) * 1.0, 0.0, 1.0) * 0.08);

    // Darken corners for cinematic vignetting
    float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    vignette = clamp(pow(vignette * 16.0, 0.75), 0.0, 1.0);
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// -------------------------------------------------------------
// SHADERS FOR FLOAT PARTICLES (WITH DEPTH AND GLOW)
// -------------------------------------------------------------
const particleVertexShader = `
  attribute float aSize;
  varying float vDepth;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation based on distance
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    
    // Pass depth for custom opacity in fragment shader
    vDepth = -mvPosition.z;
  }
`;

const particleFragmentShader = `
  varying float vDepth;
  void main() {
    // Radial soft particle shape
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft falloff glow
    float alpha = smoothstep(0.5, 0.0, dist);
    
    // Fade particles that are too close or too far
    float depthFade = smoothstep(1.0, 4.0, vDepth) * (1.0 - smoothstep(12.0, 20.0, vDepth));
    
    // Very low opacity to stay elegant and readable (Max opacity around 0.12)
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * depthFade * 0.12);
  }
`;

export default function CinematicBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Three.js Scene, Camera, and Renderer
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    
    // Perspective camera for natural 3D depth and parallax
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 8;

    // Detect device preferences and capability
    const isMobile = window.matchMedia('(pointer: coarse)').matches || width < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false, powerPreference: "high-performance" });
    // Lower pixel ratio on mobile and limit high-dpi devices to reduce shader processing overhead
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    // 2. Background Shader Plane (Aurora waves)
    const bgGeometry = new THREE.PlaneGeometry(2, 2);
    const bgMaterial = new THREE.ShaderMaterial({
      vertexShader: auroraVertexShader,
      fragmentShader: auroraFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) }
      },
      depthWrite: false,
      depthTest: false
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    
    // Render first background scene with camera setup or just a separate camera
    // Since we use coordinates in vertex shader direct vec4(position, 1.0), it covers NDC [-1, 1] perfectly.
    // To render this background behind everything, we render it first or just place it far away.
    // Creating a separate scene or rendering it as a full-screen orthographic quad is very clean.
    // In our case, we can create a child Orthographic Camera or just render this mesh in a background scene.
    // Alternatively, let's keep it simple: we can render it far back in the same perspective scene.
    // Actually, setting its coordinates to cover the screen plane makes it perfect. Let's make it cover the frustum.
    // To cover the frustum at z = -15:
    const distanceToPlane = 15;
    const tempCam = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    const vFOV = THREE.MathUtils.degToRad(tempCam.fov);
    const planeHeight = 2 * Math.tan(vFOV / 2) * distanceToPlane;
    const planeWidth = planeHeight * tempCam.aspect;
    
    const auroraGeometry = new THREE.PlaneGeometry(planeWidth * 1.5, planeHeight * 1.5);
    const auroraMesh = new THREE.Mesh(auroraGeometry, bgMaterial);
    auroraMesh.position.z = -distanceToPlane;
    scene.add(auroraMesh);

    // 3. Particles Setup
    // Mobile optimization: decrease particle count on smaller viewports
    const isMobile = window.matchMedia('(pointer: coarse)').matches || width < 768;
    // Lower subtle opacity for particles to keep text readable
    const particleCount = isMobile ? 80 : 150; // 80 on mobile, 150 on desktop (within 100-200 range)

    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const offsets = new Float32Array(particleCount * 3);

    // Initialize particles in a large frustum space
    const rangeX = planeWidth * 1.1;
    const rangeY = planeHeight * 1.1;
    const minZ = -10;
    const maxZ = 2;

    for (let i = 0; i < particleCount; i++) {
      const rx = (Math.random() - 0.5) * rangeX;
      const ry = (Math.random() - 0.5) * rangeY;
      const rz = Math.random() * (maxZ - minZ) + minZ;

      positions[i * 3] = rx;
      positions[i * 3 + 1] = ry;
      positions[i * 3 + 2] = rz;

      basePositions[i * 3] = rx;
      basePositions[i * 3 + 1] = ry;
      basePositions[i * 3 + 2] = rz;

      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;

      // Small variation in visual scale
      sizes[i] = Math.random() * 4.0 + 1.5;

      // Random seeds for slow harmonic ambient drift (x, y, z speeds)
      offsets[i * 3] = Math.random() * Math.PI * 2;
      offsets[i * 3 + 1] = Math.random() * Math.PI * 2;
      offsets[i * 3 + 2] = Math.random() * Math.PI * 2;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 4. Mouse Tracking & Projection logic
    let mouse = new THREE.Vector2(0, 0);
    let targetMouse3D = new THREE.Vector3(0, 0, 0);
    let isMouseActive = false;
    let lastMouseMoveTime = 0;

    const handleMouseMove = (e) => {
      // Normalize mouse coordinates to [-1, 1]
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      isMouseActive = true;
      lastMouseMoveTime = performance.now();
    };

    const handleMouseLeave = () => {
      isMouseActive = false;
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    // Project screen coordinate mouse to 3D world space at average particle Z depth
    const projectMouse = () => {
      if (!isMouseActive) return;
      
      const mouse3D = new THREE.Vector3(mouse.x, mouse.y, 0.5);
      mouse3D.unproject(camera);
      
      const dir = mouse3D.sub(camera.position).normalize();
      const avgZ = -3.0; // average particle Z position
      const distance = (avgZ - camera.position.z) / dir.z;
      
      targetMouse3D.copy(camera.position).add(dir.multiplyScalar(distance));
    };

    // 5. Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId;

    const tick = () => {
      if (prefersReducedMotion) {
        // Render once statically and bypass loop
        renderer.render(scene, camera);
        return;
      }

      const elapsedTime = clock.getElapsedTime();
      
      // Update background shader time
      bgMaterial.uniforms.uTime.value = elapsedTime;

      // Project mouse if active
      if (isMouseActive && !isMobile) {
        // Fade active state if mouse hasn't moved in 2.5 seconds
        if (performance.now() - lastMouseMoveTime > 2500) {
          isMouseActive = false;
        } else {
          projectMouse();
        }
      }

      // Physics settings
      const gravityRadius = 5.5;
      const gravityStrength = 0.055;
      const swirlStrength = 0.045;
      const springBackK = 0.008; // smooth return strength
      const friction = 0.94; // high damping for liquid cinematic flow
      
      const posAttr = particleGeometry.attributes.position;
      const posArray = posAttr.array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Base coordinate with slow, harmonic drift (adventure atmosphere)
        const bx = basePositions[i3] + Math.sin(elapsedTime * 0.25 + offsets[i3]) * 0.45;
        const by = basePositions[i3 + 1] + Math.cos(elapsedTime * 0.2 + offsets[i3 + 1]) * 0.45;
        const bz = basePositions[i3 + 2] + Math.sin(elapsedTime * 0.15 + offsets[i3 + 2]) * 0.3;

        // Current coordinates
        let px = posArray[i3];
        let py = posArray[i3 + 1];
        let pz = posArray[i3 + 2];

        // Restoring spring force towards drifted baseline
        let fx = (bx - px) * springBackK;
        let fy = (by - py) * springBackK;
        let fz = (bz - pz) * springBackK;

        // Add subtle gravitational attraction and swirl if mouse is close
        if (isMouseActive && !isMobile) {
          const dx = targetMouse3D.x - px;
          const dy = targetMouse3D.y - py;
          const dz = targetMouse3D.z - pz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;

          if (dist < gravityRadius) {
            // Normalized direction vector
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;

            // Gravitational pull (smooth falloff)
            const fAttract = (1.0 - dist / gravityRadius) * gravityStrength;
            fx += nx * fAttract;
            fy += ny * fAttract;
            fz += nz * fAttract;

            // Soft orbit swirl cross product (swirling around cursor)
            // Cross product direction with z-axis (0,0,1)
            const swirlX = ny;
            const swirlY = -nx;
            
            fx += swirlX * fAttract * swirlStrength * 8.0;
            fy += swirlY * fAttract * swirlStrength * 8.0;
          }
        }

        // Apply forces to velocity
        velocities[i3] = (velocities[i3] + fx) * friction;
        velocities[i3 + 1] = (velocities[i3 + 1] + fy) * friction;
        velocities[i3 + 2] = (velocities[i3 + 2] + fz) * friction;

        // Update positions
        posArray[i3] += velocities[i3];
        posArray[i3 + 1] += velocities[i3 + 1];
        posArray[i3 + 2] += velocities[i3 + 2];
      }

      posAttr.needsUpdate = true;

      // Render
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // 6. Handle Resizing
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      bgMaterial.uniforms.uResolution.value.set(w, h);

      // Re-scale the aurora plane to match new aspect ratios
      const vFOV = THREE.MathUtils.degToRad(camera.fov);
      const planeH = 2 * Math.tan(vFOV / 2) * distanceToPlane;
      const planeW = planeH * camera.aspect;
      
      auroraMesh.scale.set(planeW / (planeWidth * 1.5) * 1.5, planeH / (planeHeight * 1.5) * 1.5, 1);
    };

    window.addEventListener('resize', handleResize);

    // 7. Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
      
      // Memory cleanup
      if (renderer && renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      bgGeometry.dispose();
      bgMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#0A0A0A] overflow-hidden"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
