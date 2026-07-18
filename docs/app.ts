//21NC010　大野翔太
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface TailParticle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    decay: number;
    initialOffset: THREE.Vector3;
}

class ThreeJSContainer {
    private scene!: THREE.Scene;
    private meteor!: THREE.Mesh;
    private light!: THREE.Light;
    private ambientLight!: THREE.AmbientLight;

    private particles: TailParticle[] = [];

    constructor() {}

    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x050510));

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const orbitControls = new OrbitControls(camera, renderer.domElement);

        this.createScene();

        const render: FrameRequestCallback = (_time) => {
            orbitControls.update();
            renderer.render(this.scene, camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    }

    private createScene = () => {
        this.scene = new THREE.Scene();

        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 400;
        const starPositions = new Float32Array(starsCount * 3);
        for(let i = 0; i < starsCount * 3; i++) {
            starPositions[i] = (Math.random() - 0.5) * 100;
        }
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 });
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);


        const meteorGeometry = new THREE.DodecahedronGeometry(0.5, 2);

        const meteorMaterial = new THREE.MeshStandardMaterial({
            color: 0x554433,
            emissive: 0xff3300, 
            emissiveIntensity: 0.6, 
            roughness: 0.9,
            flatShading: true,
            side: THREE.DoubleSide
        });
        this.meteor = new THREE.Mesh(meteorGeometry, meteorMaterial);
        this.meteor.rotation.set(0, 0, -Math.PI / 4);
        this.scene.add(this.meteor);


        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);

        this.light = new THREE.DirectionalLight(0xffffff, 2.5);
        this.light.position.set(1, 1, 2).normalize();
        this.scene.add(this.light);

        const fireLight = new THREE.PointLight(0xff3300, 3.0, 5);
        fireLight.position.set(0, 0, 0);
        this.scene.add(fireLight);


        const particleGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        
        const particleMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        const streamDirection = new THREE.Vector3(-0.08, 0.08, 0);

        const update: FrameRequestCallback = (_time) => {
            this.meteor.rotateY(0.015);
            this.meteor.rotateZ(0.008);

            for (let i = 0; i < 4; i++) {
                const mesh = new THREE.Mesh(particleGeometry, particleMat.clone() as THREE.Material);
                
                mesh.position.copy(this.meteor.position);
                
                const initialOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.6
                );
                mesh.position.add(initialOffset);

                this.scene.add(mesh);

                this.particles.push({
                    mesh: mesh,
                    velocity: streamDirection.clone(),
                    life: 1.0,
                    decay: Math.random() * 0.01 + 0.012,
                    initialOffset: initialOffset
                });
            }


            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                p.mesh.position.add(p.velocity);
                p.life -= p.decay;

                const progress = 1.0 - p.life; 
                const m = p.mesh.material as THREE.MeshBasicMaterial;

                const r = 1.0;
                const g = Math.min(progress * 1.3, 1.0); 
                const b = Math.max(0.0, (progress - 0.7) * 0.3); 
                m.color.setRGB(r, g, b);

                m.opacity = p.life * 0.9;

                const convergenceFactor = p.life; 
                
                p.mesh.position.sub(p.initialOffset); 
                p.initialOffset.multiplyScalar(convergenceFactor); 
                p.mesh.position.add(p.initialOffset);
                
                p.mesh.scale.setScalar(p.life * 1.5);

                if (p.life <= 0) {
                    this.scene.remove(p.mesh);
                    p.mesh.geometry.dispose();
                    (p.mesh.material as THREE.Material).dispose();
                    this.particles.splice(i, 1);
                }
            }

            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();
    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 6));
    document.body.appendChild(viewport);
}