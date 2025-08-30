// Settings UI System - Game settings panel (audio, graphics, saves)
class SettingsUI {
    constructor(gameState, uiManager) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.isVisible = false;
        this.activeTab = 'general';
        this.settings = this.loadSettings();
        
        this.createSettingsPanel();
        this.bindEvents();
        this.applySettings();
    }

    loadSettings() {
        const defaultSettings = {
            // Audio settings
            masterVolume: 0.7,
            musicVolume: 0.6,
            sfxVolume: 0.8,
            ambientVolume: 0.4,
            muteAll: false,
            
            // Graphics settings
            particleEffects: true,
            animations: true,
            screenShake: true,
            backgroundAnimation: true,
            highContrast: false,
            reducedMotion: false,
            
            // Gameplay settings
            autosave: true,
            autosaveInterval: 60, // seconds
            showTooltips: true,
            confirmDangerousActions: true,
            pauseOnFocusLoss: true,
            showAdvancedStats: false,
            
            // Interface settings
            fontSize: 'medium',
            theme: 'dark',
            showNotifications: true,
            compactMode: false,
            
            // Performance settings
            targetFPS: 60,
            vsync: true,
            renderQuality: 'high'
        };

        try {
            const saved = localStorage.getItem('cyberInfiltrator_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return defaultSettings;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('cyberInfiltrator_settings', JSON.stringify(this.settings));
            this.applySettings();
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    createSettingsPanel() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'settings-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(5px);
            display: none;
            z-index: 2000;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        this.panel = document.createElement('div');
        this.panel.className = 'settings-panel';
        this.panel.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #00ffff;
            border-radius: 15px;
            width: 90%;
            max-width: 800px;
            height: 80vh;
            max-height: 600px;
            box-shadow: 0 20px 40px rgba(0, 255, 255, 0.3);
            position: relative;
            animation: slideIn 0.4s ease-out;
            font-family: 'Courier New', monospace;
            display: flex;
            flex-direction: column;
        `;

        this.createHeader();
        this.createTabNavigation();
        this.createContent();
        this.createFooter();

        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
    }

    createHeader() {
        this.header = document.createElement('div');
        this.header.className = 'settings-header';
        this.header.style.cssText = `
            padding: 20px 25px;
            border-bottom: 1px solid #00ffff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0, 255, 255, 0.05);
        `;

        const title = document.createElement('h2');
        title.textContent = 'SYSTEM SETTINGS';
        title.style.cssText = `
            margin: 0;
            color: #00ffff;
            font-size: 1.5em;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            letter-spacing: 2px;
        `;

        this.closeButton = document.createElement('button');
        this.closeButton.innerHTML = '✕';
        this.closeButton.className = 'settings-close-btn';
        this.closeButton.style.cssText = `
            background: none;
            border: 2px solid #ff6b6b;
            color: #ff6b6b;
            font-size: 1.5em;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 8px;
            transition: all 0.3s;
            font-family: inherit;
        `;

        this.header.appendChild(title);
        this.header.appendChild(this.closeButton);
        this.panel.appendChild(this.header);
    }

    createTabNavigation() {
        this.tabContainer = document.createElement('div');
        this.tabContainer.className = 'settings-tabs';
        this.tabContainer.style.cssText = `
            display: flex;
            border-bottom: 1px solid #333;
            background: rgba(0, 0, 0, 0.2);
        `;

        const tabs = [
            { id: 'general', label: 'General', icon: '⚙️' },
            { id: 'audio', label: 'Audio', icon: '🔊' },
            { id: 'graphics', label: 'Graphics', icon: '🎨' },
            { id: 'gameplay', label: 'Gameplay', icon: '🎮' },
            { id: 'saves', label: 'Save Data', icon: '💾' }
        ];

        tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.className = 'settings-tab';
            tabButton.dataset.tab = tab.id;
            tabButton.style.cssText = `
                background: none;
                border: none;
                color: #888;
                padding: 15px 20px;
                cursor: pointer;
                transition: all 0.3s;
                font-family: inherit;
                font-size: 0.9em;
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                border-bottom: 3px solid transparent;
            `;

            tabButton.innerHTML = `
                <span style="font-size: 1.2em;">${tab.icon}</span>
                <span>${tab.label}</span>
            `;

            if (tab.id === this.activeTab) {
                this.setActiveTab(tabButton);
            }

            tabButton.addEventListener('click', () => {
                this.switchTab(tab.id);
            });

            this.tabContainer.appendChild(tabButton);
        });

        this.panel.appendChild(this.tabContainer);
    }

    createContent() {
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'settings-content';
        this.contentContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 25px;
            background: rgba(0, 0, 0, 0.1);
        `;

        // Create all tab contents
        this.createGeneralTab();
        this.createAudioTab();
        this.createGraphicsTab();
        this.createGameplayTab();
        this.createSavesTab();

        this.panel.appendChild(this.contentContainer);
    }

    createGeneralTab() {
        this.generalTab = this.createTabContent('general', [
            {
                type: 'section',
                title: 'Interface',
                settings: [
                    {
                        type: 'select',
                        key: 'fontSize',
                        label: 'Font Size',
                        options: [
                            { value: 'small', label: 'Small' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'large', label: 'Large' },
                            { value: 'x-large', label: 'Extra Large' }
                        ]
                    },
                    {
                        type: 'select',
                        key: 'theme',
                        label: 'Theme',
                        options: [
                            { value: 'dark', label: 'Dark (Default)' },
                            { value: 'light', label: 'Light' },
                            { value: 'high-contrast', label: 'High Contrast' }
                        ]
                    },
                    {
                        type: 'toggle',
                        key: 'showNotifications',
                        label: 'Show Notifications',
                        description: 'Display popup notifications for events'
                    },
                    {
                        type: 'toggle',
                        key: 'compactMode',
                        label: 'Compact Mode',
                        description: 'Reduce spacing and padding in UI elements'
                    }
                ]
            },
            {
                type: 'section',
                title: 'Accessibility',
                settings: [
                    {
                        type: 'toggle',
                        key: 'reducedMotion',
                        label: 'Reduce Motion',
                        description: 'Minimize animations and transitions'
                    },
                    {
                        type: 'toggle',
                        key: 'highContrast',
                        label: 'High Contrast',
                        description: 'Increase color contrast for better visibility'
                    }
                ]
            }
        ]);
    }

    createAudioTab() {
        this.audioTab = this.createTabContent('audio', [
            {
                type: 'section',
                title: 'Volume Control',
                settings: [
                    {
                        type: 'toggle',
                        key: 'muteAll',
                        label: 'Mute All Audio',
                        description: 'Disable all game sounds'
                    },
                    {
                        type: 'slider',
                        key: 'masterVolume',
                        label: 'Master Volume',
                        min: 0,
                        max: 1,
                        step: 0.1,
                        format: 'percentage'
                    },
                    {
                        type: 'slider',
                        key: 'musicVolume',
                        label: 'Music Volume',
                        min: 0,
                        max: 1,
                        step: 0.1,
                        format: 'percentage'
                    },
                    {
                        type: 'slider',
                        key: 'sfxVolume',
                        label: 'Sound Effects',
                        min: 0,
                        max: 1,
                        step: 0.1,
                        format: 'percentage'
                    },
                    {
                        type: 'slider',
                        key: 'ambientVolume',
                        label: 'Ambient Sounds',
                        min: 0,
                        max: 1,
                        step: 0.1,
                        format: 'percentage'
                    }
                ]
            }
        ]);
    }

    createGraphicsTab() {
        this.graphicsTab = this.createTabContent('graphics', [
            {
                type: 'section',
                title: 'Visual Effects',
                settings: [
                    {
                        type: 'toggle',
                        key: 'particleEffects',
                        label: 'Particle Effects',
                        description: 'Enable particle systems and visual effects'
                    },
                    {
                        type: 'toggle',
                        key: 'animations',
                        label: 'UI Animations',
                        description: 'Enable smooth transitions and animations'
                    },
                    {
                        type: 'toggle',
                        key: 'screenShake',
                        label: 'Screen Shake',
                        description: 'Enable screen shake effects for impact'
                    },
                    {
                        type: 'toggle',
                        key: 'backgroundAnimation',
                        label: 'Animated Background',
                        description: 'Enable animated background elements'
                    }
                ]
            },
            {
                type: 'section',
                title: 'Performance',
                settings: [
                    {
                        type: 'select',
                        key: 'renderQuality',
                        label: 'Render Quality',
                        options: [
                            { value: 'low', label: 'Low (Better Performance)' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High (Better Quality)' }
                        ]
                    },
                    {
                        type: 'select',
                        key: 'targetFPS',
                        label: 'Target FPS',
                        options: [
                            { value: 30, label: '30 FPS' },
                            { value: 60, label: '60 FPS' },
                            { value: 120, label: '120 FPS' },
                            { value: 0, label: 'Unlimited' }
                        ]
                    },
                    {
                        type: 'toggle',
                        key: 'vsync',
                        label: 'V-Sync',
                        description: 'Synchronize frame rate with display refresh rate'
                    }
                ]
            }
        ]);
    }

    createGameplayTab() {
        this.gameplayTab = this.createTabContent('gameplay', [
            {
                type: 'section',
                title: 'Save Settings',
                settings: [
                    {
                        type: 'toggle',
                        key: 'autosave',
                        label: 'Enable Autosave',
                        description: 'Automatically save game progress'
                    },
                    {
                        type: 'slider',
                        key: 'autosaveInterval',
                        label: 'Autosave Interval',
                        min: 30,
                        max: 300,
                        step: 30,
                        format: 'seconds'
                    }
                ]
            },
            {
                type: 'section',
                title: 'Assistance',
                settings: [
                    {
                        type: 'toggle',
                        key: 'showTooltips',
                        label: 'Show Tooltips',
                        description: 'Display helpful tooltips and explanations'
                    },
                    {
                        type: 'toggle',
                        key: 'confirmDangerousActions',
                        label: 'Confirm Dangerous Actions',
                        description: 'Ask for confirmation before risky decisions'
                    },
                    {
                        type: 'toggle',
                        key: 'showAdvancedStats',
                        label: 'Show Advanced Statistics',
                        description: 'Display detailed performance metrics'
                    }
                ]
            },
            {
                type: 'section',
                title: 'Game Behavior',
                settings: [
                    {
                        type: 'toggle',
                        key: 'pauseOnFocusLoss',
                        label: 'Pause When Unfocused',
                        description: 'Pause game when window loses focus'
                    }
                ]
            }
        ]);
    }

    createSavesTab() {
        this.savesTab = this.createTabContent('saves', [
            {
                type: 'section',
                title: 'Save Management',
                settings: [
                    {
                        type: 'custom',
                        content: this.createSaveManagementPanel()
                    }
                ]
            }
        ]);
    }

    createTabContent(tabId, sections) {
        const tabContent = document.createElement('div');
        tabContent.className = 'settings-tab-content';
        tabContent.dataset.tab = tabId;
        tabContent.style.cssText = `
            display: ${tabId === this.activeTab ? 'block' : 'none'};
        `;

        sections.forEach(section => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'settings-section';
            sectionElement.style.cssText = `
                margin-bottom: 30px;
                padding: 20px;
                background: rgba(0, 255, 255, 0.05);
                border-radius: 10px;
                border: 1px solid rgba(0, 255, 255, 0.1);
            `;

            const sectionTitle = document.createElement('h3');
            sectionTitle.textContent = section.title;
            sectionTitle.style.cssText = `
                margin: 0 0 20px 0;
                color: #00ffff;
                font-size: 1.2em;
                border-bottom: 1px solid rgba(0, 255, 255, 0.3);
                padding-bottom: 10px;
                text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
            `;

            sectionElement.appendChild(sectionTitle);

            section.settings.forEach(setting => {
                const settingElement = this.createSettingElement(setting);
                sectionElement.appendChild(settingElement);
            });

            tabContent.appendChild(sectionElement);
        });

        this.contentContainer.appendChild(tabContent);
        return tabContent;
    }

    createSettingElement(setting) {
        const container = document.createElement('div');
        container.className = 'setting-item';
        container.style.cssText = `
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 40px;
        `;

        const labelContainer = document.createElement('div');
        labelContainer.style.cssText = `
            flex: 1;
            margin-right: 20px;
        `;

        const label = document.createElement('label');
        label.textContent = setting.label;
        label.style.cssText = `
            color: #e0e0e0;
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        `;

        labelContainer.appendChild(label);

        if (setting.description) {
            const description = document.createElement('div');
            description.textContent = setting.description;
            description.style.cssText = `
                color: #aaa;
                font-size: 0.85em;
                line-height: 1.3;
            `;
            labelContainer.appendChild(description);
        }

        const controlContainer = document.createElement('div');
        controlContainer.style.cssText = `
            min-width: 200px;
            text-align: right;
        `;

        let control;
        switch (setting.type) {
            case 'toggle':
                control = this.createToggleControl(setting);
                break;
            case 'slider':
                control = this.createSliderControl(setting);
                break;
            case 'select':
                control = this.createSelectControl(setting);
                break;
            case 'custom':
                return setting.content;
            default:
                control = document.createElement('div');
        }

        controlContainer.appendChild(control);
        container.appendChild(labelContainer);
        container.appendChild(controlContainer);

        return container;
    }

    createToggleControl(setting) {
        const toggle = document.createElement('div');
        toggle.className = 'toggle-switch';
        toggle.style.cssText = `
            width: 60px;
            height: 30px;
            background: ${this.settings[setting.key] ? '#00ffff' : '#333'};
            border-radius: 15px;
            position: relative;
            cursor: pointer;
            transition: background 0.3s;
            border: 2px solid ${this.settings[setting.key] ? '#00ffff' : '#666'};
        `;

        const slider = document.createElement('div');
        slider.style.cssText = `
            width: 24px;
            height: 24px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 1px;
            left: ${this.settings[setting.key] ? '33px' : '1px'};
            transition: left 0.3s;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        `;

        toggle.appendChild(slider);

        toggle.addEventListener('click', () => {
            this.settings[setting.key] = !this.settings[setting.key];
            this.updateToggleControl(toggle, slider, this.settings[setting.key]);
            this.saveSettings();
        });

        return toggle;
    }

    updateToggleControl(toggle, slider, value) {
        toggle.style.background = value ? '#00ffff' : '#333';
        toggle.style.borderColor = value ? '#00ffff' : '#666';
        slider.style.left = value ? '33px' : '1px';
    }

    createSliderControl(setting) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = setting.min;
        slider.max = setting.max;
        slider.step = setting.step;
        slider.value = this.settings[setting.key];
        slider.style.cssText = `
            flex: 1;
            min-width: 120px;
            height: 5px;
            background: #333;
            outline: none;
            border-radius: 3px;
        `;

        const valueDisplay = document.createElement('span');
        valueDisplay.style.cssText = `
            color: #00ffff;
            font-weight: bold;
            min-width: 50px;
            text-align: right;
        `;

        const updateDisplay = () => {
            const value = parseFloat(slider.value);
            switch (setting.format) {
                case 'percentage':
                    valueDisplay.textContent = `${Math.round(value * 100)}%`;
                    break;
                case 'seconds':
                    valueDisplay.textContent = `${value}s`;
                    break;
                default:
                    valueDisplay.textContent = value.toString();
            }
        };

        updateDisplay();

        slider.addEventListener('input', () => {
            this.settings[setting.key] = parseFloat(slider.value);
            updateDisplay();
            this.saveSettings();
        });

        container.appendChild(slider);
        container.appendChild(valueDisplay);

        return container;
    }

    createSelectControl(setting) {
        const select = document.createElement('select');
        select.style.cssText = `
            background: #1a1a2e;
            border: 2px solid #00ffff;
            border-radius: 5px;
            color: #e0e0e0;
            padding: 8px 12px;
            font-family: inherit;
            min-width: 150px;
            cursor: pointer;
        `;

        setting.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            optionElement.selected = this.settings[setting.key] == option.value;
            select.appendChild(optionElement);
        });

        select.addEventListener('change', () => {
            const value = setting.options.find(opt => opt.value == select.value)?.value;
            this.settings[setting.key] = value;
            this.saveSettings();
        });

        return select;
    }

    createSaveManagementPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 20px;
        `;

        const saveInfo = document.createElement('div');
        saveInfo.style.cssText = `
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(0, 255, 255, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 255, 0.3);
        `;

        const gameStats = this.gameState.getSaveStats();
        saveInfo.innerHTML = `
            <h4 style="color: #00ffff; margin: 0 0 10px 0;">Current Save Information</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; color: #e0e0e0;">
                <div>Play Time: ${this.formatPlayTime(gameStats.playTime)}</div>
                <div>Targets Completed: ${gameStats.targetsCompleted}</div>
                <div>Total Funds Earned: ${this.formatCurrency(gameStats.totalFundsEarned)}</div>
                <div>Current Level: ${gameStats.level}</div>
                <div>Last Saved: ${new Date(gameStats.lastSaved).toLocaleString()}</div>
                <div>Save Version: ${gameStats.version}</div>
            </div>
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 20px;
        `;

        const buttons = [
            {
                text: 'Manual Save',
                action: () => this.manualSave(),
                style: 'primary'
            },
            {
                text: 'Export Save',
                action: () => this.exportSave(),
                style: 'secondary'
            },
            {
                text: 'Import Save',
                action: () => this.importSave(),
                style: 'secondary'
            },
            {
                text: 'Reset Progress',
                action: () => this.resetProgress(),
                style: 'danger'
            }
        ];

        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.textContent = button.text;
            btn.style.cssText = this.getButtonStyle(button.style);
            btn.addEventListener('click', button.action);
            buttonContainer.appendChild(btn);
        });

        panel.appendChild(saveInfo);
        panel.appendChild(buttonContainer);

        return panel;
    }

    getButtonStyle(type) {
        const baseStyle = `
            padding: 12px 20px;
            border-radius: 8px;
            font-family: inherit;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            border: 2px solid;
        `;

        switch (type) {
            case 'primary':
                return baseStyle + `
                    background: linear-gradient(135deg, #00ffff, #0099cc);
                    border-color: #00ffff;
                    color: #000;
                `;
            case 'secondary':
                return baseStyle + `
                    background: transparent;
                    border-color: #00ffff;
                    color: #00ffff;
                `;
            case 'danger':
                return baseStyle + `
                    background: transparent;
                    border-color: #ff6b6b;
                    color: #ff6b6b;
                `;
            default:
                return baseStyle;
        }
    }

    createFooter() {
        this.footer = document.createElement('div');
        this.footer.className = 'settings-footer';
        this.footer.style.cssText = `
            padding: 20px 25px;
            border-top: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0, 0, 0, 0.2);
        `;

        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset to Defaults';
        resetButton.style.cssText = `
            background: transparent;
            border: 2px solid #ff6b6b;
            color: #ff6b6b;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.3s;
        `;

        resetButton.addEventListener('click', () => this.resetToDefaults());

        const saveStatus = document.createElement('div');
        saveStatus.className = 'save-status';
        saveStatus.style.cssText = `
            color: #90ee90;
            font-size: 0.9em;
        `;
        saveStatus.textContent = 'Settings saved automatically';

        this.footer.appendChild(resetButton);
        this.footer.appendChild(saveStatus);
        this.panel.appendChild(this.footer);
    }

    bindEvents() {
        this.closeButton.addEventListener('click', () => this.hide());

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Tab switching
        this.tabContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.settings-tab');
            if (tab) {
                this.switchTab(tab.dataset.tab);
            }
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        // Update tab buttons
        const tabs = this.tabContainer.querySelectorAll('.settings-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabId) {
                this.setActiveTab(tab);
            } else {
                this.setInactiveTab(tab);
            }
        });

        // Update content
        const contents = this.contentContainer.querySelectorAll('.settings-tab-content');
        contents.forEach(content => {
            content.style.display = content.dataset.tab === tabId ? 'block' : 'none';
        });
    }

    setActiveTab(tab) {
        tab.style.color = '#00ffff';
        tab.style.borderBottomColor = '#00ffff';
        tab.style.background = 'rgba(0, 255, 255, 0.1)';
    }

    setInactiveTab(tab) {
        tab.style.color = '#888';
        tab.style.borderBottomColor = 'transparent';
        tab.style.background = 'none';
    }

    show() {
        this.isVisible = true;
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.style.opacity = '1';
        }, 10);
        
        // Refresh save info if on saves tab
        if (this.activeTab === 'saves') {
            this.refreshSaveInfo();
        }
    }

    hide() {
        this.isVisible = false;
        this.overlay.style.opacity = '0';
        setTimeout(() => {
            this.overlay.style.display = 'none';
        }, 300);
    }

    applySettings() {
        // Apply audio settings
        if (this.uiManager.audioManager) {
            this.uiManager.audioManager.setMasterVolume(this.settings.masterVolume);
            this.uiManager.audioManager.setMusicVolume(this.settings.musicVolume);
            this.uiManager.audioManager.setSFXVolume(this.settings.sfxVolume);
            this.uiManager.audioManager.setAmbientVolume(this.settings.ambientVolume);
            this.uiManager.audioManager.setMuted(this.settings.muteAll);
        }

        // Apply graphics settings
        this.applyGraphicsSettings();
        
        // Apply interface settings
        this.applyInterfaceSettings();
        
        // Apply gameplay settings
        this.applyGameplaySettings();
        
        // Notify other systems
        this.uiManager.onSettingsChanged?.(this.settings);
    }

    applyGraphicsSettings() {
        const root = document.documentElement;
        
        // Particle effects
        root.style.setProperty('--particles-enabled', this.settings.particleEffects ? '1' : '0');
        
        // Animations
        if (!this.settings.animations || this.settings.reducedMotion) {
            root.style.setProperty('--animation-duration', '0s');
            root.style.setProperty('--transition-duration', '0s');
        } else {
            root.style.setProperty('--animation-duration', '0.3s');
            root.style.setProperty('--transition-duration', '0.3s');
        }
        
        // Background animation
        const backgrounds = document.querySelectorAll('.animated-background');
        backgrounds.forEach(bg => {
            bg.style.animationPlayState = this.settings.backgroundAnimation ? 'running' : 'paused';
        });
        
        // High contrast mode
        if (this.settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }

    applyInterfaceSettings() {
        const root = document.documentElement;
        
        // Font size
        const fontSizes = {
            'small': '0.85em',
            'medium': '1em',
            'large': '1.15em',
            'x-large': '1.3em'
        };
        root.style.setProperty('--base-font-size', fontSizes[this.settings.fontSize]);
        
        // Theme
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${this.settings.theme}`);
        
        // Compact mode
        if (this.settings.compactMode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
    }

    applyGameplaySettings() {
        // Autosave settings
        if (this.gameState.autosaveManager) {
            this.gameState.autosaveManager.setEnabled(this.settings.autosave);
            this.gameState.autosaveManager.setInterval(this.settings.autosaveInterval * 1000);
        }
        
        // Tooltip settings
        if (this.uiManager.tooltipManager) {
            this.uiManager.tooltipManager.setEnabled(this.settings.showTooltips);
        }
        
        // Store settings in game state for access by other systems
        this.gameState.settings = this.settings;
    }

    resetToDefaults() {
        if (confirm('Reset all settings to default values? This cannot be undone.')) {
            this.settings = this.loadSettings();
            localStorage.removeItem('cyberInfiltrator_settings');
            this.settings = this.loadSettings(); // Reload defaults
            this.refreshAllControls();
            this.applySettings();
        }
    }

    refreshAllControls() {
        // Refresh all toggle controls
        const toggles = this.panel.querySelectorAll('.toggle-switch');
        toggles.forEach((toggle, index) => {
            const slider = toggle.querySelector('div');
            const setting = this.getSettingFromElement(toggle);
            if (setting) {
                this.updateToggleControl(toggle, slider, this.settings[setting]);
            }
        });

        // Refresh all sliders
        const sliders = this.panel.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            const setting = this.getSettingFromElement(slider);
            if (setting) {
                slider.value = this.settings[setting];
                slider.dispatchEvent(new Event('input'));
            }
        });

        // Refresh all selects
        const selects = this.panel.querySelectorAll('select');
        selects.forEach(select => {
            const setting = this.getSettingFromElement(select);
            if (setting) {
                select.value = this.settings[setting];
            }
        });
    }

    getSettingFromElement(element) {
        // This is a simplified approach - in a real implementation,
        // you'd want to store setting keys as data attributes
        const settingMap = {
            'masterVolume': 'masterVolume',
            'musicVolume': 'musicVolume',
            'sfxVolume': 'sfxVolume',
            'ambientVolume': 'ambientVolume',
            // Add more mappings as needed
        };
        
        // Find the setting key for this element
        // This would be more robust with proper data attributes
        return Object.keys(this.settings).find(key => 
            element.closest('.setting-item')?.textContent.includes(key)
        );
    }

    // Save management methods
    manualSave() {
        try {
            this.gameState.save();
            this.showSaveStatus('Game saved successfully!', 'success');
        } catch (error) {
            this.showSaveStatus('Failed to save game: ' + error.message, 'error');
        }
    }

    exportSave() {
        try {
            const saveData = this.gameState.exportSave();
            const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `cyber_infiltrator_save_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSaveStatus('Save exported successfully!', 'success');
        } catch (error) {
            this.showSaveStatus('Failed to export save: ' + error.message, 'error');
        }
    }

    importSave() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    if (confirm('Import this save? This will overwrite your current progress!')) {
                        this.gameState.importSave(saveData);
                        this.showSaveStatus('Save imported successfully!', 'success');
                        this.refreshSaveInfo();
                    }
                } catch (error) {
                    this.showSaveStatus('Failed to import save: Invalid file format', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    resetProgress() {
        const confirmText = 'DELETE ALL PROGRESS';
        const userInput = prompt(
            `This will permanently delete ALL your progress!\n\nType "${confirmText}" to confirm:`
        );
        
        if (userInput === confirmText) {
            this.gameState.resetProgress();
            this.showSaveStatus('All progress has been reset', 'success');
            this.refreshSaveInfo();
        }
    }

    refreshSaveInfo() {
        const saveInfo = this.panel.querySelector('.save-info');
        if (saveInfo) {
            const gameStats = this.gameState.getSaveStats();
            // Update save info display
            // Implementation would update the HTML content
        }
    }

    showSaveStatus(message, type) {
        const status = document.createElement('div');
        status.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 3000;
            animation: slideInRight 0.3s ease-out;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            border: 2px solid ${type === 'success' ? '#45a049' : '#da190b'};
        `;
        status.textContent = message;
        
        document.body.appendChild(status);
        
        setTimeout(() => {
            status.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (status.parentNode) {
                    status.parentNode.removeChild(status);
                }
            }, 300);
        }, 3000);
    }

    formatPlayTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    formatCurrency(amount) {
        if (Math.abs(amount) >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (Math.abs(amount) >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        }
        return `${amount}`;
    }

    // Public interface
    getSettings() {
        return { ...this.settings };
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    getSetting(key) {
        return this.settings[key];
    }

    isOpen() {
        return this.isVisible;
    }

    // Cleanup
    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

// Additional CSS for animations
const settingsStyle = document.createElement('style');
settingsStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideIn {
        from { 
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
        }
        to { 
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes slideInRight {
        from { 
            opacity: 0;
            transform: translateX(100%);
        }
        to { 
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from { 
            opacity: 1;
            transform: translateX(0);
        }
        to { 
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .settings-close-btn:hover {
        background: rgba(255, 107, 107, 0.2);
        transform: scale(1.05);
    }
    
    .settings-tab:hover {
        background: rgba(0, 255, 255, 0.05) !important;
        color: #00ffff !important;
    }
    
    /* Custom scrollbar for settings content */
    .settings-content::-webkit-scrollbar {
        width: 8px;
    }
    
    .settings-content::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }
    
    .settings-content::-webkit-scrollbar-thumb {
        background: rgba(0, 255, 255, 0.5);
        border-radius: 4px;
    }
    
    .settings-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 255, 255, 0.7);
    }
    
    /* Theme classes */
    .theme-light {
        --bg-primary: #f5f5f5;
        --text-primary: #333;
        --accent-color: #007acc;
    }
    
    .theme-high-contrast {
        --bg-primary: #000;
        --text-primary: #fff;
        --accent-color: #ffff00;
    }
    
    .high-contrast {
        filter: contrast(1.5);
    }
    
    .compact-mode .setting-item {
        margin-bottom: 10px !important;
        min-height: 30px !important;
    }
    
    .compact-mode .settings-section {
        padding: 15px !important;
        margin-bottom: 20px !important;
    }
    
    /* Range slider styling */
    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
    }
    
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #00ffff;
        cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }
    
    input[type="range"]::-moz-range-thumb {
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #00ffff;
        cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }
    
    input[type="range"]::-webkit-slider-track {
        height: 5px;
        background: linear-gradient(to right, #00ffff, #333);
        border-radius: 3px;
    }
    
    input[type="range"]::-moz-range-track {
        height: 5px;
        background: linear-gradient(to right, #00ffff, #333);
        border-radius: 3px;
    }
`;

if (!document.head.querySelector('style[data-settings-ui]')) {
    settingsStyle.setAttribute('data-settings-ui', 'true');
    document.head.appendChild(settingsStyle);
}

window.SettingsUI = SettingsUI;