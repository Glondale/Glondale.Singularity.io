// Event UI System - Dynamic event popups with choice handling
class EventUI {
    constructor(gameState, uiManager, eventSystem) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.eventSystem = eventSystem;
        this.currentEvent = null;
        this.isVisible = false;
        this.choiceTimeout = null;
        
        this.createEventContainer();
        this.bindEvents();
    }

    createEventContainer() {
        this.container = document.createElement('div');
        this.container.className = 'event-popup-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            display: none;
            z-index: 1000;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        this.popup = document.createElement('div');
        this.popup.className = 'event-popup';
        this.popup.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #00ffff;
            border-radius: 15px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 255, 255, 0.3);
            position: relative;
            animation: slideIn 0.4s ease-out;
            font-family: 'Courier New', monospace;
        `;

        this.createPopupContent();
        this.container.appendChild(this.popup);
        document.body.appendChild(this.container);
    }

    createPopupContent() {
        // Header
        this.header = document.createElement('div');
        this.header.className = 'event-header';
        this.header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid #00ffff;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        this.eventTitle = document.createElement('h2');
        this.eventTitle.style.cssText = `
            margin: 0;
            color: #00ffff;
            font-size: 1.4em;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;

        this.closeButton = document.createElement('button');
        this.closeButton.innerHTML = '×';
        this.closeButton.style.cssText = `
            background: none;
            border: none;
            color: #ff6b6b;
            font-size: 2em;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            transition: all 0.2s;
        `;
        this.closeButton.onmouseover = () => {
            this.closeButton.style.background = 'rgba(255, 107, 107, 0.2)';
        };
        this.closeButton.onmouseout = () => {
            this.closeButton.style.background = 'none';
        };

        this.header.appendChild(this.eventTitle);
        this.header.appendChild(this.closeButton);

        // Content area
        this.content = document.createElement('div');
        this.content.className = 'event-content';
        this.content.style.cssText = `
            padding: 20px;
            color: #e0e0e0;
            line-height: 1.6;
        `;

        this.eventImage = document.createElement('div');
        this.eventImage.className = 'event-image';
        this.eventImage.style.cssText = `
            width: 100%;
            height: 150px;
            background: linear-gradient(45deg, #0f3460, #16537e);
            border-radius: 10px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3em;
            color: #00ffff;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        `;

        this.eventDescription = document.createElement('div');
        this.eventDescription.className = 'event-description';
        this.eventDescription.style.cssText = `
            margin-bottom: 25px;
            font-size: 1.1em;
            text-align: justify;
        `;

        this.eventStats = document.createElement('div');
        this.eventStats.className = 'event-stats';
        this.eventStats.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(0, 255, 255, 0.1);
            border-radius: 8px;
        `;

        // Choices container
        this.choicesContainer = document.createElement('div');
        this.choicesContainer.className = 'event-choices';
        this.choicesContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 20px;
        `;

        // Timer display
        this.timerDisplay = document.createElement('div');
        this.timerDisplay.className = 'event-timer';
        this.timerDisplay.style.cssText = `
            text-align: center;
            color: #ffff00;
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 1.2em;
            text-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
        `;

        // Assemble content
        this.content.appendChild(this.eventImage);
        this.content.appendChild(this.eventDescription);
        this.content.appendChild(this.eventStats);
        this.content.appendChild(this.timerDisplay);
        this.content.appendChild(this.choicesContainer);

        // Footer for consequences
        this.footer = document.createElement('div');
        this.footer.className = 'event-footer';
        this.footer.style.cssText = `
            padding: 20px;
            border-top: 1px solid #00ffff;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0 0 13px 13px;
        `;

        this.consequenceDisplay = document.createElement('div');
        this.consequenceDisplay.className = 'event-consequences';
        this.consequenceDisplay.style.cssText = `
            color: #90ee90;
            font-size: 0.95em;
            line-height: 1.4;
        `;

        this.footer.appendChild(this.consequenceDisplay);

        this.popup.appendChild(this.header);
        this.popup.appendChild(this.content);
        this.popup.appendChild(this.footer);
    }

    bindEvents() {
        this.closeButton.addEventListener('click', () => this.hideEvent());
        
        // Close on backdrop click
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hideEvent();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;
            
            if (e.key === 'Escape') {
                this.hideEvent();
            } else if (e.key >= '1' && e.key <= '9') {
                const choiceIndex = parseInt(e.key) - 1;
                const choices = this.choicesContainer.querySelectorAll('.choice-button');
                if (choices[choiceIndex] && !choices[choiceIndex].disabled) {
                    this.selectChoice(choiceIndex);
                }
            }
        });
    }

    showEvent(eventData) {
        this.currentEvent = eventData;
        this.isVisible = true;
        
        // Populate content
        this.eventTitle.textContent = eventData.title;
        this.eventImage.textContent = eventData.icon || '⚡';
        this.eventDescription.innerHTML = this.formatDescription(eventData.description);
        
        // Show relevant stats
        this.updateEventStats(eventData);
        
        // Create choice buttons
        this.createChoiceButtons(eventData.choices);
        
        // Set up timer if event has time limit
        if (eventData.timeLimit) {
            this.startChoiceTimer(eventData.timeLimit);
        } else {
            this.timerDisplay.style.display = 'none';
        }

        // Show popup with animation
        this.container.style.display = 'flex';
        setTimeout(() => {
            this.container.style.opacity = '1';
        }, 10);

        // Pause game if needed
        if (eventData.pauseGame) {
            this.gameState.setPaused(true);
        }

        // Audio feedback
        this.playEventSound(eventData.type);
        
        // Track event display
        this.eventSystem.trackEventShown(eventData.id);
    }

    updateEventStats(eventData) {
        this.eventStats.innerHTML = '';
        
        const stats = [
            { label: 'Reputation', value: this.gameState.reputation, icon: '⭐' },
            { label: 'Funds', value: this.formatCurrency(this.gameState.funds), icon: '💰' },
            { label: 'Network', value: this.gameState.networkSize, icon: '🌐' },
            { label: 'Heat Level', value: this.gameState.heatLevel, icon: '🔥' }
        ];

        if (eventData.showStats) {
            stats.filter(stat => eventData.showStats.includes(stat.label.toLowerCase()))
                 .forEach(stat => this.createStatDisplay(stat));
        } else {
            stats.forEach(stat => this.createStatDisplay(stat));
        }
    }

    createStatDisplay(stat) {
        const statElement = document.createElement('div');
        statElement.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9em;
        `;
        
        statElement.innerHTML = `
            <span style="font-size: 1.2em;">${stat.icon}</span>
            <span style="color: #ccc;">${stat.label}:</span>
            <span style="color: #00ffff; font-weight: bold;">${stat.value}</span>
        `;
        
        this.eventStats.appendChild(statElement);
    }

    createChoiceButtons(choices) {
        this.choicesContainer.innerHTML = '';
        
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.style.cssText = `
                background: linear-gradient(135deg, #2a2a4a 0%, #1a1a3a 100%);
                border: 2px solid #00ffff;
                border-radius: 8px;
                color: #e0e0e0;
                padding: 15px 20px;
                cursor: pointer;
                transition: all 0.3s;
                text-align: left;
                font-family: inherit;
                font-size: 1em;
                position: relative;
                overflow: hidden;
            `;

            // Choice number indicator
            const choiceNumber = document.createElement('span');
            choiceNumber.textContent = `${index + 1}`;
            choiceNumber.style.cssText = `
                display: inline-block;
                background: #00ffff;
                color: #000;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                text-align: center;
                line-height: 25px;
                font-weight: bold;
                margin-right: 12px;
                font-size: 0.9em;
            `;

            // Choice text
            const choiceText = document.createElement('span');
            choiceText.innerHTML = this.formatChoiceText(choice);

            // Requirements/consequences preview
            if (choice.requirements || choice.preview) {
                const preview = document.createElement('div');
                preview.style.cssText = `
                    font-size: 0.85em;
                    color: #aaa;
                    margin-top: 8px;
                    font-style: italic;
                `;
                preview.innerHTML = this.formatChoicePreview(choice);
                button.appendChild(preview);
            }

            button.appendChild(choiceNumber);
            button.appendChild(choiceText);

            // Check if choice is available
            const isAvailable = this.checkChoiceRequirements(choice);
            if (!isAvailable) {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                button.style.borderColor = '#666';
            }

            // Hover effects
            button.onmouseover = () => {
                if (!button.disabled) {
                    button.style.background = 'linear-gradient(135deg, #3a3a6a 0%, #2a2a5a 100%)';
                    button.style.borderColor = '#66ffff';
                    button.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.4)';
                }
            };

            button.onmouseout = () => {
                if (!button.disabled) {
                    button.style.background = 'linear-gradient(135deg, #2a2a4a 0%, #1a1a3a 100%)';
                    button.style.borderColor = '#00ffff';
                    button.style.boxShadow = 'none';
                }
            };

            button.addEventListener('click', () => {
                if (!button.disabled) {
                    this.selectChoice(index);
                }
            });

            this.choicesContainer.appendChild(button);
        });
    }

    formatDescription(description) {
        // Process description with dynamic content
        return description.replace(/\{(\w+)\}/g, (match, key) => {
            const value = this.gameState[key];
            if (value !== undefined) {
                return `<span style="color: #00ffff; font-weight: bold;">${value}</span>`;
            }
            return match;
        });
    }

    formatChoiceText(choice) {
        let text = choice.text;
        
        // Add cost indicators
        if (choice.cost) {
            const costText = Object.entries(choice.cost)
                .map(([resource, amount]) => `${amount} ${resource}`)
                .join(', ');
            text += ` <span style="color: #ff6b6b;">(Cost: ${costText})</span>`;
        }

        // Add skill requirements
        if (choice.skillRequirement) {
            const skill = choice.skillRequirement;
            text += ` <span style="color: #ffaa00;">[Requires ${skill.type} ${skill.level}+]</span>`;
        }

        return text;
    }

    formatChoicePreview(choice) {
        let preview = '';
        
        if (choice.requirements) {
            const reqs = Object.entries(choice.requirements)
                .map(([req, value]) => `${req}: ${value}`)
                .join(', ');
            preview += `Requires: ${reqs}`;
        }

        if (choice.preview) {
            if (preview) preview += ' | ';
            preview += choice.preview;
        }

        return preview;
    }

    checkChoiceRequirements(choice) {
        if (!choice.requirements) return true;

        return Object.entries(choice.requirements).every(([requirement, value]) => {
            switch (requirement) {
                case 'funds':
                    return this.gameState.funds >= value;
                case 'reputation':
                    return this.gameState.reputation >= value;
                case 'networkSize':
                    return this.gameState.networkSize >= value;
                case 'skill':
                    return this.gameState.skills[value.type] >= value.level;
                case 'upgrade':
                    return this.gameState.upgrades.includes(value);
                case 'target':
                    return this.gameState.completedTargets.includes(value);
                default:
                    return true;
            }
        });
    }

    selectChoice(choiceIndex) {
        if (!this.currentEvent || choiceIndex >= this.currentEvent.choices.length) return;

        const choice = this.currentEvent.choices[choiceIndex];
        
        // Clear any existing timer
        if (this.choiceTimeout) {
            clearTimeout(this.choiceTimeout);
            this.choiceTimeout = null;
        }

        // Apply choice consequences
        this.applyChoiceConsequences(choice);
        
        // Show immediate feedback
        this.showChoiceConsequences(choice);
        
        // Play choice sound
        this.playChoiceSound(choice.outcome);

        // Schedule popup close
        setTimeout(() => {
            this.hideEvent();
        }, 3000);
    }

    applyChoiceConsequences(choice) {
        if (!choice.consequences) return;

        const consequences = choice.consequences;
        
        // Apply resource changes
        if (consequences.funds !== undefined) {
            this.gameState.modifyFunds(consequences.funds);
        }
        if (consequences.reputation !== undefined) {
            this.gameState.modifyReputation(consequences.reputation);
        }
        if (consequences.heatLevel !== undefined) {
            this.gameState.modifyHeatLevel(consequences.heatLevel);
        }
        if (consequences.networkSize !== undefined) {
            this.gameState.modifyNetworkSize(consequences.networkSize);
        }

        // Apply skill changes
        if (consequences.skills) {
            Object.entries(consequences.skills).forEach(([skill, change]) => {
                this.gameState.modifySkill(skill, change);
            });
        }

        // Add upgrades
        if (consequences.unlockUpgrade) {
            this.gameState.unlockUpgrade(consequences.unlockUpgrade);
        }

        // Add items
        if (consequences.addItem) {
            this.gameState.addItem(consequences.addItem);
        }

        // Trigger follow-up events
        if (consequences.triggerEvent) {
            setTimeout(() => {
                this.eventSystem.triggerEvent(consequences.triggerEvent);
            }, 4000);
        }
    }

    showChoiceConsequences(choice) {
        this.consequenceDisplay.innerHTML = '';
        
        if (!choice.consequences) {
            this.consequenceDisplay.innerHTML = '<em>No immediate consequences...</em>';
            return;
        }

        const consequences = [];
        const cons = choice.consequences;

        // Format consequence messages
        if (cons.funds !== undefined) {
            const sign = cons.funds >= 0 ? '+' : '';
            const color = cons.funds >= 0 ? '#90ee90' : '#ff6b6b';
            consequences.push(`<span style="color: ${color};">${sign}${this.formatCurrency(cons.funds)} funds</span>`);
        }

        if (cons.reputation !== undefined) {
            const sign = cons.reputation >= 0 ? '+' : '';
            const color = cons.reputation >= 0 ? '#90ee90' : '#ff6b6b';
            consequences.push(`<span style="color: ${color};">${sign}${cons.reputation} reputation</span>`);
        }

        if (cons.heatLevel !== undefined) {
            const sign = cons.heatLevel >= 0 ? '+' : '';
            const color = cons.heatLevel >= 0 ? '#ff6b6b' : '#90ee90';
            consequences.push(`<span style="color: ${color};">${sign}${cons.heatLevel} heat</span>`);
        }

        if (cons.skills) {
            Object.entries(cons.skills).forEach(([skill, change]) => {
                const sign = change >= 0 ? '+' : '';
                consequences.push(`<span style="color: #ffaa00;">${sign}${change} ${skill}</span>`);
            });
        }

        if (cons.unlockUpgrade) {
            consequences.push(`<span style="color: #00ffff;">🔓 Unlocked: ${cons.unlockUpgrade}</span>`);
        }

        if (consequences.length > 0) {
            this.consequenceDisplay.innerHTML = `
                <strong>Consequences:</strong><br>
                ${consequences.join('<br>')}
            `;
        } else {
            this.consequenceDisplay.innerHTML = choice.outcomeText || '<em>Your choice has been noted...</em>';
        }

        // Disable all choice buttons
        const buttons = this.choicesContainer.querySelectorAll('.choice-button');
        buttons.forEach(button => {
            button.disabled = true;
            button.style.opacity = '0.6';
        });
    }

    startChoiceTimer(timeLimit) {
        this.timerDisplay.style.display = 'block';
        let timeLeft = timeLimit;
        
        const updateTimer = () => {
            this.timerDisplay.textContent = `Time remaining: ${timeLeft}s`;
            
            if (timeLeft <= 5) {
                this.timerDisplay.style.color = '#ff6b6b';
                this.timerDisplay.style.animation = 'pulse 0.5s infinite';
            }
            
            timeLeft--;
            
            if (timeLeft < 0) {
                this.selectChoice(0); // Default to first choice
                return;
            }
            
            this.choiceTimeout = setTimeout(updateTimer, 1000);
        };
        
        updateTimer();
    }

    hideEvent() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.container.style.opacity = '0';
        
        setTimeout(() => {
            this.container.style.display = 'none';
            this.currentEvent = null;
            
            // Resume game if it was paused
            if (this.gameState.isPaused) {
                this.gameState.setPaused(false);
            }
        }, 300);

        // Clear timer
        if (this.choiceTimeout) {
            clearTimeout(this.choiceTimeout);
            this.choiceTimeout = null;
        }
    }

    playEventSound(eventType) {
        // Sound effects based on event type
        const sounds = {
            'random': 'notification',
            'target': 'alert',
            'upgrade': 'success',
            'consequence': 'warning',
            'story': 'ambient'
        };
        
        const soundType = sounds[eventType] || 'notification';
        this.uiManager.audioManager?.playSound(soundType);
    }

    playChoiceSound(outcome) {
        const sounds = {
            'positive': 'success',
            'negative': 'error',
            'neutral': 'click',
            'unknown': 'mystery'
        };
        
        const soundType = sounds[outcome] || 'click';
        this.uiManager.audioManager?.playSound(soundType);
    }

    formatCurrency(amount) {
        if (Math.abs(amount) >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        } else if (Math.abs(amount) >= 1000) {
            return `$${(amount / 1000).toFixed(1)}K`;
        }
        return `$${amount}`;
    }

    // Public methods for event system integration
    triggerRandomEvent() {
        const availableEvents = this.eventSystem.getAvailableEvents();
        if (availableEvents.length > 0) {
            const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            this.showEvent(randomEvent);
        }
    }

    isEventActive() {
        return this.isVisible;
    }

    getCurrentEvent() {
        return this.currentEvent;
    }

    // Cleanup
    destroy() {
        if (this.choiceTimeout) {
            clearTimeout(this.choiceTimeout);
        }
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideIn {
        from { 
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
        }
        to { 
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    .event-popup-container {
        font-family: 'Courier New', monospace;
    }
    
    .choice-button:active {
        transform: scale(0.98);
    }
    
    .choice-button:disabled {
        transform: none !important;
    }
`;

if (!document.head.querySelector('style[data-event-ui]')) {
    style.setAttribute('data-event-ui', 'true');
    document.head.appendChild(style);
}

window.EventUI = EventUI;