// ui/timelineUI.js - Minimal Timeline UI stub
class TimelineUI {
    constructor() {
        // Wire to global event bus if available
        if (typeof window !== 'undefined' && window.eventBus) {
            this.on = (...args) => window.eventBus.on(...args);
            this.emit = (...args) => window.eventBus.emit(...args);
        }

        this.init();
    }

    init() {
        // Minimal DOM wiring: keep lightweight to avoid runtime errors
        this.container = document.getElementById('timeline-events') || null;

        // Example subscription to update timeline UI when events are recorded
        if (this.on) {
            this.on('timelineEventRecorded', (event) => {
                // no-op if container missing
                if (!this.container) return;
                const el = document.createElement('div');
                el.className = 'timeline-event';
                el.textContent = `${event.type} @ ${new Date(event.timestamp).toLocaleTimeString()}`;
                this.container.prepend(el);
            });
        }
    }
}

// Expose constructor globally
if (typeof window !== 'undefined') {
    window.TimelineUI = TimelineUI;
}
