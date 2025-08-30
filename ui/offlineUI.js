// Offline UI System - Welcome back screen with offline progress summary
class OfflineUI {
    constructor(gameState, uiManager) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.isVisible = false;
        this.offlineData = null;
        this.animationQueue = [];
        this.currentAnimationIndex = 0;
        
        this.createOfflineScreen();
        this.bindEvents();
    }

    createOfflineScreen() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'offline-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%);
            backdrop-filter: blur(10px);
            display: none;
            z-index: 3000;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.5s ease-out;
            font-family: 'Courier New', monospace;
        `;

        this.container = document.createElement('div');
        this.container.className = 'offline-container';
        this.container.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 3px solid #00ffff;
            border-radius: 20px;
            width: 90%;
            max-width: 700px;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 30px 60px rgba(0, 255, 255, 0.4);
            position: relative;
            animation: slideInScale 0.6s ease-out;
        `;

        this.createHeader();
        this.createContent();
        this.createFooter();

        this.overlay.appendChild(this.container);
        document.body.appendChild(this.overlay);
    }

    createHeader() {
        this.header = document.createElement('div');
        this.header.className = 'offline-header';
        this.header.style.cssText = `
            padding: 25px 30px;
            border-bottom: 2px solid #00ffff;
            background: rgba(0, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
        `;

        // Animated background particles
        this.createHeaderAnimation();

        const welcomeText = document.createElement('div');
        welcomeText.className = 'welcome-text';
        welcomeText.style.cssText = `
            text-align: center;
            position: relative;
            z-index: 2;
        `;

        const title = document.createElement('h1');
        title.textContent = 'WELCOME BACK, AGENT';
        title.style.cssText = `
            margin: 0 0 10px 0;
            color: #00ffff;
            font-size: 2.2em;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
            letter-spacing: 3px;
            animation: glow 2s ease-in-out infinite alternate;
        `;

        const subtitle = document.createElement('div');
        subtitle.className = 'offline-subtitle';
        subtitle.style.cssText = `
            color: #e0e0e0;
            font-size: 1.1em;
            opacity: 0.9;
            letter-spacing: 1px;
        `;

        this.timeDisplay = document.createElement('div');
        this.timeDisplay.className = 'time-away';
        this.timeDisplay.style.cssText = `
            color: #ffaa00;
            font-size: 1.3em;
            font-weight: bold;
            margin-top: 15px;
            text-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
        `;

        welcomeText.appendChild(title);
        welcomeText.appendChild(subtitle);
        welcomeText.appendChild(this.timeDisplay);

        this.header.appendChild(welcomeText);
    }

    createHeaderAnimation() {
        // Create floating particles in the header
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: #00ffff;
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.6 + 0.2};
                animation: float ${Math.random() * 3 + 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            `;
            this.header.appendChild(particle);
        }
    }

    createContent() {
        this.content = document.createElement('div');
        this.content.className = 'offline-content';
        this.content.style.cssText = `
            padding: 30px;
            max-height: 400px;
            overflow-y: auto;
        `;

        this.progressSummary = document.createElement('div');
        this.progressSummary.className = 'progress-summary';
        this.progressSummary.style.cssText = `
            margin-bottom: 25px;
        `;

        this.earningsContainer = document.createElement('div');
        this.earningsContainer.className = 'earnings-container';
        this.earningsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        `;

        this.eventsContainer = document.createElement('div');
        this.eventsContainer.className = 'events-container';
        this.eventsContainer.style.cssText = `
            margin-bottom: 25px;
        `;

        this.upgradesContainer = document.createElement('div');
        this.upgradesContainer.className = 'upgrades-container';
        this.upgradesContainer.style.cssText = `
            margin-bottom: 20px;
        `;

        this.content.appendChild(this.progressSummary);
        this.content.appendChild(this.earningsContainer);
        this.content.appendChild(this.eventsContainer);
        this.content.appendChild(this.upgradesContainer);
        this.container.appendChild(this.content);
    }

    createFooter() {
        this.footer = document.createElement('div');
        this.footer.className = 'offline-footer';
        this.footer.style.cssText = `
            padding: 25px 30px;
            border-top: 2px solid #00ffff;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        `;

        this.collectButton = document.createElement('button');
        this.collectButton.textContent = 'COLLECT REWARDS';
        this.collectButton.className = 'collect-button';
        this.collectButton.style.cssText = `
            background: linear-gradient(135deg, #00ffff 0%, #0099cc 100%);
            border: none;
            color: #000;
            padding: 15px 30px;
            border-radius: 10px;
            font-family: inherit;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 5px 15px rgba(0, 255, 255, 0.4);
            flex: 1;
            max-width: 200px;
        `;

        this.skipButton = document.createElement('button');
        this.skipButton.textContent = 'Skip Animation';
        this.skipButton.style.cssText = `
            background: transparent;
            border: 2px solid #666;
            color: #999;
            padding: 12px 25px;
            border-radius: 8px;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 0.9em;
        `;

        this.continueButton = document.createElement('button');
        this.continueButton.textContent = 'CONTINUE';
        this.continueButton.style.cssText = `
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            border: none;
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            font-family: inherit;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
            display: none;
        `;

        this.footer.appendChild(this.skipButton);
        this.footer.appendChild(this.collectButton);
        this.footer.appendChild(this.continueButton);
        this.container.appendChild(this.footer);
    }

    bindEvents() {
        this.collectButton.addEventListener('click', () => this.startRewardAnimation());
        this.skipButton.addEventListener('click', () => this.skipAnimation());
        this.continueButton.addEventListener('click', () => this.hide());

        // Hover effects
        this.collectButton.addEventListener('mouseover', () => {
            this.collectButton.style.transform = 'scale(1.05)';
            this.collectButton.style.boxShadow = '0 8px 25px rgba(0, 255, 255, 0.6)';
        });

        this.collectButton.addEventListener('mouseout', () => {
            this.collectButton.style.transform = 'scale(1)';
            this.collectButton.style.boxShadow = '0 5px 15px rgba(0, 255, 255, 0.4)';
        });

        this.continueButton.addEventListener('mouseover', () => {
            this.continueButton.style.transform = 'scale(1.05)';
            this.continueButton.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.6)';
        });

        this.continueButton.addEventListener('mouseout', () => {
            this.continueButton.style.transform = 'scale(1)';
            this.continueButton.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.4)';
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;
            
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (this.collectButton.style.display !== 'none') {
                    this.startRewardAnimation();
                } else {
                    this.hide();
                }
            } else if (e.key === 'Escape') {
                this.skipAnimation();
            }
        });
    }

    show(offlineData) {
        this.offlineData = offlineData;
        this.isVisible = true;
        
        // Populate content
        this.populateOfflineData();
        
        // Show overlay
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 10);

        // Play ambient sound
        this.uiManager.audioManager?.playSound('welcome_back');
        
        // Pause game
        this.gameState.setPaused(true);
    }

    populateOfflineData() {
        // Update time away display
        this.timeDisplay.textContent = `You were away for ${this.formatDuration(this.offlineData.timeAway)}`;
        
        // Update subtitle based on time away
        const subtitle = this.container.querySelector('.offline-subtitle');
        if (this.offlineData.timeAway > 86400) { // More than a day
            subtitle.textContent = 'Your network continued operations in your absence';
        } else if (this.offlineData.timeAway > 3600) { // More than an hour
            subtitle.textContent = 'Background processes generated resources';
        } else {
            subtitle.textContent = 'Brief absence detected - minimal offline progress';
        }

        // Create progress summary
        this.createProgressSummary();
        
        // Create earnings breakdown
        this.createEarningsBreakdown();
        
        // Create events summary
        this.createEventsDisplay();
        
        // Create upgrades progress
        this.createUpgradesDisplay();
    }

    createProgressSummary() {
        this.progressSummary.innerHTML = '';
        
        const title = document.createElement('h3');
        title.textContent = 'OFFLINE PROGRESS SUMMARY';
        title.style.cssText = `
            color: #00ffff;
            font-size: 1.3em;
            margin: 0 0 20px 0;
            text-align: center;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            letter-spacing: 2px;
        `;

        const summaryGrid = document.createElement('div');
        summaryGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        `;

        const stats = [
            {
                label: 'Total Earned',
                value: this.formatCurrency(this.offlineData.totalEarnings),
                icon: '💰',
                color: '#4CAF50'
            },
            {
                label: 'Operations Run',
                value: this.offlineData.operationsCompleted,
                icon: '⚡',
                color: '#2196F3'
            },
            {
                label: 'XP Gained',
                value: this.offlineData.experienceGained,
                icon: '🎯',
                color: '#FF9800'
            },
            {
                label: 'Events Triggered',
                value: this.offlineData.eventsTriggered?.length || 0,
                icon: '📊',
                color: '#9C27B0'
            }
        ];

        stats.forEach(stat => {
            const statCard = this.createStatCard(stat);
            summaryGrid.appendChild(statCard);
        });

        this.progressSummary.appendChild(title);
        this.progressSummary.appendChild(summaryGrid);
    }

    createStatCard(stat) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s;
            cursor: pointer;
        `;

        const icon = document.createElement('div');
        icon.textContent = stat.icon;
        icon.style.cssText = `
            font-size: 2em;
            margin-bottom: 8px;
            filter: drop-shadow(0 0 5px ${stat.color});
        `;

        const value = document.createElement('div');
        value.textContent = stat.value;
        value.style.cssText = `
            font-size: 1.4em;
            font-weight: bold;
            color: ${stat.color};
            margin-bottom: 5px;
            text-shadow: 0 0 10px ${stat.color}50;
        `;

        const label = document.createElement('div');
        label.textContent = stat.label;
        label.style.cssText = `
            color: #ccc;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;

        card.appendChild(icon);
        card.appendChild(value);
        card.appendChild(label);

        // Hover effect
        card.addEventListener('mouseover', () => {
            card.style.background = `rgba(${this.hexToRgb(stat.color)}, 0.2)`;
            card.style.borderColor = stat.color;
            card.style.transform = 'translateY(-3px)';
        });

        card.addEventListener('mouseout', () => {
            card.style.background = 'rgba(0, 255, 255, 0.1)';
            card.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            card.style.transform = 'translateY(0)';
        });

        return card;
    }

    createEarningsBreakdown() {
        this.earningsContainer.innerHTML = '';
        
        if (!this.offlineData.earnings || Object.keys(this.offlineData.earnings).length === 0) {
            return;
        }

        const title = document.createElement('h4');
        title.textContent = 'EARNINGS BREAKDOWN';
        title.style.cssText = `
            color: #00ffff;
            margin: 0 0 15px 0;
            text-align: center;
            font-size: 1.1em;
            letter-spacing: 1px;
        `;

        this.earningsContainer.appendChild(title);

        Object.entries(this.offlineData.earnings).forEach(([source, amount]) => {
            if (amount > 0) {
                const earningCard = this.createEarningCard(source, amount);
                this.earningsContainer.appendChild(earningCard);
            }
        });
    }

    createEarningCard(source, amount) {
        const card = document.createElement('div');
        card.className = 'earning-card';
        card.style.cssText = `
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%);
            border: 1px solid rgba(76, 175, 80, 0.3);
            border-radius: 8px;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s;
            opacity: 0;
            transform: translateX(-20px);
        `;

        const sourceInfo = document.createElement('div');
        sourceInfo.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        const icon = this.getSourceIcon(source);
        const iconElement = document.createElement('span');
        iconElement.textContent = icon;
        iconElement.style.cssText = `
            font-size: 1.5em;
            filter: drop-shadow(0 0 5px #4CAF50);
        `;

        const sourceName = document.createElement('span');
        sourceName.textContent = this.formatSourceName(source);
        sourceName.style.cssText = `
            color: #e0e0e0;
            font-weight: bold;
        `;

        const amountElement = document.createElement('span');
        amountElement.textContent = `+${this.formatCurrency(amount)}`;
        amountElement.style.cssText = `
            color: #4CAF50;
            font-weight: bold;
            font-size: 1.1em;
            text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
        `;

        sourceInfo.appendChild(iconElement);
        sourceInfo.appendChild(sourceName);
        card.appendChild(sourceInfo);
        card.appendChild(amountElement);

        return card;
    }

    createEventsDisplay() {
        this.eventsContainer.innerHTML = '';
        
        if (!this.offlineData.eventsTriggered || this.offlineData.eventsTriggered.length === 0) {
            return;
        }

        const title = document.createElement('h4');
        title.textContent = 'EVENTS OCCURRED';
        title.style.cssText = `
            color: #00ffff;
            margin: 0 0 15px 0;
            text-align: center;
            font-size: 1.1em;
            letter-spacing: 1px;
        `;

        const eventsList = document.createElement('div');
        eventsList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        this.offlineData.eventsTriggered.slice(0, 5).forEach((event, index) => {
            const eventCard = this.createEventCard(event, index);
            eventsList.appendChild(eventCard);
        });

        if (this.offlineData.eventsTriggered.length > 5) {
            const moreEvents = document.createElement('div');
            moreEvents.textContent = `...and ${this.offlineData.eventsTriggered.length - 5} more events`;
            moreEvents.style.cssText = `
                color: #888;
                text-align: center;
                font-style: italic;
                margin-top: 10px;
            `;
            eventsList.appendChild(moreEvents);
        }

        this.eventsContainer.appendChild(title);
        this.eventsContainer.appendChild(eventsList);
    }

    createEventCard(event, index) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.style.cssText = `
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 6px;
            padding: 12px 15px;
            display: flex;
            align-items: center;
            gap: 12px;
            opacity: 0;
            transform: translateY(20px);
            animation-delay: ${index * 0.1}s;
        `;

        const eventIcon = document.createElement('span');
        eventIcon.textContent = event.icon || '⚡';
        eventIcon.style.cssText = `
            font-size: 1.2em;
            filter: drop-shadow(0 0 5px #FFC107);
        `;

        const eventText = document.createElement('div');
        eventText.style.cssText = `
            flex: 1;
            color: #e0e0e0;
        `;

        const eventTitle = document.createElement('div');
        eventTitle.textContent = event.title;
        eventTitle.style.cssText = `
            font-weight: bold;
            margin-bottom: 2px;
        `;

        const eventDescription = document.createElement('div');
        eventDescription.textContent = event.description;
        eventDescription.style.cssText = `
            font-size: 0.85em;
            color: #bbb;
        `;

        eventText.appendChild(eventTitle);
        eventText.appendChild(eventDescription);

        card.appendChild(eventIcon);
        card.appendChild(eventText);

        return card;
    }

    createUpgradesDisplay() {
        this.upgradesContainer.innerHTML = '';
        
        if (!this.offlineData.upgradesCompleted || this.offlineData.upgradesCompleted.length === 0) {
            return;
        }

        const title = document.createElement('h4');
        title.textContent = 'UPGRADES COMPLETED';
        title.style.cssText = `
            color: #00ffff;
            margin: 0 0 15px 0;
            text-align: center;
            font-size: 1.1em;
            letter-spacing: 1px;
        `;

        const upgradesList = document.createElement('div');
        upgradesList.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        `;

        this.offlineData.upgradesCompleted.forEach((upgrade, index) => {
            const upgradeCard = this.createUpgradeCard(upgrade, index);
            upgradesList.appendChild(upgradeCard);
        });

        this.upgradesContainer.appendChild(title);
        this.upgradesContainer.appendChild(upgradesList);
    }

    createUpgradeCard(upgrade, index) {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.style.cssText = `
            background: rgba(156, 39, 176, 0.1);
            border: 1px solid rgba(156, 39, 176, 0.3);
            border-radius: 6px;
            padding: 12px;
            text-align: center;
            opacity: 0;
            transform: scale(0.9);
            animation-delay: ${index * 0.1}s;
        `;

        const upgradeIcon = document.createElement('div');
        upgradeIcon.textContent = upgrade.icon || '🔧';
        upgradeIcon.style.cssText = `
            font-size: 1.5em;
            margin-bottom: 8px;
            filter: drop-shadow(0 0 5px #9C27B0);
        `;

        const upgradeName = document.createElement('div');
        upgradeName.textContent = upgrade.name;
        upgradeName.style.cssText = `
            color: #e0e0e0;
            font-weight: bold;
            font-size: 0.9em;
        `;

        card.appendChild(upgradeIcon);
        card.appendChild(upgradeName);

        return card;
    }

    startRewardAnimation() {
        this.collectButton.style.display = 'none';
        this.skipButton.style.borderColor = '#00ffff';
        this.skipButton.style.color = '#00ffff';

        // Start collecting animations
        this.animateEarnings();
        
        // Play collection sound
        this.uiManager.audioManager?.playSound('collect_rewards');
    }

    animateEarnings() {
        const earningCards = this.earningsContainer.querySelectorAll('.earning-card');
        const eventCards = this.eventsContainer.querySelectorAll('.event-card');
        const upgradeCards = this.upgradesContainer.querySelectorAll('.upgrade-card');

        let delay = 0;

        // Animate earning cards
        earningCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateX(0)';
                card.style.transition = 'all 0.5s ease-out';
                
                // Add collection effect
                this.addCollectionEffect(card);
            }, delay);
            delay += 200;
        });

        // Animate event cards
        eventCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                card.style.transition = 'all 0.4s ease-out';
            }, delay);
            delay += 150;
        });

        // Animate upgrade cards
        upgradeCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
                card.style.transition = 'all 0.3s ease-out';
            }, delay);
            delay += 100;
        });

        // Show continue button after all animations
        setTimeout(() => {
            this.showContinueButton();
            this.applyOfflineProgress();
        }, delay + 500);
    }

    addCollectionEffect(card) {
        // Create sparkle effect
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: #4CAF50;
                border-radius: 50%;
                pointer-events: none;
                animation: sparkle 1s ease-out forwards;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                box-shadow: 0 0 6px #4CAF50;
            `;
            
            card.style.position = 'relative';
            card.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1000);
        }
    }

    showContinueButton() {
        this.continueButton.style.display = 'block';
        this.continueButton.style.opacity = '0';
        this.continueButton.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            this.continueButton.style.transition = 'all 0.3s ease-out';
            this.continueButton.style.opacity = '1';
            this.continueButton.style.transform = 'scale(1)';
        }, 100);

        this.skipButton.style.opacity = '0.5';
        this.skipButton.textContent = 'Close';
    }

    skipAnimation() {
        // Stop all animations and show final state immediately
        const allAnimatedElements = this.container.querySelectorAll('.earning-card, .event-card, .upgrade-card');
        allAnimatedElements.forEach(element => {
            element.style.transition = 'none';
            element.style.opacity = '1';
            element.style.transform = 'none';
        });

        this.showContinueButton();
        this.applyOfflineProgress();
    }

    applyOfflineProgress() {
        // Apply the offline progress to the game state
        if (this.offlineData.totalEarnings > 0) {
            this.gameState.modifyFunds(this.offlineData.totalEarnings);
        }
        
        if (this.offlineData.experienceGained > 0) {
            this.gameState.addExperience(this.offlineData.experienceGained);
        }

        // Apply any upgrades
        if (this.offlineData.upgradesCompleted) {
            this.offlineData.upgradesCompleted.forEach(upgrade => {
                this.gameState.completeUpgrade(upgrade.id);
            });
        }

        // Trigger any events that occurred
        if (this.offlineData.eventsTriggered) {
            this.offlineData.eventsTriggered.forEach(event => {
                this.gameState.processOfflineEvent(event);
            });
        }

        // Update last seen timestamp
        this.gameState.updateLastSeen();
    }

    hide() {
        this.isVisible = false;
        this.overlay.style.opacity = '0';
        
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.gameState.setPaused(false);
            
            // Reset for next time
            this.resetDisplay();
        }, 300);
    }

    resetDisplay() {
        // Reset all animated elements
        const allAnimatedElements = this.container.querySelectorAll('.earning-card, .event-card, .upgrade-card');
        allAnimatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transition = '';
            if (element.classList.contains('earning-card')) {
                element.style.transform = 'translateX(-20px)';
            } else if (element.classList.contains('event-card')) {
                element.style.transform = 'translateY(20px)';
            } else if (element.classList.contains('upgrade-card')) {
                element.style.transform = 'scale(0.9)';
            }
        });

        // Reset buttons
        this.collectButton.style.display = 'block';
        this.continueButton.style.display = 'none';
        this.skipButton.style.borderColor = '#666';
        this.skipButton.style.color = '#999';
        this.skipButton.style.opacity = '1';
        this.skipButton.textContent = 'Skip Animation';

        // Clear containers
        this.earningsContainer.innerHTML = '';
        this.eventsContainer.innerHTML = '';
        this.upgradesContainer.innerHTML = '';
        this.progressSummary.innerHTML = '';
    }

    // Utility methods
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${Math.floor(seconds)} seconds`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min` : ''}`;
        } else {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            return `${days} day${days !== 1 ? 's' : ''} ${hours > 0 ? `${hours} hours` : ''}`;
        }
    }

    formatCurrency(amount) {
        if (Math.abs(amount) >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (Math.abs(amount) >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        }
        return `${amount.toLocaleString()}`;
    }

    formatSourceName(source) {
        const sourceNames = {
            'passive_income': 'Passive Income',
            'network_operations': 'Network Operations',
            'background_tasks': 'Background Tasks',
            'automated_scripts': 'Automated Scripts',
            'crypto_mining': 'Crypto Mining',
            'data_farming': 'Data Farming',
            'bot_networks': 'Bot Networks',
            'affiliate_programs': 'Affiliate Programs'
        };
        
        return sourceNames[source] || source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getSourceIcon(source) {
        const sourceIcons = {
            'passive_income': '💎',
            'network_operations': '🌐',
            'background_tasks': '⚙️',
            'automated_scripts': '🤖',
            'crypto_mining': '⛏️',
            'data_farming': '📊',
            'bot_networks': '🕷️',
            'affiliate_programs': '🤝'
        };
        
        return sourceIcons[source] || '💰';
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
        }
        
        // Handle named colors
        const colorMap = {
            '#4CAF50': '76, 175, 80',
            '#2196F3': '33, 150, 243',
            '#FF9800': '255, 152, 0',
            '#9C27B0': '156, 39, 176'
        };
        
        return colorMap[hex] || '255, 255, 255';
    }

    // Public interface methods
    shouldShow(timeAway) {
        // Show offline screen if player was away for more than 30 seconds
        return timeAway > 30;
    }

    calculateOfflineProgress(timeAway) {
        // This would typically be calculated by the game's offline progression system
        // Here we create a sample structure
        return {
            timeAway: timeAway,
            totalEarnings: this.calculateOfflineEarnings(timeAway),
            operationsCompleted: Math.floor(timeAway / 120), // One operation every 2 minutes
            experienceGained: Math.floor(timeAway / 60), // 1 XP per minute
            earnings: this.calculateEarningsBreakdown(timeAway),
            eventsTriggered: this.generateOfflineEvents(timeAway),
            upgradesCompleted: this.checkCompletedUpgrades(timeAway)
        };
    }

    calculateOfflineEarnings(timeAway) {
        const baseRate = this.gameState.getPassiveIncomeRate();
        const timeMultiplier = Math.min(timeAway / 3600, 24); // Cap at 24 hours worth
        const randomMultiplier = 0.8 + Math.random() * 0.4; // 80-120% efficiency
        
        return Math.floor(baseRate * timeMultiplier * randomMultiplier);
    }

    calculateEarningsBreakdown(timeAway) {
        const totalEarnings = this.calculateOfflineEarnings(timeAway);
        const breakdown = {};
        
        // Distribute earnings across different sources
        const sources = ['passive_income', 'network_operations', 'background_tasks'];
        const weights = [0.5, 0.3, 0.2];
        
        sources.forEach((source, index) => {
            breakdown[source] = Math.floor(totalEarnings * weights[index]);
        });
        
        return breakdown;
    }

    generateOfflineEvents(timeAway) {
        const events = [];
        const eventChance = Math.min(timeAway / 3600, 8); // Up to 8 events max
        
        for (let i = 0; i < eventChance; i++) {
            if (Math.random() < 0.3) { // 30% chance per potential event
                events.push({
                    id: `offline_event_${Date.now()}_${i}`,
                    title: this.getRandomEventTitle(),
                    description: this.getRandomEventDescription(),
                    icon: this.getRandomEventIcon(),
                    timestamp: Date.now() - (timeAway * 1000) + (i * 1000 * 3600)
                });
            }
        }
        
        return events;
    }

    getRandomEventTitle() {
        const titles = [
            'Network Intrusion Detected',
            'Automated Script Success',
            'Data Cache Discovery',
            'Security Protocol Updated',
            'Background Task Completed',
            'Crypto Mining Bonus',
            'Network Expansion'
        ];
        
        return titles[Math.floor(Math.random() * titles.length)];
    }

    getRandomEventDescription() {
        const descriptions = [
            'Your security systems repelled an attack automatically',
            'Background processes found valuable data',
            'Network nodes expanded operations',
            'Automated defenses improved',
            'Resource gathering algorithms optimized',
            'Mining efficiency increased temporarily',
            'New connections established'
        ];
        
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    getRandomEventIcon() {
        const icons = ['🔒', '📡', '💎', '🛡️', '⚡', '🔧', '🌐'];
        return icons[Math.floor(Math.random() * icons.length)];
    }

    checkCompletedUpgrades(timeAway) {
        // Check if any time-based upgrades completed while offline
        const completedUpgrades = [];
        const activeUpgrades = this.gameState.getActiveUpgrades();
        
        activeUpgrades.forEach(upgrade => {
            if (upgrade.timeRemaining <= timeAway) {
                completedUpgrades.push({
                    id: upgrade.id,
                    name: upgrade.name,
                    icon: upgrade.icon || '🔧'
                });
            }
        });
        
        return completedUpgrades;
    }

    // Cleanup
    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

// CSS animations and styles
const offlineStyle = document.createElement('style');
offlineStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideInScale {
        from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes glow {
        from {
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
        }
        to {
            text-shadow: 0 0 30px rgba(0, 255, 255, 1), 0 0 40px rgba(0, 255, 255, 0.8);
        }
    }
    
    @keyframes float {
        0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.4;
        }
        50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
        }
    }
    
    @keyframes sparkle {
        0% {
            opacity: 1;
            transform: scale(0) rotate(0deg);
        }
        50% {
            opacity: 1;
            transform: scale(1.2) rotate(180deg);
        }
        100% {
            opacity: 0;
            transform: scale(0) rotate(360deg);
        }
    }
    
    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes scaleIn {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    /* Custom scrollbar for offline content */
    .offline-content::-webkit-scrollbar {
        width: 8px;
    }
    
    .offline-content::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }
    
    .offline-content::-webkit-scrollbar-thumb {
        background: rgba(0, 255, 255, 0.5);
        border-radius: 4px;
    }
    
    .offline-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 255, 255, 0.7);
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
        .offline-container {
            width: 95% !important;
            margin: 10px;
        }
        
        .offline-header {
            padding: 20px !important;
        }
        
        .offline-content {
            padding: 20px !important;
        }
        
        .offline-footer {
            padding: 20px !important;
            flex-direction: column;
            gap: 15px !important;
        }
        
        .collect-button,
        .continue-button {
            max-width: none !important;
            width: 100%;
        }
    }
    
    /* High contrast mode support */
    .high-contrast .offline-overlay {
        background: rgba(0, 0, 0, 0.98) !important;
    }
    
    .high-contrast .offline-container {
        border-color: #ffffff !important;
    }
    
    .high-contrast .earning-card,
    .high-contrast .event-card,
    .high-contrast .upgrade-card {
        border-color: #ffffff !important;
        background: rgba(255, 255, 255, 0.1) !important;
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .offline-overlay,
        .offline-container,
        .earning-card,
        .event-card,
        .upgrade-card {
            animation: none !important;
            transition: none !important;
        }
        
        .offline-header div {
            animation: none !important;
        }
    }
`;

if (!document.head.querySelector('style[data-offline-ui]')) {
    offlineStyle.setAttribute('data-offline-ui', 'true');
    document.head.appendChild(offlineStyle);
}

window.OfflineUI = OfflineUI;