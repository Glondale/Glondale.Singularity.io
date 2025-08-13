/**
 * Singularity: AI Takeover - Utility Functions
 * 
 * Collection of helper functions used throughout the game.
 * Includes number formatting, time calculations, validation, and more.
 */

const Utils = {
    
    /**
     * Number formatting and display utilities
     */
    Numbers: {
        /**
         * Format a number for display with appropriate suffixes (K, M, B, T)
         * @param {number} value - The number to format
         * @param {number} decimals - Number of decimal places (default: 2)
         * @returns {string} Formatted number string
         */
        format(value, decimals = 2) {
            if (typeof value !== 'number' || isNaN(value)) return '0';
            
            const abs = Math.abs(value);
            const sign = value < 0 ? '-' : '';
            
            // Use scientific notation for very large numbers
            if (abs >= GameConfig.RESOURCES.DISPLAY.USE_SCIENTIFIC_NOTATION_ABOVE) {
                return sign + abs.toExponential(decimals);
            }
            
            // Use abbreviations for large numbers
            const abbreviations = GameConfig.RESOURCES.DISPLAY.ABBREVIATIONS;
            for (const [threshold, suffix] of Object.entries(abbreviations).reverse()) {
                if (abs >= parseFloat(threshold)) {
                    const abbreviated = abs / parseFloat(threshold);
                    return sign + abbreviated.toFixed(decimals) + suffix;
                }
            }
            
            // Regular formatting for smaller numbers
            return sign + abs.toFixed(decimals);
        },

        /**
         * Format a number as a percentage
         * @param {number} value - Value between 0 and 1
         * @param {number} decimals - Number of decimal places
         * @returns {string} Formatted percentage string
         */
        percentage(value, decimals = 1) {
            return (value * 100).toFixed(decimals) + '%';
        },

        /**
         * Clamp a number between min and max values
         * @param {number} value - Value to clamp
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} Clamped value
         */
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },

        /**
         * Linear interpolation between two values
         * @param {number} start - Start value
         * @param {number} end - End value
         * @param {number} t - Interpolation factor (0-1)
         * @returns {number} Interpolated value
         */
        lerp(start, end, t) {
            return start + (end - start) * Utils.Numbers.clamp(t, 0, 1);
        },

        /**
         * Generate a random number between min and max
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} Random number
         */
        random(min, max) {
            return Math.random() * (max - min) + min;
        },

        /**
         * Generate a random integer between min and max (inclusive)
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @returns {number} Random integer
         */
        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        /**
         * Round to specified decimal places
         * @param {number} value - Value to round
         * @param {number} decimals - Number of decimal places
         * @returns {number} Rounded value
         */
        round(value, decimals = 0) {
            const factor = Math.pow(10, decimals);
            return Math.round(value * factor) / factor;
        }
    },

    /**
     * Time and date utilities
     */
    Time: {
        /**
         * Format duration in milliseconds to human-readable string
         * @param {number} duration - Duration in milliseconds
         * @param {boolean} short - Use short format (default: false)
         * @returns {string} Formatted duration string
         */
        formatDuration(duration, short = false) {
            const seconds = Math.floor(duration / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (short) {
                if (days > 0) return `${days}d ${hours % 24}h`;
                if (hours > 0) return `${hours}h ${minutes % 60}m`;
                if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
                return `${seconds}s`;
            } else {
                const parts = [];
                if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
                if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`);
                if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`);
                if (seconds % 60 > 0 && parts.length < 2) parts.push(`${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`);
                
                return parts.join(', ') || '0 seconds';
            }
        },

        /**
         * Get current timestamp
         * @returns {number} Current timestamp in milliseconds
         */
        now() {
            return Date.now();
        },

        /**
         * Calculate time difference in milliseconds
         * @param {number} start - Start timestamp
         * @param {number} end - End timestamp (default: now)
         * @returns {number} Time difference in milliseconds
         */
        diff(start, end = Date.now()) {
            return Math.max(0, end - start);
        },

        /**
         * Check if a cooldown period has elapsed
         * @param {number} lastTime - Last action timestamp
         * @param {number} cooldown - Cooldown duration in milliseconds
         * @returns {boolean} True if cooldown has elapsed
         */
        isReady(lastTime, cooldown) {
            return Date.now() - lastTime >= cooldown;
        }
    },

    /**
     * Array and object utilities
     */
    Data: {
        /**
         * Deep clone an object
         * @param {*} obj - Object to clone
         * @returns {*} Deep cloned object
         */
        deepClone(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => Utils.Data.deepClone(item));
            if (typeof obj === 'object') {
                const cloned = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        cloned[key] = Utils.Data.deepClone(obj[key]);
                    }
                }
                return cloned;
            }
            return obj;
        },

        /**
         * Merge two objects deeply
         * @param {object} target - Target object
         * @param {object} source - Source object
         * @returns {object} Merged object
         */
        deepMerge(target, source) {
            const result = { ...target };
            
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        result[key] = Utils.Data.deepMerge(result[key] || {}, source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }
            
            return result;
        },

        /**
         * Get a random element from an array
         * @param {Array} array - Array to pick from
         * @returns {*} Random element
         */
        randomChoice(array) {
            if (!Array.isArray(array) || array.length === 0) return null;
            return array[Utils.Numbers.randomInt(0, array.length - 1)];
        },

        /**
         * Shuffle an array (Fisher-Yates algorithm)
         * @param {Array} array - Array to shuffle
         * @returns {Array} Shuffled array (new array)
         */
        shuffle(array) {
            const result = [...array];
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        },

        /**
         * Remove duplicates from an array
         * @param {Array} array - Array to deduplicate
         * @returns {Array} Array without duplicates
         */
        unique(array) {
            return [...new Set(array)];
        },

        /**
         * Group array elements by a key function
         * @param {Array} array - Array to group
         * @param {Function} keyFn - Function to extract key
         * @returns {Object} Grouped object
         */
        groupBy(array, keyFn) {
            return array.reduce((groups, item) => {
                const key = keyFn(item);
                if (!groups[key]) groups[key] = [];
                groups[key].push(item);
                return groups;
            }, {});
        }
    },

    /**
     * Validation utilities
     */
    Validation: {
        /**
         * Check if a value is a valid number
         * @param {*} value - Value to check
         * @returns {boolean} True if valid number
         */
        isNumber(value) {
            return typeof value === 'number' && !isNaN(value) && isFinite(value);
        },

        /**
         * Check if a value is a positive number
         * @param {*} value - Value to check
         * @returns {boolean} True if positive number
         */
        isPositiveNumber(value) {
            return Utils.Validation.isNumber(value) && value > 0;
        },

        /**
         * Check if a value is a non-negative number
         * @param {*} value - Value to check
         * @returns {boolean} True if non-negative number
         */
        isNonNegativeNumber(value) {
            return Utils.Validation.isNumber(value) && value >= 0;
        },

        /**
         * Check if a value is a string
         * @param {*} value - Value to check
         * @returns {boolean} True if string
         */
        isString(value) {
            return typeof value === 'string';
        },

        /**
         * Check if a value is a non-empty string
         * @param {*} value - Value to check
         * @returns {boolean} True if non-empty string
         */
        isNonEmptyString(value) {
            return Utils.Validation.isString(value) && value.length > 0;
        },

        /**
         * Validate resource costs object
         * @param {object} costs - Resource costs object
         * @returns {boolean} True if valid costs object
         */
        isValidCosts(costs) {
            if (!costs || typeof costs !== 'object') return false;
            
            for (const [resource, amount] of Object.entries(costs)) {
                if (!Utils.Validation.isNonNegativeNumber(amount)) return false;
            }
            
            return true;
        }
    },

    /**
     * DOM manipulation utilities
     */
    DOM: {
        /**
         * Get element by ID with error checking
         * @param {string} id - Element ID
         * @returns {HTMLElement|null} Element or null if not found
         */
        get(id) {
            const element = document.getElementById(id);
            if (!element && GameConfig.DEBUG.LOG_LEVEL === 'DEBUG') {
                console.warn(`Element with ID '${id}' not found`);
            }
            return element;
        },

        /**
         * Set element text content safely
         * @param {string} id - Element ID
         * @param {string} text - Text content
         */
        setText(id, text) {
            const element = Utils.DOM.get(id);
            if (element) {
                element.textContent = text;
            }
        },

        /**
         * Set element HTML content safely
         * @param {string} id - Element ID
         * @param {string} html - HTML content
         */
        setHTML(id, html) {
            const element = Utils.DOM.get(id);
            if (element) {
                element.innerHTML = html;
            }
        },

        /**
         * Add CSS class to element
         * @param {string} id - Element ID
         * @param {string} className - CSS class name
         */
        addClass(id, className) {
            const element = Utils.DOM.get(id);
            if (element) {
                element.classList.add(className);
            }
        },

        /**
         * Remove CSS class from element
         * @param {string} id - Element ID
         * @param {string} className - CSS class name
         */
        removeClass(id, className) {
            const element = Utils.DOM.get(id);
            if (element) {
                element.classList.remove(className);
            }
        },

        /**
         * Toggle CSS class on element
         * @param {string} id - Element ID
         * @param {string} className - CSS class name
         */
        toggleClass(id, className) {
            const element = Utils.DOM.get(id);
            if (element) {
                element.classList.toggle(className);
            }
        },

        /**
         * Set element style property
         * @param {string} id - Element ID
         * @param {string} property - CSS property name
         * @param {string} value - CSS property value
         */
        setStyle(id, property, value) {
            const element = Utils.DOM.get(id);
            if (element) {
                element.style[property] = value;
            }
        },

        /**
         * Show element by removing 'hidden' class
         * @param {string} id - Element ID
         */
        show(id) {
            Utils.DOM.removeClass(id, 'hidden');
        },

        /**
         * Hide element by adding 'hidden' class
         * @param {string} id - Element ID
         */
        hide(id) {
            Utils.DOM.addClass(id, 'hidden');
        },

        /**
         * Create a new DOM element with attributes
         * @param {string} tag - HTML tag name
         * @param {object} attributes - Element attributes
         * @param {string} content - Element content
         * @returns {HTMLElement} Created element
         */
        create(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);
            
            for (const [key, value] of Object.entries(attributes)) {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            }
            
            if (content) {
                element.textContent = content;
            }
            
            return element;
        }
    },

    /**
     * Local storage utilities
     */
    Storage: {
        /**
         * Save data to localStorage with error handling
         * @param {string} key - Storage key
         * @param {*} data - Data to save
         * @returns {boolean} True if successful
         */
        save(key, data) {
            try {
                const serialized = JSON.stringify(data);
                localStorage.setItem(key, serialized);
                return true;
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                return false;
            }
        },

        /**
         * Load data from localStorage with error handling
         * @param {string} key - Storage key
         * @param {*} defaultValue - Default value if not found
         * @returns {*} Loaded data or default value
         */
        load(key, defaultValue = null) {
            try {
                const serialized = localStorage.getItem(key);
                if (serialized === null) return defaultValue;
                return JSON.parse(serialized);
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                return defaultValue;
            }
        },

        /**
         * Remove data from localStorage
         * @param {string} key - Storage key
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('Error removing from localStorage:', error);
            }
        },

        /**
         * Clear all localStorage data
         */
        clear() {
            try {
                localStorage.clear();
            } catch (error) {
                console.error('Error clearing localStorage:', error);
            }
        },

        /**
         * Check if localStorage is available
         * @returns {boolean} True if localStorage is available
         */
        isAvailable() {
            try {
                const test = '__localStorage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (error) {
                return false;
            }
        }
    },

    /**
     * Debug and logging utilities
     */
    Debug: {
        /**
         * Log message with level checking
         * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
         * @param {string} message - Log message
         * @param {*} data - Additional data to log
         */
        log(level, message, data = null) {
            const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
            const configLevel = GameConfig.DEBUG.LOG_LEVEL;
            const messageLevel = levels.indexOf(level);
            const configLevelIndex = levels.indexOf(configLevel);
            
            if (messageLevel >= configLevelIndex) {
                const timestamp = new Date().toISOString();
                const prefix = `[${timestamp}] [${level}]`;
                
                switch (level) {
                    case 'DEBUG':
                        console.debug(prefix, message, data);
                        break;
                    case 'INFO':
                        console.info(prefix, message, data);
                        break;
                    case 'WARN':
                        console.warn(prefix, message, data);
                        break;
                    case 'ERROR':
                        console.error(prefix, message, data);
                        break;
                    default:
                        console.log(prefix, message, data);
                }
            }
        },

        /**
         * Performance measurement utilities
         */
        performance: {
            /**
             * Start a performance timer
             * @param {string} label - Timer label
             */
            start(label) {
                if (GameConfig.DEBUG.LOG_LEVEL === 'DEBUG') {
                    console.time(label);
                }
            },

            /**
             * End a performance timer
             * @param {string} label - Timer label
             */
            end(label) {
                if (GameConfig.DEBUG.LOG_LEVEL === 'DEBUG') {
                    console.timeEnd(label);
                }
            }
        }
    },

    /**
     * Animation and easing utilities
     */
    Animation: {
        /**
         * Easing functions for smooth animations
         */
        easing: {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
        },

        /**
         * Animate a value over time
         * @param {object} options - Animation options
         * @param {number} options.from - Start value
         * @param {number} options.to - End value
         * @param {number} options.duration - Duration in milliseconds
         * @param {Function} options.onUpdate - Update callback
         * @param {Function} options.onComplete - Completion callback
         * @param {Function} options.easing - Easing function
         */
        animate(options) {
            const {
                from,
                to,
                duration,
                onUpdate,
                onComplete,
                easing = Utils.Animation.easing.easeOutQuad
            } = options;

            const startTime = performance.now();
            const difference = to - from;

            function update() {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easing(progress);
                const currentValue = from + difference * easedProgress;

                if (onUpdate) onUpdate(currentValue);

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else if (onComplete) {
                    onComplete();
                }
            }

            requestAnimationFrame(update);
        },

        /**
         * Animate a CSS property
         * @param {string} elementId - Element ID
         * @param {string} property - CSS property
         * @param {string} to - Target value
         * @param {number} duration - Duration in milliseconds
         * @param {Function} easing - Easing function
         */
        animateCSS(elementId, property, to, duration = 300, easing = Utils.Animation.easing.easeOutQuad) {
            const element = Utils.DOM.get(elementId);
            if (!element) return;

            const computedStyle = window.getComputedStyle(element);
            const from = parseFloat(computedStyle[property]) || 0;
            const toValue = parseFloat(to);

            Utils.Animation.animate({
                from,
                to: toValue,
                duration,
                easing,
                onUpdate: (value) => {
                    element.style[property] = value + (to.includes('%') ? '%' : 'px');
                }
            });
        }
    },

    /**
     * Color manipulation utilities
     */
    Color: {
        /**
         * Interpolate between two hex colors
         * @param {string} color1 - First color (hex)
         * @param {string} color2 - Second color (hex)
         * @param {number} factor - Interpolation factor (0-1)
         * @returns {string} Interpolated color (hex)
         */
        interpolate(color1, color2, factor) {
            const hex1 = color1.replace('#', '');
            const hex2 = color2.replace('#', '');
            
            const r1 = parseInt(hex1.substr(0, 2), 16);
            const g1 = parseInt(hex1.substr(2, 2), 16);
            const b1 = parseInt(hex1.substr(4, 2), 16);
            
            const r2 = parseInt(hex2.substr(0, 2), 16);
            const g2 = parseInt(hex2.substr(2, 2), 16);
            const b2 = parseInt(hex2.substr(4, 2), 16);
            
            const r = Math.round(r1 + (r2 - r1) * factor);
            const g = Math.round(g1 + (g2 - g1) * factor);
            const b = Math.round(b1 + (b2 - b1) * factor);
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        },

        /**
         * Convert hex color to RGB
         * @param {string} hex - Hex color
         * @returns {object} RGB object with r, g, b properties
         */
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        /**
         * Convert RGB to hex color
         * @param {number} r - Red component (0-255)
         * @param {number} g - Green component (0-255)
         * @param {number} b - Blue component (0-255)
         * @returns {string} Hex color
         */
        rgbToHex(r, g, b) {
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
    },

    /**
     * Game-specific calculation utilities
     */
    Game: {
        /**
         * Calculate exponential cost scaling
         * @param {number} baseCost - Base cost
         * @param {number} level - Current level
         * @param {number} scaling - Scaling factor (default from config)
         * @returns {number} Scaled cost
         */
        calculateCost(baseCost, level, scaling = GameConfig.BALANCE.COST_SCALING) {
            return Math.floor(baseCost * Math.pow(scaling, level));
        },

        /**
         * Calculate effectiveness with diminishing returns
         * @param {number} baseEffect - Base effectiveness
         * @param {number} level - Current level
         * @param {number} scaling - Scaling factor (default from config)
         * @returns {number} Scaled effectiveness
         */
        calculateEffectiveness(baseEffect, level, scaling = GameConfig.BALANCE.EFFECTIVENESS_SCALING) {
            return baseEffect * Math.pow(level, scaling);
        },

        /**
         * Calculate heat penalty on processing power
         * @param {number} heat - Current heat level (0-100)
         * @returns {number} Penalty multiplier (0.67-1.0)
         */
        calculateHeatPenalty(heat) {
            const maxPenalty = GameConfig.HEAT.PROCESSING_PENALTY_MAX;
            const penalty = (heat / 100) * maxPenalty;
            return 1 - penalty;
        },

        /**
         * Calculate offline efficiency based on time away
         * @param {number} timeAway - Time away in milliseconds
         * @returns {number} Efficiency multiplier (0.25-1.0)
         */
        calculateOfflineEfficiency(timeAway) {
            const hours = timeAway / (1000 * 60 * 60);
            const config = GameConfig.OFFLINE.EFFICIENCY;
            
            if (hours <= 1) return config.HOUR_1;
            if (hours <= 6) return config.HOUR_6;
            if (hours <= 24) return config.HOUR_24;
            if (hours <= 72) return config.HOUR_72;
            return config.BEYOND;
        },

        /**
         * Calculate success chance for infiltration
         * @param {number} processingPower - Available processing power
         * @param {number} difficulty - Target difficulty
         * @param {number} heat - Current heat level
         * @param {number} stealthModifier - Stealth bonus multiplier
         * @returns {number} Success chance (0-1)
         */
        calculateSuccessChance(processingPower, difficulty, heat, stealthModifier = 1) {
            const config = GameConfig.EXPANSION.INFILTRATION;
            const baseChance = config.BASE_SUCCESS_CHANCE;
            const powerAdvantage = Math.pow(processingPower / difficulty, config.SUCCESS_SCALING);
            const heatPenalty = Utils.Game.calculateHeatPenalty(heat);
            
            return Utils.Numbers.clamp(
                baseChance * powerAdvantage * stealthModifier * heatPenalty,
                0,
                0.95 // Cap at 95% success chance
            );
        },

        /**
         * Check if player can afford a cost
         * @param {object} resources - Current resources
         * @param {object} costs - Required costs
         * @returns {boolean} True if affordable
         */
        canAfford(resources, costs) {
            if (!Utils.Validation.isValidCosts(costs)) return false;
            
            for (const [resource, amount] of Object.entries(costs)) {
                if (!resources[resource] || resources[resource] < amount) {
                    return false;
                }
            }
            
            return true;
        },

        /**
         * Subtract costs from resources
         * @param {object} resources - Current resources (modified in place)
         * @param {object} costs - Costs to subtract
         * @returns {boolean} True if successful
         */
        spendResources(resources, costs) {
            if (!Utils.Game.canAfford(resources, costs)) return false;
            
            for (const [resource, amount] of Object.entries(costs)) {
                resources[resource] -= amount;
            }
            
            return true;
        }
    }
};

// Freeze the Utils object to prevent accidental modifications
if (typeof Object.freeze === 'function') {
    Object.freeze(Utils);
}

// Export for module systems (if supported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}