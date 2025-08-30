/**
 * Singularity: AI Takeover - Game Loop System
 * 
 * Manages the main game loop with fixed timestep updates and frame rate management.
 * Handles system registration and update prioritization.
 */

class GameLoop {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;
        this.accumulator = 0;
        this.frameId = null;
        
        // Fixed timestep configuration
        this.fixedTimeStep = 1000 / 60; // 60 FPS target
        this.maxFrameTime = 250; // Cap frame time to prevent spiral of death
        
        // System management
        this.updateSystems = new Map();
        this.updateOrder = [];
        this.systemBudgets = new Map();
        this.lastUpdates = new Map();
        
        // Performance monitoring
        this.frameCount = 0;
        this.fpsHistory = [];
        this.lastFpsUpdate = 0;
        this.currentFps = 60;
        
        console.log('GameLoop initialized');
    }

    /**
     * Register a system to be updated each frame
     * @param {string} name - System name
     * @param {Function} updateFunction - Function to call each update
     * @param {number} priority - Update priority (lower = earlier)
     * @param {number} budget - Time budget in milliseconds
     */
    registerSystem(name, updateFunction, priority = 50, budget = 2) {
        if (typeof updateFunction !== 'function') {
            console.error(`GameLoop: Invalid update function for system '${name}'`);
            return;
        }

        this.updateSystems.set(name, {
            update: updateFunction,
            priority: priority,
            enabled: true,
            lastUpdateTime: 0,
            averageUpdateTime: 0,
            updateCount: 0
        });

        this.systemBudgets.set(name, budget);
        this.lastUpdates.set(name, 0);

        // Rebuild update order based on priorities
        this.updateOrder = Array.from(this.updateSystems.keys())
            .sort((a, b) => this.updateSystems.get(a).priority - this.updateSystems.get(b).priority);
        
        console.debug(`GameLoop: Registered system '${name}'`, {
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
        
        console.debug(`GameLoop: Unregistered system '${name}'`);
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
            console.debug(`GameLoop: System '${name}' ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) {
            console.warn('GameLoop: Already running');
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
        
        console.log('GameLoop: Started');
        if (window.eventBus) {
            window.eventBus.emit(EventTypes.GAME_STARTED);
        }
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
        
        console.log('GameLoop: Stopped');
        if (window.eventBus) {
            window.eventBus.emit(EventTypes.GAME_STOPPED);
        }
    }

    /**
     * Pause the game loop
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        console.log('GameLoop: Paused');
        if (window.eventBus) {
            window.eventBus.emit(EventTypes.GAME_PAUSED);
        }
    }

    /**
     * Resume the game loop
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        this.lastFrameTime = performance.now(); // Reset timing
        this.accumulator = 0;
        
        console.log('GameLoop: Resumed');
        if (window.eventBus) {
            window.eventBus.emit(EventTypes.GAME_RESUMED);
        }
    }

    /**
     * Main loop function
     */
    loop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        let frameTime = currentTime - this.lastFrameTime;
        
        // Cap frame time to prevent spiral of death
        if (frameTime > this.maxFrameTime) {
            frameTime = this.maxFrameTime;
        }
        
        this.lastFrameTime = currentTime;
        this.accumulator += frameTime;
        
        // Fixed timestep updates
        while (this.accumulator >= this.fixedTimeStep) {
            if (!this.isPaused) {
                this.updateSystems(this.fixedTimeStep, currentTime);
            }
            this.accumulator -= this.fixedTimeStep;
        }
        
        // Process event queue
        if (window.eventBus && !this.isPaused) {
            window.eventBus.processQueue();
        }
        
        // Update performance statistics
        this.updatePerformanceStats(currentTime);
        
        // Schedule next frame
        this.frameId = requestAnimationFrame(() => this.loop());
    }

    /**
     * Update all registered systems
     * @param {number} deltaTime - Fixed timestep delta
     * @param {number} currentTime - Current timestamp
     */
    updateSystems(deltaTime, currentTime) {
        for (const systemName of this.updateOrder) {
            const system = this.updateSystems.get(systemName);
            
            if (!system || !system.enabled) {
                continue;
            }
            
            const updateStartTime = performance.now();
            const budget = this.systemBudgets.get(systemName) || 2;
            
            try {
                // Call system update function
                system.update(deltaTime, currentTime);
                
                // Track performance
                const updateTime = performance.now() - updateStartTime;
                this.updateSystemPerformance(systemName, system, updateTime);
                
                // Warn about budget overruns
                if (updateTime > budget) {
                    console.warn(`GameLoop: System '${systemName}' exceeded budget: ${updateTime.toFixed(2)}ms (budget: ${budget}ms)`);
                }
                
                this.lastUpdates.set(systemName, currentTime);
                
            } catch (error) {
                console.error(`GameLoop: Error updating system '${systemName}'`, error);
                
                // Disable problematic system temporarily
                system.enabled = false;
                
                if (window.eventBus) {
                    window.eventBus.emit(EventTypes.SYSTEM_ERROR, {
                        system: systemName,
                        error: error.message
                    });
                }
            }
        }
    }

    /**
     * Update system performance tracking
     * @param {string} systemName - Name of the system
     * @param {object} system - System object
     * @param {number} updateTime - Time taken for update
     */
    updateSystemPerformance(systemName, system, updateTime) {
        system.updateCount++;
        
        // Calculate rolling average
        const alpha = 0.1; // Smoothing factor
        system.averageUpdateTime = system.averageUpdateTime * (1 - alpha) + updateTime * alpha;
        system.lastUpdateTime = updateTime;
    }

    /**
     * Update performance statistics
     * @param {number} currentTime - Current timestamp
     */
    updatePerformanceStats(currentTime) {
        this.frameCount++;
        
        // Update FPS every second
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.currentFps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
            this.fpsHistory.push(this.currentFps);
            
            // Keep only last 60 seconds of FPS data
            if (this.fpsHistory.length > 60) {
                this.fpsHistory.shift();
            }
            
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            
            // Emit performance warnings
            if (this.currentFps < 30 && window.eventBus) {
                window.eventBus.emit(EventTypes.PERFORMANCE_WARNING, {
                    fps: this.currentFps,
                    averageFps: this.getAverageFPS()
                });
            }
        }
    }

    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getCurrentFPS() {
        return this.currentFps;
    }

    /**
     * Get average FPS over recent history
     * @returns {number} Average FPS
     */
    getAverageFPS() {
        if (this.fpsHistory.length === 0) return this.currentFps;
        
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.fpsHistory.length);
    }

    /**
     * Get performance information for all systems
     * @returns {object} Performance data
     */
    getPerformanceInfo() {
        const systemPerformance = {};
        
        this.updateSystems.forEach((system, name) => {
            systemPerformance[name] = {
                enabled: system.enabled,
                priority: system.priority,
                lastUpdateTime: system.lastUpdateTime,
                averageUpdateTime: system.averageUpdateTime,
                updateCount: system.updateCount,
                budget: this.systemBudgets.get(name)
            };
        });
        
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentFps: this.currentFps,
            averageFps: this.getAverageFPS(),
            frameCount: this.frameCount,
            systemCount: this.updateSystems.size,
            systems: systemPerformance
        };
    }

    /**
     * Force update all systems immediately
     */
    forceUpdate() {
        if (!this.isRunning) {
            console.warn('GameLoop: Cannot force update - not running');
            return;
        }
        
        const currentTime = performance.now();
        
        console.debug('GameLoop: Force updating all systems');
        
        for (const systemName of this.updateOrder) {
            const system = this.updateSystems.get(systemName);
            
            if (system && system.enabled) {
                try {
                    system.update(this.fixedTimeStep, currentTime);
                    this.lastUpdates.set(systemName, currentTime);
                } catch (error) {
                    console.error(`GameLoop: Error in forced update of system '${systemName}'`, error);
                }
            }
        }
        
        // Process events
        if (window.eventBus) {
            window.eventBus.processQueue();
        }
    }

    /**
     * Get debug information
     * @returns {object} Debug information
     */
    getDebugInfo() {
        return {
            ...this.getPerformanceInfo(),
            updateOrder: [...this.updateOrder],
            accumulator: this.accumulator,
            fixedTimeStep: this.fixedTimeStep,
            maxFrameTime: this.maxFrameTime,
            lastFrameTime: this.lastFrameTime
        };
    }

    /**
     * Set the target FPS (adjusts fixed timestep)
     * @param {number} targetFps - Target frames per second
     */
    setTargetFPS(targetFps) {
        if (targetFps <= 0 || targetFps > 240) {
            console.error('GameLoop: Invalid target FPS', targetFps);
            return;
        }
        
        this.fixedTimeStep = 1000 / targetFps;
        console.log(`GameLoop: Target FPS set to ${targetFps} (${this.fixedTimeStep.toFixed(2)}ms per frame)`);
    }

    /**
     * Enable or disable performance monitoring
     * @param {boolean} enabled - Whether to enable monitoring
     */
    setPerformanceMonitoring(enabled) {
        if (enabled) {
            this.frameCount = 0;
            this.lastFpsUpdate = performance.now();
            this.fpsHistory = [];
        }
        
        console.log(`GameLoop: Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get system update intervals (for debugging)
     * @returns {object} Update intervals for each system
     */
    getSystemUpdateIntervals() {
        const intervals = {};
        const currentTime = performance.now();
        
        this.lastUpdates.forEach((lastUpdate, systemName) => {
            intervals[systemName] = currentTime - lastUpdate;
        });
        
        return intervals;
    }
}

// Create global game loop instance
const gameLoop = new GameLoop();

// Auto-register with event bus when available
if (typeof eventBus !== 'undefined') {
    eventBus.on(EventTypes.GAME_STARTED, () => {
        console.log('GameLoop: Core game started, systems should register themselves');
    });
}

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameLoop, gameLoop };
}

// Also expose globals for non-module consumers
if (typeof window !== 'undefined') {
    window.gameLoop = gameLoop;
    window.GameLoop = GameLoop;
}