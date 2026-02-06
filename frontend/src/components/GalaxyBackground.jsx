import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function GalaxyBackground() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // --- Scene Setup ---
        const scene = new THREE.Scene();

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
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mountRef.current.appendChild(renderer.domElement);

        // --- Starfield Generation ---
        function createStarfield() {
            const count = 10000;
            const positions = [];
            const colors = [];
            for (let i = 0; i < count; i++) {
                const r = THREE.MathUtils.randFloat(50, 200);
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
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const mat = new THREE.ShaderMaterial({
                vertexShader: `
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    // Fixed sharp size calculation
                    gl_PointSize = (4.0 * (300.0 / -mvPosition.z));
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
                fragmentShader: `
                varying vec3 vColor;
                void main() {
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    // Sharp circular mask, no glow
                    if (dist > 0.45) discard;
                    gl_FragColor = vec4(vColor, 1.0);
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
            starField.rotation.y += 0.0001;
            renderer.render(scene, camera);
        };

        animate();

        // --- Resize Handler ---
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
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
        };
    }, []);

    return <div ref={mountRef} className="fixed inset-0 z-0 bg-[#000000]" />;
}
