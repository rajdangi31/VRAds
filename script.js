// VRads - Premium AR HUD Logic

AFRAME.registerComponent('webxr-image-tracker', {
    init: function () {
        this.el.sceneEl.addEventListener('enter-vr', () => {
            this.isWebXR = this.el.sceneEl.is('vr-mode') || this.el.sceneEl.is('ar-mode');
            this.targetEntity = document.getElementById('webxr-image-target');
        });
        this.el.sceneEl.addEventListener('exit-vr', () => {
            this.isWebXR = false;
            if (this.targetEntity) this.targetEntity.setAttribute('visible', 'false');
        });
    },
    tick: function () {
        if (!this.isWebXR || !this.targetEntity) return;
        const frame = this.el.sceneEl.frame;
        if (frame && typeof frame.getImageTrackingResults === 'function') {
            const results = frame.getImageTrackingResults();
            if (results.length > 0) {
                const result = results[0];
                const pose = frame.getPose(result.imageSpace, this.el.sceneEl.renderer.xr.getReferenceSpace());
                if (pose && result.trackingState === 'tracked') {
                    this.targetEntity.setAttribute('visible', 'true');
                    this.targetEntity.object3D.position.copy(pose.transform.position);
                    this.targetEntity.object3D.quaternion.copy(pose.transform.orientation);
                } else {
                    this.targetEntity.setAttribute('visible', 'false');
                }
            }
        }
    }
});

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
    const mStatusDot = document.getElementById('m-status-dot');
    const mStatusLabel = document.getElementById('m-status-label');
    const mobileBtnLabel = document.getElementById('mobile-btn-label');
    const btnColorBg = document.getElementById('btn-color-bg');
    const qStatusText = document.getElementById('q-status-text');

    const isQuest = /oculus/i.test(navigator.userAgent) || /quest/i.test(navigator.userAgent);

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
        
        const pVal = document.getElementById('m-plastic');
        const eVal = document.getElementById('m-energy');
        if (pVal) pVal.innerText = state.plastic.toLocaleString();
        if (eVal) eVal.innerText = state.energy.toLocaleString();
        
        requestAnimationFrame(updateRollingMetrics);
    }

    function syncEnvironment() {
        const isClean = state.mode === 'clean-layer';
        
        // Scene content toggle
        document.querySelectorAll('.ad-poc-content').forEach(el => el.setAttribute('visible', !isClean));
        document.querySelectorAll('.clean-layer-content').forEach(el => el.setAttribute('visible', isClean));

        // Mobile UI updates
        if (mobileBtnLabel) mobileBtnLabel.innerText = isClean ? "Revert System" : "Purge Noise";
        if (btnColorBg) btnColorBg.style.backgroundColor = isClean ? "#00e5ff" : "#ff0044";
        
        if (mobileStats) {
            if (isClean) mobileStats.classList.remove('opacity-0');
            else mobileStats.classList.add('opacity-0');
        }

        // Quest HUD
        if (state.isXR && qStatusText) {
            qStatusText.setAttribute('value', isClean ? 'CLEAN LAYER ACTIVE' : 'AD-POCALYPSE ACTIVE');
            qStatusText.setAttribute('color', isClean ? '#00e5ff' : '#ff0044');
        }
    }

    window.app = {
        toggleMode: function () {
            if (!audioCtx) initAudio();
            if (state.mode === 'ad-pocalypse') {
                state.mode = 'clean-layer';
                droneGain.gain.setTargetAtTime(0.2, audioCtx.currentTime, 1);
                state.metricsInterval = setInterval(() => {
                    state.targetPlastic += Math.floor(Math.random() * 10) + 5;
                    state.targetEnergy += Math.floor(Math.random() * 20) + 10;
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
            if (mStatusLabel) mStatusLabel.innerText = isQuest ? "System Integrated" : "Scanning Environment...";
            syncEnvironment();
            updateRollingMetrics();
            recalibrateResolution();
        }, 1000);
    });

    document.getElementById('mobile-toggle-btn').addEventListener('click', window.app.toggleMode);

    scene.addEventListener('enter-vr', () => {
        state.isXR = true;
        if (mobileUI) mobileUI.classList.add('opacity-0');
    });

    scene.addEventListener('exit-vr', () => {
        state.isXR = false;
        if (mobileUI) mobileUI.classList.remove('opacity-0');
    });

    function recalibrateResolution() {
        console.log("Forcing AR recalibration...");
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    }

    window.addEventListener('load', recalibrateResolution);
    window.addEventListener('orientationchange', () => setTimeout(recalibrateResolution, 500));
});