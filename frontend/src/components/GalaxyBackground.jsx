/**
 * UITLEG VOOR DOCENT EN LEERLINGEN:
 * Dit bestand bouwt via 'Three.js' (een 3D-bibliotheek) de geanimeerde sterren-achtergrond 
 * die te zien is op het beginscherm. Het creëert een ruimtelijk effect.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function GalaxyBackground() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // --- Scene Setup ---
        // UITLEG: Elke 3D wereld heeft een Scene (het veld), een Camera (ons oogpunt) en een Renderer (de tekenmachine) nodig om te werken.
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 8, 28);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            alpha: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mountRef.current.appendChild(renderer.domElement);

        // --- Starfield Generation ---
        function createStarfield() {
            const count = 12000;
            const positions = [];
            const colors = [];
            const sizes = [];
            for (let i = 0; i < count; i++) {
                const r = THREE.MathUtils.randFloat(40, 240);
                const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
                const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);

                positions.push(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );

                const colorChoice = Math.random();
                if (colorChoice < 0.7) {
                    colors.push(1.0, 1.0, 1.0); // White
                } else if (colorChoice < 0.85) {
                    colors.push(0.8, 0.9, 1.0); // Vibrant Blueish
                } else {
                    colors.push(1.0, 0.95, 0.85); // Warm
                }

                // Varied sizes but no flickering
                const sizeBase = Math.random();
                sizes.push(sizeBase * sizeBase * 0.3 + 0.15);
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

            const mat = new THREE.ShaderMaterial({
                vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (500.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
                fragmentShader: `
                varying vec3 vColor;
                void main() {
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    // Sharp circular dots, no glare/bloom sampling issues
                    if (dist > 0.48) discard;
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

    return <div ref={mountRef} className="fixed inset-0 z-0 bg-black" />;
}
