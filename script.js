// =============================================
// LÓGICA DE NAVEGAÇÃO - eMola Quiz Flow
// =============================================

const TOTAL_QUESTIONS = 4;

// Helper seguro para disparar eventos do Pixel
function trackEvent(eventName, params) {
    if (typeof fbq !== 'undefined') {
        if (params) {
            fbq('track', eventName, params);
        } else {
            fbq('track', eventName);
        }
    }
}

/**
 * Navega para a próxima tela (dentro do .main-content)
 * e atualiza a barra de progresso.
 */
function goToScreen(nextScreenId, step) {
    // Oculta todos os cards
    document.querySelectorAll('.card').forEach(card => card.classList.add('hidden'));

    // Mostra a tela destino
    const next = document.getElementById(nextScreenId);
    if (next) {
        next.classList.remove('hidden');
        // Re-trigger animação
        next.style.animation = 'none';
        next.offsetHeight;
        next.style.animation = '';
    }

    // ── PIXEL EVENTS ──────────────────────────────────
    if (nextScreenId === 'screen-q1') {
        // Usuário clicou em "Começar" → entrou no funil
        trackEvent('Lead');
    } else if (nextScreenId === 'screen-q2') {
        trackEvent('ViewContent', { content_name: 'Pergunta 2', content_category: 'Quiz' });
    } else if (nextScreenId === 'screen-q3') {
        trackEvent('ViewContent', { content_name: 'Pergunta 3', content_category: 'Quiz' });
    } else if (nextScreenId === 'screen-q4') {
        trackEvent('ViewContent', { content_name: 'Pergunta 4', content_category: 'Quiz' });
    } else if (nextScreenId === 'screen-phone') {
        // Completou todas as perguntas → chegou à etapa final
        trackEvent('ViewContent', { content_name: 'Verificação de Elegibilidade', content_category: 'Quiz Completo' });
    }
    // ──────────────────────────────────────────────────

    // Gerencia a barra de progresso
    const progressWrapper = document.getElementById('progress-wrapper');
    const progressText    = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');
    const progressFill    = document.getElementById('progress-bar-fill');

    if (nextScreenId === 'screen-welcome') {
        progressWrapper.style.display = 'none';
    } else if (nextScreenId === 'screen-phone') {
        // Etapa final: 100%
        progressWrapper.style.display = 'block';
        progressText.textContent = 'Etapa final';
        progressPercent.textContent = '100%';
        progressFill.style.width = '100%';
    } else if (nextScreenId === 'screen-loading' || nextScreenId === 'screen-approved') {
        progressWrapper.style.display = 'none';
    } else {
        // Perguntas 1-4
        const questionNumber = step;
        const percent = Math.round((questionNumber / TOTAL_QUESTIONS) * 100);
        progressWrapper.style.display = 'block';
        progressText.textContent = `Pergunta ${questionNumber} de ${TOTAL_QUESTIONS}`;
        progressPercent.textContent = `${percent}%`;
        progressFill.style.width = `${percent}%`;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Inicia o fluxo de verificação de telefone.
 * Valida o input e avança para o loading.
 */
function startVerification() {
    const input = document.getElementById('phone-input');
    const value = input.value.replace(/\s/g, '');

    if (value.length < 9) {
        input.style.borderColor = '#f44336';
        input.style.outline = '2px solid rgba(244,67,54,0.2)';
        input.focus();
        setTimeout(() => {
            input.style.borderColor = '';
            input.style.outline = '';
        }, 2000);
        return;
    }

    // ── PIXEL: Número submetido → CompleteRegistration
    trackEvent('CompleteRegistration', {
        content_name: 'Verificação eMola',
        status: 'submitted'
    });

    // Avança para loading
    goToScreen('screen-loading', 5);
    runLoadingAnimation();
}

/**
 * Anima os passos da tela de loading, depois avança automaticamente.
 */
function runLoadingAnimation() {
    const steps = [
        { id: 'step-1', delay: 600 },
        { id: 'step-2', delay: 1400 },
        { id: 'step-3', delay: 2400 },
        { id: 'step-4', delay: 3200 },
    ];

    // Reseta os steps
    steps.forEach(s => {
        const el = document.getElementById(s.id);
        el.classList.remove('step-done', 'step-active');
        const icon = el.querySelector('.step-icon');
        icon.textContent = '○';
    });

    // Ativa o primeiro imediatamente
    activateStep('step-1');

    // Agenda os próximos
    let doneCount = 0;
    steps.forEach((s, index) => {
        // Marcar como "feito" o anterior e "ativo" o atual
        setTimeout(() => {
            if (index > 0) {
                completeStep(steps[index - 1].id);
            }
            if (index < steps.length - 1) {
                activateStep(s.id);
            }
        }, s.delay);

        // Completa o último passo
        if (index === steps.length - 1) {
            setTimeout(() => {
                completeStep(s.id);
                // Avança para a tela de aprovação após um pequeno delay
                setTimeout(() => {
                    goToScreen('screen-approved', 6);
                }, 600);
            }, s.delay + 800);
        }
    });
}

function activateStep(id) {
    const el = document.getElementById(id);
    el.classList.remove('step-done');
    el.classList.add('step-active');
    const icon = el.querySelector('.step-icon');
    icon.textContent = '↻';
}

function completeStep(id) {
    const el = document.getElementById(id);
    el.classList.remove('step-active');
    el.classList.add('step-done');
    const icon = el.querySelector('.step-icon');
    icon.textContent = '✓';
}

/**
 * Navega para a página VSL (fora do main card) e inicia o player.
 */
function goToVSL() {
    // ── PIXEL: Usuário chegou ao VSL → InitiateCheckout
    trackEvent('InitiateCheckout', {
        content_name: 'Txuna eMola VSL',
        currency: 'MZN',
        value: 5000
    });

    // Oculta o main content e o footer
    const mainContent = document.getElementById('main-content');
    const mainFooter  = document.getElementById('main-footer');
    const progressWrapper = document.getElementById('progress-wrapper');

    mainContent.classList.add('hidden');
    if (mainFooter) mainFooter.classList.add('hidden');
    if (progressWrapper) progressWrapper.style.display = 'none';

    // Mostra a página VSL
    const vsl = document.getElementById('screen-vsl');
    vsl.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Inicia o player VSL
    initVSLPlayer();
}

// =============================================
// VSL PLAYER LOGIC
// =============================================

const VSL_CTA_TIME = 60; // segundos para desbloquear o CTA
let vslCtaUnlocked = false;
let vslTimerTimeout = null;

function initVSLPlayer() {
    const video = document.getElementById('vsl-video');
    if (!video) return;

    // Garante que o vídeo começa mutado e tenta autoplay
    video.muted = true;
    video.play().catch(() => {});

    // Monitora o tempo de reprodução real do vídeo
    video.addEventListener('timeupdate', vslOnTimeUpdate);

    // Quando o vídeo começa a rodar, ativa fallback por tempo real (60s)
    video.addEventListener('play', () => {
        if (!vslTimerTimeout && !vslCtaUnlocked) {
            const remainingMs = Math.max(0, (VSL_CTA_TIME - video.currentTime) * 1000);
            vslTimerTimeout = setTimeout(vslUnlockCTA, remainingMs);
        }
    });

    // Se o vídeo terminar antes dos 60s, desbloqueia imediatamente
    video.addEventListener('ended', vslUnlockCTA);
}

/**
 * Ativado a cada atualização de tempo do vídeo — revela o CTA aos 60s (1 minuto).
 */
function vslOnTimeUpdate() {
    const video = document.getElementById('vsl-video');
    if (!video || vslCtaUnlocked) return;

    if (video.currentTime >= VSL_CTA_TIME) {
        vslUnlockCTA();
    }
}

/**
 * Desbloqueia e exibe o CTA com animação automática quando a VSL chega ao momento certo.
 */
function vslUnlockCTA() {
    if (vslCtaUnlocked) return;
    vslCtaUnlocked = true;

    if (vslTimerTimeout) {
        clearTimeout(vslTimerTimeout);
        vslTimerTimeout = null;
    }

    const video = document.getElementById('vsl-video');
    if (video) video.removeEventListener('timeupdate', vslOnTimeUpdate);

    const ctaBox = document.getElementById('vsl-cta-box');
    if (ctaBox) {
        ctaBox.classList.remove('hidden');
        ctaBox.style.removeProperty('display');
        ctaBox.style.setProperty('display', 'block', 'important');
        // Scroll suave até o CTA
        setTimeout(() => {
            ctaBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
    }

    // PIXEL: CTA desbloqueado
    trackEvent('ViewContent', { content_name: 'CTA Desbloqueado VSL', content_category: 'VSL' });
}

/**
 * Remove o overlay e ativa o som do vídeo.
 */
function vslUnmute() {
    const video   = document.getElementById('vsl-video');
    const overlay = document.getElementById('vsl-sound-overlay');

    if (video) {
        video.muted = false;
        // Garante que está a reproduzir
        video.play().catch(() => {});
    }

    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Garante que só o welcome está visível
    document.querySelectorAll('.card').forEach(card => card.classList.add('hidden'));
    document.getElementById('screen-welcome').classList.remove('hidden');
    document.getElementById('progress-wrapper').style.display = 'none';
    document.getElementById('screen-vsl').classList.add('hidden');
});
