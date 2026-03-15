// VRads - AR Application Logic

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        mode: 'ad-pocalypse',
        isXR: false,
        plastic: 0,
        energy: 0,
        targetPlastic: 0,
        targetEnergy: 0,
        metricsInterval: null
    };

    const scene = document.querySelector('a-scene');
    const mobileUI = document.getElementById('mobile-ui');
    const mobileStats = document.getElementById('mobile-stats');
    const mStatusLabel = document.getElementById('m-status-label');
    const mobileBtnLabel = document.getElementById('mobile-btn-label');
    const btnColorBg = document.getElementById('btn-color-bg');

    let audioCtx, droneOsc, droneGain;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            droneOsc = audioCtx.createOscillator();
            droneGain = audioCtx.createGain();
            droneOsc.frequency.value = 55;
            droneGain.gain.value = 0;
            droneOsc.connect(droneGain);
            droneGain.connect(audioCtx.destination);
            droneOsc.start();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function updateRollingMetrics() {
        if (state.plastic < state.targetPlastic) state.plastic += Math.ceil((state.targetPlastic - state.plastic) * 0.1);
        if (state.energy < state.targetEnergy) state.energy += Math.ceil((state.targetEnergy - state.energy) * 0.1);
        
        const pElem = document.getElementById('m-plastic');
        const eElem = document.getElementById('m-energy');
        if (pElem) pElem.innerText = state.plastic.toLocaleString();
        if (eElem) eElem.innerText = state.energy.toLocaleString();
        
        requestAnimationFrame(updateRollingMetrics);
    }

    function syncEnvironment() {
        const isClean = state.mode === 'clean-layer';
        document.querySelectorAll('.ad-poc-content').forEach(el => el.setAttribute('visible', !isClean));
        document.querySelectorAll('.clean-layer-content').forEach(el => el.setAttribute('visible', isClean));

        if (mobileBtnLabel) mobileBtnLabel.innerText = isClean ? "Revert System" : "Purge Noise";
        if (btnColorBg) btnColorBg.style.backgroundColor = isClean ? "#00e5ff" : "#ff0044";
        
        if (mobileStats) {
            if (isClean) mobileStats.classList.remove('opacity-0');
            else mobileStats.classList.add('opacity-0');
        }
    }

    window.app = {
        toggleMode: function () {
            if (!audioCtx) initAudio();
            if (state.mode === 'ad-pocalypse') {
                state.mode = 'clean-layer';
                droneGain.gain.setTargetAtTime(0.2, audioCtx.currentTime, 1);
                state.metricsInterval = setInterval(() => {
                    state.targetPlastic += 5;
                    state.targetEnergy += 10;
                }, 1500);
            } else {
                state.mode = 'ad-pocalypse';
                droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
                clearInterval(state.metricsInterval);
            }
            syncEnvironment();
        }
    };

    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio();
        document.getElementById('init-overlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('init-overlay').style.display = 'none';
            if (mStatusLabel) mStatusLabel.innerText = "Scanning Environment...";
            syncEnvironment();
            updateRollingMetrics();
            recalibrateResolution();
        }, 800);
    });

    document.getElementById('mobile-toggle-btn').addEventListener('click', window.app.toggleMode);

    function recalibrateResolution() {
        console.log("Recalibrating AR Viewport...");
        window.dispatchEvent(new Event('resize'));
        
        // Target all video and canvas elements created by AR.js/A-Frame
        const elements = document.querySelectorAll('video, .a-canvas');
        elements.forEach(el => {
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.objectFit = 'cover';
            el.style.position = 'absolute';
            el.style.top = '0';
            el.style.left = '0';
        });
        
        setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    }

    window.addEventListener('load', recalibrateResolution);
    window.addEventListener('orientationchange', () => setTimeout(recalibrateResolution, 500));
});