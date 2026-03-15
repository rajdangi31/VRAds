document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        mode: 'ad-pocalypse',
        isXR: false,
        plastic: 0,
        energy: 0,
        metricsInterval: null,
        targetPlastic: 0,
        targetEnergy: 0
    };

    // --- DOM / A-Frame References ---
    const scene = document.querySelector('a-scene');
    const initOverlay = document.getElementById('init-overlay');
    const mobileUI = document.getElementById('mobile-ui');
    const mobileStats = document.getElementById('mobile-stats');
    const xrControls = document.getElementById('xr-controls');
    const worldContent = document.getElementById('world-content');
    const xrContent = document.getElementById('xr-content');
    const questHUD = document.getElementById('quest-spatial-hud');
    const qStatusText = document.getElementById('q-status-text');

    // UI Elements
    const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
    const mobileBtnLabel = document.getElementById('mobile-btn-label');
    const btnColorBg = document.getElementById('btn-color-bg');
    const mStatusDot = document.getElementById('m-status-dot');
    const mStatusLabel = document.getElementById('m-status-label');
    const mPlastic = document.getElementById('m-plastic');
    const mEnergy = document.getElementById('m-energy');

    // --- Device Detection ---
    const isQuest = /oculus/i.test(navigator.userAgent) || /quest/i.test(navigator.userAgent);

    // --- Audio Engine ---
    let audioCtx;
    let droneGain;
    let voiceTimer;
    const adSnips = ["System Link established.", "Visual debt authorized.", "Data harvest in progress.", "Consume the notification."];

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            let droneOsc = audioCtx.createOscillator();
            droneOsc.frequency.value = 55;
            droneGain = audioCtx.createGain();
            droneGain.gain.value = 0;
            droneOsc.connect(droneGain);
            droneGain.connect(audioCtx.destination);
            droneOsc.start();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playAdVoice() {
        if (state.mode !== 'ad-pocalypse') return;
        const utterance = new SpeechSynthesisUtterance(adSnips[Math.floor(Math.random() * adSnips.length)]);
        utterance.rate = 1.1;
        utterance.pitch = 0.7;
        speechSynthesis.speak(utterance);
        voiceTimer = setTimeout(playAdVoice, 5000 + Math.random() * 5000);
    }

    // --- Metrics ---
    function updateRollingMetrics() {
        if (state.plastic < state.targetPlastic) {
            state.plastic += Math.ceil((state.targetPlastic - state.plastic) * 0.1);
            mPlastic.innerText = state.plastic.toLocaleString();
        }
        if (state.energy < state.targetEnergy) {
            state.energy += Math.ceil((state.targetEnergy - state.energy) * 0.1);
            mEnergy.innerText = state.energy.toLocaleString();
        }
        requestAnimationFrame(updateRollingMetrics);
    }

    // --- Visibility Orchestration ---
    function syncEnvironment() {
        const isClean = state.mode === 'clean-layer';

        // 1. Handle Quest World Visibility
        if (worldContent) worldContent.setAttribute('visible', !state.isXR ? 'true' : 'false');
        if (xrContent) xrContent.setAttribute('visible', state.isXR ? 'true' : 'false');

        // 2. Toggle Marker and World Contents
        document.querySelectorAll('.ad-poc-content').forEach(el => el.setAttribute('visible', !isClean));
        document.querySelectorAll('.clean-layer-content').forEach(el => el.setAttribute('visible', isClean));

        // 3. UI Layer Transitions
        if (isClean) {
            mobileStats.classList.remove('opacity-0');
            mobileBtnLabel.innerText = "Revert System";
            btnColorBg.style.backgroundColor = "#00e5ff";
            mobileToggleBtn.style.boxShadow = "0 0 30px rgba(0, 229, 255, 0.4)";
        } else {
            mobileStats.classList.add('opacity-0');
            mobileBtnLabel.innerText = "Purge Noise";
            btnColorBg.style.backgroundColor = "#ff0044";
            mobileToggleBtn.style.boxShadow = "0 0 30px rgba(255, 0, 68, 0.4)";
        }

        if (isQuest && questHUD) {
            qStatusText.setAttribute('value', isClean ? 'CLEAN LAYER ACTIVE' : 'AD-POCALYPSE ACTIVE');
            qStatusText.setAttribute('color', isClean ? '#00e5ff' : '#ff0044');
        }
    }

    function toggleMode() {
        if (!audioCtx) initAudio();

        if (state.mode === 'ad-pocalypse') {
            state.mode = 'clean-layer';
            clearTimeout(voiceTimer);
            speechSynthesis.cancel();
            droneGain.gain.setTargetAtTime(0.2, audioCtx.currentTime, 1);
            state.metricsInterval = setInterval(() => {
                state.targetPlastic += Math.floor(Math.random() * 10) + 2;
                state.targetEnergy += Math.floor(Math.random() * 20) + 5;
            }, 2000);
        } else {
            state.mode = 'ad-pocalypse';
            droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
            playAdVoice();
            clearInterval(state.metricsInterval);
        }
        syncEnvironment();
    }

    // --- Events ---
    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio();
        initOverlay.classList.add('opacity-0');
        setTimeout(() => {
            initOverlay.style.display = 'none';
            if (!isQuest) mStatusLabel.innerText = "Scanning Environment...";
            else {
                mStatusDot.classList.replace('bg-red-500', 'bg-green-500');
                mStatusLabel.innerText = "System Integrated";
            }
            syncEnvironment();
            playAdVoice();
            updateRollingMetrics();
        }, 1000);
    });

    mobileToggleBtn.addEventListener('click', toggleMode);

    scene.addEventListener('enter-vr', () => { state.isXR = true; syncEnvironment(); });
    scene.addEventListener('exit-vr', () => { state.isXR = false; syncEnvironment(); });

    const marker = document.getElementById('hiro-marker');
    if (marker) {
        marker.addEventListener('markerFound', () => {
            mStatusDot.classList.replace('bg-red-500', 'bg-green-500');
            mStatusLabel.innerText = "Target Synthesized";
        });
        marker.addEventListener('markerLost', () => {
            mStatusDot.classList.replace('bg-green-500', 'bg-red-500');
            mStatusLabel.innerText = "Scanning Environment...";
        });
    }
});