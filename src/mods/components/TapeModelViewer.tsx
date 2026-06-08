import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface CassetteTape {
  id: number;
  name: string;
  cnName: string;
  description: string;
  cnDescription: string;
  color: string;
  borderColor: string;
  url: string;
  imageUrl?: string;
}

export const CASSETTE_LIST: CassetteTape[] = [
  {
    id: 1,
    name: "The Buzzing Yellow",
    cnName: "黄莹嗡鸣",
    description: "The baseline sound of Level 0 fluorescent hum, pitch-shifted into a hypnotic melodic resonance.",
    cnDescription: "后室生存的本底噪声，将荧光灯的刺耳嗡鸣转化为某种催眠性质的低频旋律。",
    color: "#eab308",
    borderColor: "#ca8a04",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    imageUrl: "https://images.unsplash.com/photo-1627389955611-70c92a5d2e2f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    name: "Found Footage #1997",
    cnName: "DV磁带 #1997",
    description: "Degraded, watery audio retrieved from an abandoned VHS camcorder found resting in a quiet puddle.",
    cnDescription: "提取自一部在积水中浸泡多年的手持DV。背景音夹杂着绝望的呼吸与胶带刮擦声。",
    color: "#6b7280",
    borderColor: "#4b5563",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    imageUrl: "https://images.unsplash.com/photo-1543536448-d209d2d13a1c?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    name: "Noclipped Memories",
    cnName: "切出虚空",
    description: "A nostalgic, melancholic synthesiser loop that sounds like a childhood memory fading into static.",
    cnDescription: "令人悲伤且怀旧的合成器循环音轨。听上去有些像童年家中的旧电视节目，但已支离破碎。",
    color: "#a855f7",
    borderColor: "#9061f9",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    name: "Almond Water Vibe",
    cnName: "杏仁润泽",
    description: "A calming, warm lo-fi beat designed to slow down a wanderer's heart rate and halt auditory hallucinations.",
    cnDescription: "极其温润的Lo-Fi治愈节奏。在饮下一口冰凉杏仁水时、内心涌现的原初安宁。",
    color: "#06b6d4",
    borderColor: "#0891b2",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    imageUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 5,
    name: "The Red Room",
    cnName: "深红预警",
    description: "An ominous, rhythmic heavy pulse wave signifying hazardous spatial shifts and proximity to non-Euclidean exits.",
    cnDescription: "死寂低沉的重工业搏动音。通常在深红走廊的尽头或物理机制崩溃的畸变空间中被监听到。",
    color: "#ef4444",
    borderColor: "#b91c1c",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 6,
    name: "Level Run! (06:14)",
    cnName: "极限奔逃 06:14",
    description: "Heart-pounding drum and bass patterns that capture the sheer panic of running through an endless hallway.",
    cnDescription: "高心率的鼓打贝斯电子节奏。因身后的未知嘶吼逼近，疯狂奔跑时的绝死求生旋律。",
    color: "#b91c1c",
    borderColor: "#7f1d1d",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 7,
    name: "Whispers in Column Four",
    cnName: "柱廊侧语",
    description: "Echoing binaural whispers reciting a sequence of coordinates and survival numbers on a seamless loop.",
    cnDescription: "在昏暗立柱后幽幽响起的双声道低语。不断重复着虚数坐标以及某种绝不可违背的迷失警告。",
    color: "#10b981",
    borderColor: "#059669",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    imageUrl: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 8,
    name: "Smiler's Theme",
    cnName: "笑魇之歌",
    description: "A metallic, beautiful, yet profoundly chilling dark ambient soundscape that seems to grin back at you.",
    cnDescription: "冰冷刺骨又带有莫名神圣感的黑暗环境音。宛如一排在走廊阴暗死角中亮起的荧光白牙齿。",
    color: "#e2e8f0",
    borderColor: "#cbd5e1",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    imageUrl: "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 9,
    name: "Poolroom Echoes",
    cnName: "泳池空响",
    description: "Liquid, immersive delays and clean synth pads reminiscent of tiles, chlorine, and infinite shallow waters.",
    cnDescription: "带有多重水声延时与空灵和弦的湿润环境音。让人联想到大理石建构的无尽水床与白色瓷砖。",
    color: "#3b82f6",
    borderColor: "#2563eb",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    imageUrl: "https://images.unsplash.com/photo-1576016770956-debb63d900ad?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 10,
    name: "Toy Box Level 18",
    cnName: "18层玩具箱",
    description: "A nostalgic tin wind-up music box playing a distorted, out-of-tune lullaby from your forgotten past.",
    cnDescription: "发条铁皮玩具八音盒发出的零落音符，已严重跑调，勾起了一些在潜意识深处早已遗忘的记忆。",
    color: "#ec4899",
    borderColor: "#db2777",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 11,
    name: "The Glitched Grid",
    cnName: "物理网格塌缩",
    description: "Highly unstable modular synth noises with digital pops, voltage sags, and audio corruption artifacts.",
    cnDescription: "高不稳定的模块合成器声响。夹杂着电压骤降、电磁爆音以及由于空间贴图丢失引起的脉冲噪声。",
    color: "#22c55e",
    borderColor: "#16a34a",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    imageUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 12,
    name: "The End of Infinity",
    cnName: "无限之边际",
    description: "A breathtakingly vast guitar pad outro. It sounds like a door opening to the real world, far beyond Level 0.",
    cnDescription: "极具辽阔感的电吉他铺底慢音乐。仿佛在淡黄墙壁的夹角中终于透出了一缕真正的晨曦与出口。",
    color: "#f59e0b",
    borderColor: "#d97706",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
  }
];

interface TapeModelViewerProps {
  color: string;
  name: string;
  imageUrl?: string;
  isZoomed?: boolean;
}

export const TapeModelViewer: React.FC<TapeModelViewerProps> = ({ color, name, imageUrl, isZoomed = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    // 1. Setup Three.js miniature inspector scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a0c');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. High polished lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(2, 4, 3);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xffecc2, 0.8);
    rimLight.position.set(-2, -2, -1);
    scene.add(rimLight);

    const coloredSpot = new THREE.SpotLight(color, 2.5, 8, Math.PI / 4, 0.5, 1);
    coloredSpot.position.set(0, 3, 2);
    scene.add(coloredSpot);

    // 3. Construct 3D Cassette Tape mesh group
    const tapeGroup = new THREE.Group();

    // Custom dark gray or themed material for base
    const themeColor = new THREE.Color(color);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: themeColor,
      roughness: 0.35,
      metalness: 0.45,
    });

    const blackPlasticMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#111115'),
      roughness: 0.6,
      metalness: 0.2,
    });

    let stickerMaterial: THREE.Material;
    if (imageUrl) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = 'anonymous';
      const texture = textureLoader.load(imageUrl);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      stickerMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.6,
        metalness: 0.1,
      });
    } else {
      stickerMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e4e4e7'),
        roughness: 0.8,
        metalness: 0.1,
      });
    }

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1f2937'),
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.7,
    });

    // Main casing
    const casingGeom = new THREE.BoxGeometry(1.4, 0.9, 0.12);
    const casingMesh = new THREE.Mesh(casingGeom, bodyMaterial);
    casingMesh.castShadow = true;
    casingMesh.receiveShadow = true;
    tapeGroup.add(casingMesh);

    // Flat sub-panels or tape head mechanism details on bottom
    const bottomCoverGeom = new THREE.BoxGeometry(1.1, 0.16, 0.13);
    const bottomCoverMesh = new THREE.Mesh(bottomCoverGeom, blackPlasticMat);
    bottomCoverMesh.position.set(0, -0.4, 0);
    tapeGroup.add(bottomCoverMesh);

    // Spindle window sticker
    const stickerGeom = new THREE.BoxGeometry(1.12, 0.6, 0.126);
    const stickerMesh = new THREE.Mesh(stickerGeom, stickerMaterial);
    stickerMesh.position.set(0, 0.08, 0.002);
    tapeGroup.add(stickerMesh);

    // Transparent tape window in central sticker
    const windowGeom = new THREE.BoxGeometry(0.55, 0.24, 0.13);
    const windowMesh = new THREE.Mesh(windowGeom, glassMaterial);
    windowMesh.position.set(0, 0.05, 0.005);
    tapeGroup.add(windowMesh);

    // Tiny dark ribbon coil inside window (simulate wound tape ribbon)
    const reelGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16);
    reelGeom.rotateX(Math.PI / 2);
    const leftReel = new THREE.Mesh(reelGeom, blackPlasticMat);
    leftReel.position.set(-0.25, 0.05, 0.002);
    tapeGroup.add(leftReel);

    const rightReel = new THREE.Mesh(reelGeom, blackPlasticMat);
    rightReel.position.set(0.25, 0.05, 0.002);
    tapeGroup.add(rightReel);

    // Left and Right mechanical spool gears (cylinder holes with star spikes inside)
    const gearGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.14, 8);
    gearGeom.rotateX(Math.PI / 2);
    const leftGear = new THREE.Mesh(gearGeom, blackPlasticMat);
    leftGear.position.set(-0.25, 0.05, 0);
    tapeGroup.add(leftGear);

    const rightGear = new THREE.Mesh(gearGeom, blackPlasticMat);
    rightGear.position.set(0.25, 0.05, 0);
    tapeGroup.add(rightGear);

    scene.add(tapeGroup);

    // Center tape on screen
    tapeGroup.position.set(0, 0, 0);

    // 4. Interaction variables (dragging to rotate)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      tapeGroup.rotation.y += deltaX * 0.008;
      tapeGroup.rotation.x += deltaY * 0.008;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    // Touch support for dragging in mobile dev devices
    const handleTouchStart = (e: TouchEvent) => {
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;

      tapeGroup.rotation.y += deltaX * 0.01;
      tapeGroup.rotation.x += deltaY * 0.01;
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    // Attach listeners
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    // 5. Animation cycle
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);

      // Auto rotation when the user is not dragging
      if (!isDragging) {
        const elapsedTime = clock.getElapsedTime();
        tapeGroup.rotation.y = elapsedTime * 0.55;
        tapeGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.25;
      }

      renderer.render(scene, camera);
    };
    renderLoop();

    // 6. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      
      casingGeom.dispose();
      bottomCoverGeom.dispose();
      stickerGeom.dispose();
      windowGeom.dispose();
      reelGeom.dispose();
      gearGeom.dispose();
      bodyMaterial.dispose();
      blackPlasticMat.dispose();
      stickerMaterial.dispose();
      glassMaterial.dispose();
      renderer.dispose();
    };
  }, [color, name, imageUrl, isZoomed]);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-lg">
      <div ref={mountRef} className="w-full h-full min-h-[220px] bg-neutral-950 flex items-center justify-center border border-zinc-800" />
      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold text-zinc-400 border border-zinc-850 px-2 py-1 rounded leading-none">
        {isZoomed ? "DRAG TO INSPECT CASSETTE IN 3D" : "DRAG TO ROTATE MODEL"}
      </div>
    </div>
  );
};
