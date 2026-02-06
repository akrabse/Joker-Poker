import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function GalaxyBackground() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // --- Scene Setup ---
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.002);

        const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 8, 28);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000);
        mountRef.current.appendChild(renderer.domElement);

        // --- Starfield Generation ---
        function createStarfield() {
            const count = 8000;
            const positions = [];
            const colors = [];
            const sizes = [];
            for (let i = 0; i < count; i++) {
                const r = THREE.MathUtils.randFloat(50, 150);
                const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
                const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
                positions.push(
                    r * Math.sin(phi) * Math.cos(theta), // x
                    r * Math.sin(phi) * Math.sin(theta), // y
                    r * Math.cos(phi)                    // z
                );
                const colorChoice = Math.random();
                if (colorChoice < 0.7) {
                    colors.push(1, 1, 1);
                } else if (colorChoice < 0.85) {
                    colors.push(0.7, 0.8, 1);
                } else {
                    colors.push(1, 0.9, 0.8);
                }
                sizes.push(THREE.MathUtils.randFloat(0.1, 0.3));
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
                    // Simple twinkle effect
                    float twinkle = sin(uTime * 2.0 + position.x * 100.0) * 0.3 + 0.7;
                    gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
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
                    gl_FragColor = vec4(vColor, alpha * 0.8);
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

        // --- Animation Loop ---
        const clock = new THREE.Clock();
        let animationFrameId;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            // Rotate starfield
            starField.rotation.y += 0.0002;
            starField.material.uniforms.uTime.value = t;

            // Gentle camera movement
            camera.position.x = Math.sin(t * 0.05) * 2;
            camera.position.y = Math.cos(t * 0.05) * 2 + 8;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        animate();

        // --- Resize Handler ---
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // --- Cleanup ---
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);

            // Dispose Three.js resources
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            starField.geometry.dispose();
            starField.material.dispose();
        };
    }, []);

    return <div ref={mountRef} className="fixed inset-0 z-0 bg-[#050508]" />;
}
