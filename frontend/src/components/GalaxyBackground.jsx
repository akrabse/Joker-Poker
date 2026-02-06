import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export default function GalaxyBackground() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // --- Scene Setup ---
        const scene = new THREE.Scene();
        // Fog removed for deepest dark contrast

        const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 8, 28);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000); // Deepest dark constant
        // Explicitly set sRGB to match user preference/config in HTML
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mountRef.current.appendChild(renderer.domElement);

        // --- Starfield Generation ---
        function createStarfield() {
            const count = 10000; // Reduced density for a more natural night sky
            const positions = [];
            const colors = [];
            const sizes = [];
            for (let i = 0; i < count; i++) {
                const r = THREE.MathUtils.randFloat(50, 150);
                const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
                const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
                positions.push(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );
                const colorChoice = Math.random();
                if (colorChoice < 0.7) {
                    colors.push(1, 1, 1); // White
                } else if (colorChoice < 0.85) {
                    colors.push(0.7, 0.8, 1); // Blueish
                } else {
                    colors.push(1, 0.9, 0.8); // Warm
                }
                // Smaller stars for a more realistic distant look
                sizes.push(THREE.MathUtils.randFloat(0.1, 0.25));
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 }
                },
                vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float uTime;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    // Twinkle removed for safety - constant stable size
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
                fragmentShader: `
                varying vec3 vColor;
                void main() {
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    if (dist > 0.5) discard;
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    // Very subtle core brightness for natural look
                    float intensity = 1.0 + 0.3 * (1.0 - smoothstep(0.0, 0.2, dist));
                    gl_FragColor = vec4(vColor * intensity, alpha * 0.8);
                }
            `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            return new THREE.Points(geo, mat);
        }

        const starField = createStarfield();
        scene.add(starField);

        // --- Post-processing (Bloom limited to Stars) ---
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        // Adjusted UnrealBloomPass for targeted glow
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.4, // Substantial reduction for a "slight hint of glow"
            0.1, // Tight radius
            0.1  // Slight threshold to keep it sharp and clean
        );
        composer.addPass(bloomPass);
        composer.addPass(new OutputPass());

        // --- Animation Loop ---
        const clock = new THREE.Clock();
        let animationFrameId;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            // Silky slow rotation
            starField.rotation.y += 0.0001;
            starField.material.uniforms.uTime.value = t;

            composer.render();
        };

        animate();

        // --- Resize Handler ---
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            composer.setSize(width, height);
            bloomPass.resolution.set(width, height);
        };
        window.addEventListener('resize', handleResize);

        // --- Cleanup ---
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);

            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            starField.geometry.dispose();
            starField.material.dispose();
            composer.dispose();
        };
    }, []);

    return <div ref={mountRef} className="fixed inset-0 z-0 bg-[#000000]" />;
}
