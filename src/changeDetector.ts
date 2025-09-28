import * as vscode from 'vscode';
import { GitManager } from './gitManager';

/**
 * 🚀 ChangeDetector - The Sherlock Holmes of Code Changes! 🕵️‍♂️
 * 
 * This class is basically a digital detective that watches your typing patterns
 * and tries to figure out: "Did a human type this, or did an AI just dump a 
 * whole function on your screen faster than you can say 'wait, what?'"
 * 
 * It's like having a very nosy roommate who's really good at math and 
 * really bad at minding their own business. But in a helpful way! 😄
 */
export class ChangeDetector {
    private gitManager: GitManager;
    private disposables: vscode.Disposable[] = [];
    private lastCommitHash: string | null = null;
    private isEnabled: boolean = true;
    
    // Typing Speed Tracking - Because apparently we're all speed demons now 🏎️
    private typingSessions: Array<{timestamp: number, characters: number, duration: number}> = [];
    private currentSession: {startTime: number, characters: number} | null = null;
    private isHumanTyping: boolean = true; // Default to human, only set to AI when confident
    private lastUserAction: number = 0;
    
    // WPM Tracking for logging changes
    private lastWPM: number | null = null;
    private lastTypingMode: boolean | null = null; // true = human, false = AI
    
    // File Save Tracking - The moment of truth! 🎭
    private pendingChanges: Map<string, boolean> = new Map(); // fileUri -> isAI

    constructor(gitManager: GitManager) {
        this.gitManager = gitManager;
    }

    async initialize(): Promise<void> {
        // Get initial commit hash - because we need to know where we started this wild journey
        this.lastCommitHash = await this.gitManager.getLastCommit();

        // Set up configuration change listener - because users love to change their minds
        const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cursorGit.enabled')) {
                this.updateEnabledState();
            }
        });

        // Set up text document change listener for typing speed analysis
        // This is where the magic happens - we're basically stalking your keystrokes! 👀
        const textChangeListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
            if (this.isEnabled) {
                this.analyzeTypingSpeed(event);
            }
        });

        // Set up file save listener for auto-commit
        // The moment of truth - do we commit or do we not? That is the question! 🤔
        const fileSaveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
            if (this.isEnabled && this.shouldAutoCommit()) {
                await this.handleFileSave(document);
            }
        });

        // Set up undo/redo listeners to detect user actions
        // Because humans are the only ones who make mistakes and then undo them! 😅
        const undoListener = vscode.commands.registerCommand('undo', () => {
            this.flagHumanAction('undo');
            return vscode.commands.executeCommand('default:undo');
        });

        const redoListener = vscode.commands.registerCommand('redo', () => {
            this.flagHumanAction('redo');
            return vscode.commands.executeCommand('default:redo');
        });

        this.disposables.push(
            configChangeListener,
            textChangeListener,
            fileSaveListener,
            undoListener,
            redoListener
        );

        await this.updateEnabledState();
    }

    private async updateEnabledState(): Promise<void> {
        const config = vscode.workspace.getConfiguration('cursorGit');
        this.isEnabled = config.get('enabled', true);
    }

    private shouldAutoCommit(): boolean {
        const config = vscode.workspace.getConfiguration('cursorGit');
        const frequency = config.get<string>('commitFrequency', 'onSave');
        
        switch (frequency) {
            case 'immediate':
                return true;
            case 'onSave':
                return true;
            case 'manual':
                return false;
            default:
                return true;
        }
    }

    private analyzeTypingSpeed(event: any): void {
        const now = Date.now();
        
        // Skip undo operations
        if (event.kind === vscode.TextDocumentChangeReason.Undo) {
            this.flagHumanAction('undo');
            return;
        }

        // Analyze each content change
        if (event.contentChanges && event.contentChanges.length > 0) {
            for (const change of event.contentChanges) {
                this.processChange(change, now);
            }
        }
    }

    private processChange(change: any, timestamp: number): void {
        const text = change.text || '';
        const textLength = text.length;
        
        // Detect human-only actions that override WPM
        if (this.isHumanOnlyAction(change)) {
            this.flagHumanAction('human-action');
            return;
        }

        // Start new session if none exists
        if (!this.currentSession) {
            this.currentSession = {
                startTime: timestamp,
                characters: textLength
            };
            return;
        }

        // Get configuration values - because one size doesn't fit all! 👕
        const config = vscode.workspace.getConfiguration('cursorGit');
        const sessionTimeout = config.get<number>('sessionTimeout', 2000);
        const minCharacters = config.get<number>('minCharactersForAnalysis', 10);
        
        // Calculate time since last change - because timing is everything! ⏰
        const timeSinceLastChange = timestamp - this.currentSession.startTime;
        
        // If more than session timeout has passed, start a new session
        // Because even the best conversations have pauses! 🤐
        if (timeSinceLastChange > sessionTimeout) {
            this.finalizeCurrentSession();
            this.currentSession = {
                startTime: timestamp,
                characters: textLength
            };
            return;
        }

        // Add characters to current session - because every character counts! 🔢
        this.currentSession.characters += textLength;

        // If session has enough data, analyze typing speed
        // This is where we become the typing speed police! 🚔
        if (this.currentSession.characters >= minCharacters) {
            const wpm = this.calculateWPM(this.currentSession.characters, timeSinceLastChange);
            const speedThreshold = config.get<number>('typingSpeedThreshold', 150);
            
            // Log WPM change if it's different from the last value
            if (this.lastWPM === null || Math.abs(wpm - this.lastWPM) > 0.1) {
                console.log(`📊 WPM Update: ${wpm.toFixed(1)} WPM (previous: ${this.lastWPM ? this.lastWPM.toFixed(1) : 'N/A'})`);
                this.lastWPM = wpm;
            }
            
            const newTypingMode = wpm > speedThreshold ? false : true; // false = AI, true = Human
            
            // Log typing mode change if it's different from the last mode
            if (this.lastTypingMode === null || this.lastTypingMode !== newTypingMode) {
                const modeText = newTypingMode ? 'Human' : 'AI';
                const previousModeText = this.lastTypingMode === null ? 'Unknown' : (this.lastTypingMode ? 'Human' : 'AI');
                console.log(`🔄 Typing Mode Change: ${previousModeText} → ${modeText} (${wpm.toFixed(1)} WPM, threshold: ${speedThreshold})`);
                this.lastTypingMode = newTypingMode;
            }
            
            if (wpm > speedThreshold) {
                this.isHumanTyping = false; // AI typing detected - BUSTED! 🚨
                console.log(`AI typing detected: ${wpm.toFixed(1)} WPM (threshold: ${speedThreshold})`);
            } else {
                this.isHumanTyping = true; // Human typing confirmed - you're safe! ✅
                console.log(`Human typing confirmed: ${wpm.toFixed(1)} WPM (threshold: ${speedThreshold})`);
            }
        }
    }

    private isHumanOnlyAction(change: any): boolean {
        const text = change.text || '';
        
        // Detect deletions (backspace, delete key) - because humans love to delete things! 🗑️
        if (text === '' && change.rangeLength > 0) {
            return true;
        }
        
        // Detect backspace patterns (single character deletions) - the classic human move! ⌫
        if (text.length === 0 && change.rangeLength === 1) {
            return true;
        }
        
        // Detect very small changes (likely manual editing) - because humans are detail-oriented! 🔍
        if (text.length <= 2 && change.rangeLength <= 2) {
            return true;
        }
        
        // Detect copy/paste patterns (large text blocks with no typing delay)
        // Because humans are lazy and AI is... well, also lazy but in a different way! 😴
        if (text.length > 50 && change.rangeLength === 0) {
            // Large text insertion with no deletion - likely copy/paste
            return true;
        }
        
        return false;
    }

    private calculateWPM(characters: number, durationMs: number): number {
        // Convert to words per minute - because we're all about that WPM life! 📊
        // 1 word = 5 characters (standard) - because apparently that's how words work! 🤷‍♂️
        const words = characters / 5;
        const minutes = durationMs / (1000 * 60);
        return words / minutes;
    }

    private finalizeCurrentSession(): void {
        if (this.currentSession) {
            const duration = Date.now() - this.currentSession.startTime;
            this.typingSessions.push({
                timestamp: this.currentSession.startTime,
                characters: this.currentSession.characters,
                duration: duration
            });
            
            // Keep only last 10 sessions - because we're not hoarders! 🏠
            if (this.typingSessions.length > 10) {
                this.typingSessions.shift();
            }
            
            this.currentSession = null;
        }
    }

    private flagHumanAction(action: string): void {
        const now = Date.now();
        this.isHumanTyping = true;
        this.lastUserAction = now;
        console.log(`Human action detected: ${action} - because humans are the only ones who ${action}! 🧑‍💻`);
        
        // Reset WPM tracking when human action is detected
        this.lastWPM = null;
        this.lastTypingMode = null;
    }

    private async handleFileSave(document: vscode.TextDocument): Promise<void> {
        const fileUri = document.uri.toString();
        
        // Check if we have pending changes for this file - the moment of truth! 🎭
        const isAI = this.pendingChanges.get(fileUri) || this.isHumanTyping === false;
        
        if (isAI) {
            console.log(`Auto-committing AI changes for file: ${document.fileName} - because AI deserves credit too! 🤖`);
            await this.commitChanges(document);
        } else {
            console.log(`Skipping commit for human changes: ${document.fileName} - because humans need to learn to commit their own work! 😄`);
        }
        
        // Clear pending changes for this file - because we're not messy! 🧹
        this.pendingChanges.delete(fileUri);
    }

    private async commitChanges(document: vscode.TextDocument): Promise<void> {
        try {
            // Check if there are actually changes to commit - because we're not here to waste time! ⏰
            const modifiedFiles = await this.gitManager.getModifiedFiles();
            if (modifiedFiles.length === 0) {
                return;
            }

            const result = await this.gitManager.stageAndCommit();
            if (result.success) {
                this.lastCommitHash = result.hash || null;
                this.showCommitNotification(result.message);
            }
        } catch (error) {
            console.error('Error handling AI-generated change:', error);
        }
    }

    private showCommitNotification(message: string): void {
        const config = vscode.workspace.getConfiguration('cursorGit');
        const showNotifications = config.get('showNotifications', true);
        
        if (showNotifications) {
            vscode.window.showInformationMessage(
                `AI Change Committed: ${message} - because even AI needs a pat on the back! 🤖✨`,
                'View Changes',
                'Revert'
            ).then(selection => {
                if (selection === 'View Changes') {
                    vscode.commands.executeCommand('git.openChange');
                } else if (selection === 'Revert') {
                    this.revertLastCommit();
                }
            });
        }
    }

    private async revertLastCommit(): Promise<void> {
        const result = await vscode.window.showWarningMessage(
            'Are you sure you want to revert the last commit? - because sometimes we all make mistakes! 😅',
            'Yes', 'No'
        );

        if (result === 'Yes') {
            const success = await this.gitManager.revertLastCommit();
            if (success) {
                vscode.window.showInformationMessage('Last commit reverted successfully - because second chances are beautiful! 🌈');
            } else {
                vscode.window.showErrorMessage('Failed to revert last commit - because sometimes life just doesn\'t work out! 😢');
            }
        }
    }

    // Public method to manually set AI flag (for testing or external triggers)
    // Because sometimes you just need to take control! 🎮
    public setAIFlag(isAI: boolean): void {
        this.isHumanTyping = !isAI;
        console.log(`AI flag manually set to: ${isAI} - because you\'re the boss! 👑`);
    }

    // Public method to get current typing status
    // Because knowledge is power! 💪
    public getTypingStatus(): {isHuman: boolean, lastUserAction: number} {
        return {
            isHuman: this.isHumanTyping,
            lastUserAction: this.lastUserAction
        };
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.finalizeCurrentSession();
    }
}