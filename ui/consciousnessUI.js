// ui/consciousnessUI.js - Minimal Consciousness UI stub
class ConsciousnessUI {
    constructor() {
        if (typeof window !== 'undefined' && window.eventBus) {
            this.on = (...args) => window.eventBus.on(...args);
            this.emit = (...args) => window.eventBus.emit(...args);
        }

        this.init();
    }

    init() {
        this.container = document.getElementById('consciousness-visualization') || null;

        if (this.on) {
            this.on('consciousnessIntegrated', (data) => {
                if (!this.container) return;
                const el = document.createElement('div');
                el.className = 'consciousness-entry';
                el.textContent = `${data.consciousness.name} integrated`;
                this.container.prepend(el);
            });
        }
    }
}

if (typeof window !== 'undefined') {
    window.ConsciousnessUI = ConsciousnessUI;
}
