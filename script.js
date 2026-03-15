// --- Custom WebXR Image Tracking Component for Quest 3S ---
AFRAME.registerComponent('webxr-image-tracker', {
    init: function () {
        this.el.sceneEl.addEventListener('enter-vr', () => {
            this.isWebXR = this.el.sceneEl.is('vr-mode') || this.el.sceneEl.is('ar-mode');
            this.targetEntity = document.getElementById('webxr-image-target');

            const session = this.el.sceneEl.renderer.xr.getSession();
            if (session) {
                console.log("WebXR Session active. Checking for experimental Image Tracking API...");
            }
        });

        this.el.sceneEl.addEventListener('exit-vr', () => {
            this.isWebXR = false;
            if (this.targetEntity) this.targetEntity.setAttribute('visible', 'false');
        });
    },
    tick: function () {
        if (!this.isWebXR || !this.targetEntity) return;

        const frame = this.el.sceneEl.frame;
        if (!frame) return;

        if (typeof frame.getImageTrackingResults === 'function') {
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

// --- Main Application Logic ---
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
    const xrControls = document.getElementById('xr-controls');

    // UI Elements
    const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
    const mobileBtnLabel = document.getElementById('mobile-btn-label');
    const btnColorBg = document.getElementById('btn-color-bg');

    const xrToggleBtn = document.getElementById('xr-main-btn');
    const xrContent = document.getElementById('xr-content');
    const questHUD = document.getElementById('quest-spatial-hud');
    const qStatusText = document.getElementById('q-status-text');

    // Mobile Status Indicators
    const mStatusDot = document.getElementById('m-status-dot');
    const mStatusLabel = document.getElementById('m-status-label');

    // Metrics
    const mPlastic = document.getElementById('m-plastic');
    const mEnergy = document.getElementById('m-energy');
    const btnMeshes = document.querySelectorAll('.btn-mesh');
    const btnLabels = document.querySelectorAll('.btn-label');

    // --- Device Detection ---
    const isQuest = /oculus/i.test(navigator.userAgent) || /quest/i.test(navigator.userAgent);

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
            if (mPlastic) mPlastic.innerText = state.plastic.toLocaleString();
        }
        if (state.energy < state.targetEnergy) {
            state.energy += Math.ceil((state.targetEnergy - state.energy) * 0.1);
            if (mEnergy) mEnergy.innerText = state.energy.toLocaleString();
        }
        requestAnimationFrame(updateRollingMetrics);
    }

    // --- Visibility Orchestration ---
    function syncEnvironment() {
        const isClean = state.mode === 'clean-layer';

        document.querySelectorAll('.ad-poc-content').forEach(el => el.setAttribute('visible', !isClean));
        document.querySelectorAll('.clean-layer-content').forEach(el => el.setAttribute('visible', isClean));

        if (isClean) {
            if (mobileStats) mobileStats.classList.remove('opacity-0');
            if (mobileBtnLabel) mobileBtnLabel.innerText = "Revert System";
            if (btnColorBg) {
                btnColorBg.style.backgroundColor = "#00e5ff";
                if (mobileToggleBtn) mobileToggleBtn.style.boxShadow = "0 0 30px rgba(0, 229, 255, 0.4)";
            }

            btnLabels.forEach(el => el.setAttribute('value', 'REVERT SYSTEM'));
            btnMeshes.forEach(el => el.setAttribute('color', '#00e5ff'));
        } else {
            if (mobileStats) mobileStats.classList.add('opacity-0');
            if (mobileBtnLabel) mobileBtnLabel.innerText = "Purge Noise";
            if (btnColorBg) {
                btnColorBg.style.backgroundColor = "#ff0044";
                if (mobileToggleBtn) mobileToggleBtn.style.boxShadow = "0 0 30px rgba(255, 0, 68, 0.4)";
            }

            btnLabels.forEach(el => el.setAttribute('value', 'PURGE NOISE'));
            btnMeshes.forEach(el => el.setAttribute('color', '#ff0044'));
        }

        if (state.isXR && questHUD && qStatusText) {
            qStatusText.setAttribute('value', isClean ? 'CLEAN LAYER ACTIVE' : 'AD-POCALYPSE ACTIVE');
            qStatusText.setAttribute('color', isClean ? '#00e5ff' : '#ff0044');
        }
    }

    window.app = {
        toggleMode: function () {
            if (!audioCtx) initAudio();

            if (state.mode === 'ad-pocalypse') {
                state.mode = 'clean-layer';

                clearTimeout(voiceTimer);
                speechSynthesis.cancel();
                droneGain.gain.setTargetAtTime(0.25, audioCtx.currentTime, 1.2);

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
    };

    function suppressArJsVideo() {
        if (isQuest) {
            const video = document.querySelector('video');
            if (video) {
                video.style.display = 'none';
                video.style.opacity = '0';
            }
        }
    }

    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio();
        if (initOverlay) initOverlay.classList.add('opacity-0');

        setTimeout(() => {
            if (initOverlay) initOverlay.style.display = 'none';

            if (isQuest) {
                if (mStatusDot) {
                    mStatusDot.classList.remove('bg-red-500');
                    mStatusDot.classList.add('bg-green-500');
                }
                if (mStatusLabel) {
                    mStatusLabel.innerText = "System Integrated";
                    mStatusLabel.classList.add('text-cyan-400');
                }
                suppressArJsVideo();
            } else {
                if (mStatusLabel) mStatusLabel.innerText = "Scanning Environment...";
            }

            syncEnvironment();
            playAdVoice();
            updateRollingMetrics();
        }, 1000);
    });

    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', window.app.toggleMode);
    if (xrToggleBtn) xrToggleBtn.addEventListener('click', window.app.toggleMode);

    scene.addEventListener('enter-vr', () => {
        state.isXR = true;
        if (mobileUI) mobileUI.classList.add('opacity-0');
        if (xrContent) xrContent.setAttribute('visible', 'true');
        if (xrControls) xrControls.setAttribute('visible', 'true');
        if (questHUD) questHUD.setAttribute('visible', 'true');

        syncEnvironment();
        if (isQuest) suppressArJsVideo();
    });

    scene.addEventListener('exit-vr', () => {
        state.isXR = false;
        if (mobileUI) mobileUI.classList.remove('opacity-0');
        if (xrContent) xrContent.setAttribute('visible', 'false');
        if (xrControls) xrControls.setAttribute('visible', 'false');
        if (questHUD) questHUD.setAttribute('visible', 'false');
    });

    scene.addEventListener('ar-hit-test-select', (e) => {
        if (!state.isXR) return;

        const pos = e.detail.position;
        const rot = e.detail.rotation;

        const newAd = document.createElement('a-entity');
        newAd.setAttribute('position', pos);
        newAd.setAttribute('rotation', rot);
        newAd.classList.add(state.mode === 'ad-pocalypse' ? 'ad-poc-content' : 'clean-layer-content');

        const templateSelector = state.mode === 'ad-pocalypse'
            ? '#webxr-image-target .ad-poc-content'
            : '#webxr-image-target .clean-layer-content';

        const template = document.querySelector(templateSelector);
        if (template) {
            newAd.appendChild(template.cloneNode(true));
            scene.appendChild(newAd);
        }

        if (audioCtx) {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.connect(g);
            g.connect(audioCtx.destination);
            osc.frequency.value = 880;
            g.gain.setValueAtTime(0.1, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        }
    });

    const marker = document.getElementById('hiro-marker');
    if (marker) {
        marker.addEventListener('markerFound', () => {
            if (!state.isXR && mStatusDot && mStatusLabel) {
                mStatusDot.classList.remove('bg-red-500');
                mStatusDot.classList.add('bg-green-500');
                mStatusLabel.innerText = "Target Synthesized";
                mStatusLabel.classList.add('text-cyan-400');
                syncEnvironment();
            }
        });

        marker.addEventListener('markerLost', () => {
            if (!state.isXR && mStatusDot && mStatusLabel) {
                mStatusDot.classList.remove('bg-green-500');
                mStatusDot.classList.add('bg-red-500');
                mStatusLabel.innerText = "Scanning Environment...";
                mStatusLabel.classList.remove('text-cyan-400');
            }
        });
    }

    window.addEventListener('beforeunload', () => speechSynthesis.cancel());

    // --- Force AR.js Fullscreen Recalibration ---
    // Fires a fake resize event to force AR.js to recalculate the canvas against our new CSS
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 500);
    });
});