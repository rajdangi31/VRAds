document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        mode: 'ad-pocalypse', // 'ad-pocalypse' | 'clean-layer'
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
    const xrContent = document.getElementById('xr-content');
    const xrControls = document.getElementById('xr-controls');
    const worldContent = document.getElementById('world-content');
    
    // Shared Content Elements (Groups)
    const adPocGroups = document.querySelectorAll('.ad-poc-content');
    const cleanGroups = document.querySelectorAll('.clean-layer-content');
    
    // UI Elements
    const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
    const mobileBtnLabel = document.getElementById('mobile-btn-label');
    const btnColorBg = document.getElementById('btn-color-bg');
    
    const xrToggleBtn = document.getElementById('xr-main-btn');
    const xrDataDisplay = document.querySelector('.data-display');
    
    // Metrics
    const mPlastic = document.getElementById('m-plastic');
    const mEnergy = document.getElementById('m-energy');
    const xPlastic = document.querySelector('.metric-plastic');
    const xEnergy = document.querySelector('.metric-energy');
    const btnMeshes = document.querySelectorAll('.btn-mesh');
    const btnLabels = document.querySelectorAll('.btn-label');

    // --- Audio Synthesis Engine ---
    let audioCtx;
    let droneOsc;
    let droneGain;
    let voiceTimer;
    const adSnips = [
        "System Link established.", "Visual debt authorized.", 
        "Data harvest in progress.", "Rent your future today.", 
        "Consume the notification.", "Synthetic reality loading."
    ];

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            droneOsc = audioCtx.createOscillator();
            droneOsc.type = 'sine';
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
        utterance.rate = 1.2;
        utterance.pitch = 0.6;
        speechSynthesis.speak(utterance);
        voiceTimer = setTimeout(playAdVoice, 3000 + Math.random() * 4000);
    }

    // --- Premium Metrics Rolling ---
    function updateRollingMetrics() {
        if (state.plastic < state.targetPlastic) {
            state.plastic += Math.ceil((state.targetPlastic - state.plastic) * 0.1);
            mPlastic.innerText = state.plastic.toLocaleString();
            if (xPlastic) xPlastic.setAttribute('value', `Plastic: ${state.plastic.toLocaleString()}g`);
        }
        if (state.energy < state.targetEnergy) {
            state.energy += Math.ceil((state.targetEnergy - state.energy) * 0.1);
            mEnergy.innerText = state.energy.toLocaleString();
            if (xEnergy) xEnergy.setAttribute('value', `Energy: ${state.energy.toLocaleString()}W`);
        }
        requestAnimationFrame(updateRollingMetrics);
    }

    // --- Visibility Orchestration ---
    function syncEnvironment() {
        const isClean = state.mode === 'clean-layer';
        
        adPocGroups.forEach(el => {
            el.setAttribute('visible', !isClean);
        });

        cleanGroups.forEach(el => el.setAttribute('visible', isClean));

        // UI Layer Transitions
        if (isClean) {
            mobileStats.classList.remove('opacity-0');
            if (xrDataDisplay) xrDataDisplay.setAttribute('visible', 'true');
            
            mobileBtnLabel.innerText = "Revert System";
            btnColorBg.style.backgroundColor = "#00e5ff";
            mobileToggleBtn.style.boxShadow = "0 0 30px rgba(0, 229, 255, 0.4)";
            
            btnLabels.forEach(el => el.setAttribute('value', 'REVERT SYSTEM'));
            btnMeshes.forEach(el => el.setAttribute('color', '#00e5ff'));
        } else {
            mobileStats.classList.add('opacity-0');
            if (xrDataDisplay) xrDataDisplay.setAttribute('visible', 'false');
            
            mobileBtnLabel.innerText = "Purge Noise";
            btnColorBg.style.backgroundColor = "#ff0044";
            mobileToggleBtn.style.boxShadow = "0 0 30px rgba(255, 0, 68, 0.4)";

            btnLabels.forEach(el => el.setAttribute('value', 'PURGE NOISE'));
            btnMeshes.forEach(el => el.setAttribute('color', '#ff0044'));
        }
    }

    function toggleMode() {
        if (!audioCtx) initAudio();

        if (state.mode === 'ad-pocalypse') {
            state.mode = 'clean-layer';
            
            // Audio Shift
            clearTimeout(voiceTimer);
            speechSynthesis.cancel();
            droneGain.gain.setTargetAtTime(0.25, audioCtx.currentTime, 1.2);

            // Start Metrics Cycle
            state.metricsInterval = setInterval(() => {
                state.targetPlastic += Math.floor(Math.random() * 12) + 5;
                state.targetEnergy += Math.floor(Math.random() * 30) + 10;
            }, 1500);

        } else {
            state.mode = 'ad-pocalypse';
            droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
            playAdVoice();
            clearInterval(state.metricsInterval);
        }
        
        syncEnvironment();
    }

    window.app = { toggleMode };

    // --- Event Listeners ---
    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio();
        initOverlay.classList.add('opacity-0');
        setTimeout(() => {
            initOverlay.style.display = 'none';
            // Set initial status to "Linked" for Quest
            const mStatusDot = document.getElementById('m-status-dot');
            const mStatusLabel = document.getElementById('m-status-label');
            if (mStatusDot) {
                mStatusDot.classList.remove('bg-red-500');
                mStatusDot.classList.add('bg-green-500');
            }
            if (mStatusLabel) {
                mStatusLabel.innerText = "System Integrated";
                mStatusLabel.classList.add('text-cyan-400');
            }
            
            syncEnvironment();
            playAdVoice();
            updateRollingMetrics(); // Start animation loop
        }, 1000);
    });

    mobileToggleBtn.addEventListener('click', toggleMode);
    if (xrToggleBtn) xrToggleBtn.addEventListener('click', toggleMode);

    // --- Device Detection ---
    scene.addEventListener('enter-vr', () => {
        state.isXR = true;
        mobileUI.classList.add('opacity-0');
        if (xrContent) xrContent.setAttribute('visible', 'true');
        if (xrControls) xrControls.setAttribute('visible', 'true');
        // Ensure world content is visible in XR
        if (worldContent) worldContent.setAttribute('visible', 'true');
    });

    scene.addEventListener('exit-vr', () => {
        state.isXR = false;
        mobileUI.classList.remove('opacity-0');
        if (xrContent) xrContent.setAttribute('visible', 'false');
        if (xrControls) xrControls.setAttribute('visible', 'false');
    });


    window.addEventListener('beforeunload', () => speechSynthesis.cancel());
});
