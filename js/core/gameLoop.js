/**
 * Singularity: AI Takeover - Game Loop System
 * 
 * Main game loop that coordinates all system updates, manages timing,
 * and handles performance optimization.
 */

class GameLoop {
    constructor() {
        // Loop state
        this.isRunning = false;
        this.isPaused = false;
        this.frameId = null;
        
        // Timing
        this.lastFrameTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1000 / 60; // 60 FPS fixed timestep
        this.maxFrameTime = 250; // Maximum frame time to prevent spiral of death
        
        // Performance tracking
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = 0;
        this.averageFrameTime = 0;
        this.frameTimes = [];
        this.maxFrameTimeHistory = 60;
        
        // System update order and timing
        this.updateSystems = new Map();
        this.updateOrder = [];
        this.systemTimings = new Map();
        
        // Update intervals for different systems
        this.updateIntervals = {
            resources: 16, // ~60 FPS
            heat: 100, // ~10 FPS
            expansion: 500, // ~2 FPS
            events: 1000, // ~1 FPS
            ui: 50, // ~20 FPS
            save: 30000 // Every 30 seconds
        };
        
        this.lastUpdates = new Map();
        
        // Performance budget
        this.frameTimeBudget = 16; // Target 16ms per frame (60 FPS)
        this.systemBudgets = new Map();
        
        Utils.Debug.log('INFO', 'GameLoop initialized');
    }

    /**
     * Register a system for updates
     * @param {string} name - System name
     * @param {Function} updateFunction - Function to call each frame
     * @param {number} priority - Update priority (lower numbers update first)
     * @param {number} budget - Time budget in milliseconds
     */
    registerSystem(name, updateFunction, priority = 100, budget = 2) {
        this.updateSystems.set(name, {
            update: updateFunction,
            priority,
            budget,
            enabled: true,
            lastExecutionTime: 0,
            averageExecutionTime: 0,
            executionHistory: []
        });
        
        this.systemBudgets.set(name, budget);
        this.lastUpdates.set(name, 0);
        
        // Resort update order
        this.updateOrder = Array.from(this.updateSystems.keys())
            .sort((a, b) => this.updateSystems.get(a).priority - this.updateSystems.get(b).priority);
        
        Utils.Debug.log('DEBUG', `GameLoop: Registered system '${name}'`, {
            priority, budget
        });
    }

    /**
     * Unregister a system
     * @param {string} name - System name
     */
    unregisterSystem(name) {
        this.updateSystems.delete(name);
        this.systemBudgets.delete(name);
        this.lastUpdates.delete(name);
        this.updateOrder = this.updateOrder.filter(systemName => systemName !== name);
        
        Utils.Debug.log('DEBUG', `GameLoop: Unregistered system '${name}'`);
    }

    /**
     * Enable or disable a system
     * @param {string} name - System name
     * @param {boolean} enabled - Whether system should be enabled
     */
    setSystemEnabled(name, enabled) {
        const system = this.updateSystems.get(name);
        if (system) {
            system.enabled = enabled;
            Utils.Debug.log('DEBUG', `GameLoop: System '${name}' ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) {
            Utils.Debug.log('WARN', 'GameLoop: Already running');
            return;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.accumulator = 0;
        
        // Initialize last update times
        const currentTime = this.lastFrameTime;
        for (const systemName of this.updateOrder) {
            this.lastUpdates.set(systemName, currentTime);
        }
        
        this.loop();
        
        Utils.Debug.log('INFO', 'GameLoop: Started');
        eventBus.emit(EventTypes.GAME_STARTED);
    }

    /**
     * Stop the game loop
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        
        Utils.Debug.log('INFO', 'GameLoop: Stopped');
    }

    /**
     * Pause the game loop
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        Utils.Debug.log('INFO', 'GameLoop: Paused');
        eventBus.emit(EventTypes.GAME_PAUSED);
    }

    /**
     * Resume the game loop
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        this.lastFrameTime = performance.now(); // Reset timing
        this.accumulator = 0;
        
        Utils.Debug.log('INFO', 'GameLoop: Resumed');
        eventBus.emit(EventTypes.GAME_RESUMED);
    }

    /**
     * Main loop function
     */
    loop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        let frameTime = currentTime - this.lastFrameTime;
        
        // Prevent spiral of death
        if (frameTime > this.maxFrameTime) {
            frameTime = this.maxFrameTime;
        }
        
        this.lastFrameTime = currentTime;
        
        if (!this.isPaused) {
            // Update performance stats
            this.updatePerformanceStats(currentTime, frameTime);
            
            // Fixed timestep with accumulator
            this.accumulator += frameTime;
            
            let updateCount = 0;
            const maxUpdates = 5; // Prevent too many updates per frame
            
            while (this.accumulator >= this.fixedTimeStep && updateCount < maxUpdates) {
                this.updateSystems(this.fixedTimeStep, currentTime);
                this.accumulator -= this.fixedTimeStep;
                updateCount++;
            }
            
            // Process event queue
            eventBus.processQueue();
            
            // Variable timestep updates for rendering/UI
            this.updateVariableTimestepSystems(frameTime, currentTime);
        }
        
        // Schedule next frame
        this.frameId = requestAnimationFrame(() => this.loop());
    }

    /**
     * Update systems that use fixed timestep
     * @param {number} deltaTime - Fixed delta time
     * @param {number} currentTime - Current timestamp
     */
    updateSystems(deltaTime, currentTime) {
        Utils.Debug.performance.start('GameLoop.updateSystems');
        
        let totalSystemTime = 0;
        
        for (const systemName of this.updateOrder) {
            const system = this.updateSystems.get(systemName);
            
            if (!system || !system.enabled) continue;
            
            // Check if system should update based on interval
            const interval = this.updateIntervals[systemName] || 16;
            const lastUpdate = this.lastUpdates.get(systemName);
            
            if (currentTime - lastUpdate < interval) continue;
            
            // Track execution time
            const systemStartTime = performance.now();
            
            try {
                // Call system update
                system.update(deltaTime, currentTime);
                this.lastUpdates.set(systemName, currentTime);
                
            } catch (error) {
                Utils.Debug.log('ERROR', `GameLoop: Error in system '${systemName}'`, {
                    error: error.message,
                    stack: error.stack
                });
                
                // Disable problematic system
                system.enabled = false;
            }
            
            const systemEndTime = performance.now();
            const systemExecutionTime = systemEndTime - systemStartTime;
            
            // Update system performance tracking
            this.updateSystemPerformance(systemName, systemExecutionTime);
            
            totalSystemTime += systemExecutionTime;
            
            // Check if we're over budget
            if (totalSystemTime > this.frameTimeBudget * 0.8) {
                Utils.Debug.log('WARN', 'GameLoop: Frame budget exceeded, breaking system updates', {
                    totalTime: totalSystemTime,
                    budget: this.frameTimeBudget
                });
                break;
            }
        }
        
        Utils.Debug.performance.end('GameLoop.updateSystems');
    }

    /**
     * Update systems that use variable timestep (UI, effects, etc.)
     * @param {number} deltaTime - Variable delta time
     * @param {number} currentTime - Current timestamp
     */
    updateVariableTimestepSystems(deltaTime, currentTime) {
        // UI updates don't need fixed timestep
        const lastUIUpdate = this.lastUpdates.get('ui') || 0;
        if (currentTime - lastUIUpdate >= this.updateIntervals.ui) {
            eventBus.emit('ui:update_request', { deltaTime, currentTime });
            this.lastUpdates.set('ui', currentTime);
        }
    }

    /**
     * Update system performance tracking
     * @param {string} systemName - System name
     * @param {number} executionTime - Execution time in milliseconds
     */
    updateSystemPerformance(systemName, executionTime) {
        const system = this.updateSystems.get(systemName);
        if (!system) return;
        
        // Add to history
        system.executionHistory.push(executionTime);
        if (system.executionHistory.length > 60) {
            system.executionHistory.shift();
        }
        
        // Calculate average
        const avg = system.executionHistory.reduce((sum, time) => sum + time, 0) / system.executionHistory.length;
        system.averageExecutionTime = avg;
        system.lastExecutionTime = executionTime;
        
        // Warn if system is consistently over budget
        if (avg > system.budget && system.executionHistory.length >= 10) {
            Utils.Debug.log('WARN', `GameLoop: System '${systemName}' over budget`, {
                averageTime: avg.toFixed(2),
                budget: system.budget,
                lastTime: executionTime.toFixed(2)
            });
        }
    }

    /**
     * Update performance statistics
     * @param {number} currentTime - Current timestamp
     * @param {number} frameTime - Frame time in milliseconds
     */
    updatePerformanceStats(currentTime, frameTime) {
        this.frameCount++;
        this.frameTimes.push(frameTime);
        
        if (this.frameTimes.length > this.maxFrameTimeHistory) {
            this.frameTimes.shift();
        }
        
        // Calculate average frame time
        this.averageFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
        
        // Update FPS every second
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            
            if (GameConfig.DEBUG.SHOW_FPS) {
                Utils.Debug.log('DEBUG', `GameLoop: FPS: ${this.fps}, Avg Frame Time: ${this.averageFrameTime.toFixed(2)}ms`);
            }
            
            // Emit performance stats
            eventBus.emit('performance:stats_updated', {
                fps: this.fps,
                averageFrameTime: this.averageFrameTime,
                systemTimings: this.getSystemTimings()
            });
        }
    }

    /**
     * Get system timing information
     * @returns {object} System timing data
     */
    getSystemTimings() {
        const timings = {};
        
        for (const [systemName, system] of this.updateSystems) {
            timings[systemName] = {
                lastExecutionTime: system.lastExecutionTime,
                averageExecutionTime: system.averageExecutionTime,
                budget: system.budget,
                enabled: system.enabled,
                overBudget: system.averageExecutionTime > system.budget
            };
        }
        
        return timings;
    }

    /**
     * Get performance information
     * @returns {object} Performance data
     */
    getPerformanceInfo() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            fps: this.fps,
            averageFrameTime: this.averageFrameTime,
            frameTimeBudget: this.frameTimeBudget,
            systemCount: this.updateSystems.size,
            enabledSystemCount: Array.from(this.updateSystems.values())
                .filter(system => system.enabled).length,
            frameTimes: [...this.frameTimes],
            systemTimings: this.getSystemTimings()
        };
    }

    /**
     * Set frame time budget
     * @param {number} budget - Target frame time in milliseconds
     */
    setFrameTimeBudget(budget) {
        this.frameTimeBudget = budget;
        Utils.Debug.log('INFO', `GameLoop: Frame time budget set to ${budget}ms`);
    }

    /**
     * Set system update interval
     * @param {string} systemName - System name
     * @param {number} interval - Update interval in milliseconds
     */
    setSystemUpdateInterval(systemName, interval) {
        this.updateIntervals[systemName] = interval;
        Utils.Debug.log('DEBUG', `GameLoop: System '${systemName}' update interval set to ${interval}ms`);
    }

    /**
     * Force update all systems immediately
     */
    forceUpdate() {
        const currentTime = performance.now();
        
        Utils.Debug.log('DEBUG', 'GameLoop: Force updating all systems');
        
        for (const systemName of this.updateOrder) {
            const system = this.updateSystems.get(systemName);
            
            if (system && system.enabled) {
                try {
                    system.update(this.fixedTimeStep, currentTime);
                    this.lastUpdates.set(systemName, currentTime);
                } catch (error) {
                    Utils.Debug.log('ERROR', `GameLoop: Error in forced update of system '${systemName}'`, error);
                }
            }
        }
        
        // Process events
        eventBus.processQueue();
    }

    /**
     * Get debug information
     * @returns {object} Debug information
     */
    getDebugInfo() {
        return {
            ...this.getPerformanceInfo(),
            updateOrder: [...this.updateOrder],
            updateIntervals: { ...this.updateIntervals },
            accumulator: this.accumulator,
            fixedTimeStep: this.fixedTimeStep,
            maxFrameTime: this.maxFrameTime
        };
    }
}

// Create global game loop instance
const gameLoop = new GameLoop();

// Auto-register core systems when they're available
eventBus.on(EventTypes.GAME_STARTED, () => {
    // These will be registered by their respective system modules
    Utils.Debug.log('INFO', 'GameLoop: Core game started, systems should register themselves');
});

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameLoop, gameLoop };
}