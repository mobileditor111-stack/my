/**
 * ArachnoBeat: High-Resolution Music Player & 3D Interactive Spider
 * Built by Egeluo AI - 40 Year Veteran Architect
 */

let scene, camera, renderer, spider, legs = [];
let audioCtx, analyser, dataArray, source;
let audio = new Audio();
let isPlaying = false;
let mouse = new THREE.Vector2();
let targetPos = new THREE.Vector3(0, 0, 0);

// --- 3D Scene Setup ---
function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00f2ff, 5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    createSpider();
    animate();
}

function createSpider() {
    spider = new THREE.Group();
    
    // Body - High detail segments
    const bodyGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        roughness: 0.1, 
        metalness: 0.8 
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.set(1, 0.8, 1.2);
    spider.add(body);

    const headGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 0, 0.6);
    spider.add(head);

    // Eyes - Glowing
    const eyeGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    for(let i = -1; i <= 1; i += 2) {
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(i * 0.1, 0.1, 0.85);
        spider.add(eye);
    }

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    for (let i = 0; i < 8; i++) {
        const legGroup = new THREE.Group();
        const angle = (i / 8) * Math.PI * 2;
        
        const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), legMat);
        thigh.position.z = 0.4;
        legGroup.add(thigh);
        
        const shin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1), legMat);
        shin.position.z = 1.2;
        shin.rotation.x = Math.PI / 4;
        legGroup.add(shin);

        legGroup.rotation.y = angle;
        legs.push(legGroup);
        spider.add(legGroup);
    }

    scene.add(spider);
}

// --- Audio Logic ---
const uploadInput = document.getElementById('audio-upload');
const playBtn = document.getElementById('play-pause-btn');
const visualizer = document.getElementById('audio-visualizer');
const vCtx = visualizer.getContext('2d');

uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('song-title').innerText = file.name.replace(/\.[^/.]+$/, "");
    document.getElementById('artist-name').innerText = "Local Track";

    const url = URL.createObjectURL(file);
    audio.src = url;
    setupAudioContext();
    audio.play();
    isPlaying = true;
    playBtn.innerText = "⏸";
});

function setupAudioContext() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

playBtn.onclick = () => {
    if (audio.paused) {
        audio.play();
        playBtn.innerText = "⏸";
        isPlaying = true;
    } else {
        audio.pause();
        playBtn.innerText = "▶";
        isPlaying = false;
    }
};

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Spider follow movement
    spider.position.lerp(targetPos, 0.05);
    spider.rotation.y += (mouse.x * 0.5 - spider.rotation.y) * 0.1;
    spider.rotation.x += (-mouse.y * 0.5 - spider.rotation.x) * 0.1;

    // React to Music
    if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        
        // Get Bass (0-10 frequency bins)
        let bass = 0;
        for(let i=0; i<10; i++) bass += dataArray[i];
        bass = bass / 10;
        
        const scale = 1 + (bass / 255) * 0.5;
        spider.scale.set(scale, scale, scale);

        // Leg "Dance"
        legs.forEach((leg, idx) => {
            const freqValue = dataArray[idx * 5] / 255;
            leg.rotation.z = Math.sin(Date.now() * 0.01 + idx) * freqValue;
            leg.rotation.x = (Math.PI / 4) + (freqValue * 0.5);
        });

        // Draw visualizer UI
        vCtx.clearRect(0, 0, visualizer.width, visualizer.height);
        vCtx.fillStyle = '#00f2ff';
        const barWidth = (visualizer.width / dataArray.length) * 2.5;
        let x = 0;
        for(let i = 0; i < dataArray.length; i++) {
            const barHeight = (dataArray[i] / 255) * visualizer.height;
            vCtx.fillRect(x, visualizer.height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
        }
    }

    // Progress bar
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }

    renderer.render(scene, camera);
}

// --- Interaction ---
window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    targetPos.x = mouse.x * 3;
    targetPos.y = mouse.y * 2;
});

window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    
    targetPos.x = mouse.x * 3;
    targetPos.y = mouse.y * 2;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init3D();