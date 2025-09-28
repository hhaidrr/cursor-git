import * as vscode from 'vscode';
import { GitManager } from './gitManager';
// some random
export class ChangeDetector {
    private gitManager: GitManager;
    private disposables: vscode.Disposable[] = [];
    private lastCommitHash: string | null = null;
    private isEnabled: boolean = true;
    
    // Typing Speed Tracking
    private typingSessions: Array<{timestamp: number, characters: number, duration: number}> = [];
    private currentSession: {startTime: number, characters: number} | null = null;
    private isHumanTyping: boolean = true; // Default to human, only set to AI when confident
    private lastUserAction: number = 0;
    
    // File Save Tracking
    private pendingChanges: Map<string, boolean> = new Map(); // fileUri -> isAI

    constructor(gitManager: GitManager) {
        this.gitManager = gitManager;
    }

    async initialize(): Promise<void> {
        // Get initial commit hash
        this.lastCommitHash = await this.gitManager.getLastCommit();

        // Set up configuration change listener
        const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cursorGit.enabled')) {
                this.updateEnabledState();
            }
        });

        // Set up text document change listener for typing speed analysis
        const textChangeListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
            if (this.isEnabled) {
                this.analyzeTypingSpeed(event);
            }
        });

        // Set up file save listener for auto-commit
        const fileSaveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
            if (this.isEnabled && this.shouldAutoCommit()) {
                await this.handleFileSave(document);
            }
        });

        // Set up undo/redo listeners to detect user actions
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
        
        // Detect user-only actions
        if (this.isUserOnlyAction(change)) {
            this.flagHumanAction('user-action');
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

        // Get configuration values
        const config = vscode.workspace.getConfiguration('cursorGit');
        const sessionTimeout = config.get<number>('sessionTimeout', 2000);
        const minCharacters = config.get<number>('minCharactersForAnalysis', 10);
        
        // Calculate time since last change
        const timeSinceLastChange = timestamp - this.currentSession.startTime;
        
        // If more than session timeout has passed, start a new session
        if (timeSinceLastChange > sessionTimeout) {
            this.finalizeCurrentSession();
            this.currentSession = {
                startTime: timestamp,
                characters: textLength
            };
            return;
        }

        // Add characters to current session
        this.currentSession.characters += textLength;

        // If session has enough data, analyze typing speed
        if (this.currentSession.characters >= minCharacters) {
            const wpm = this.calculateWPM(this.currentSession.characters, timeSinceLastChange);
            const speedThreshold = config.get<number>('typingSpeedThreshold', 150);
            
            if (wpm > speedThreshold) {
                this.isHumanTyping = false; // AI typing detected
                console.log(`AI typing detected: ${wpm.toFixed(1)} WPM (threshold: ${speedThreshold})`);
            } else {
                this.isHumanTyping = true; // Human typing confirmed
                console.log(`Human typing confirmed: ${wpm.toFixed(1)} WPM (threshold: ${speedThreshold})`);
            }
        }
    }

    private isUserOnlyAction(change: any): boolean {
        const text = change.text || '';
        
        // Detect deletions (user-only action)
        if (text === '' && change.rangeLength > 0) {
            return true;
        }
        
        // Detect backspace patterns (single character deletions)
        if (text.length === 0 && change.rangeLength === 1) {
            return true;
        }
        
        // Detect very small changes (likely manual editing)
        if (text.length <= 2 && change.rangeLength <= 2) {
            return true;
        }
        
        return false;
    }

    private calculateWPM(characters: number, durationMs: number): number {
        // Convert to words per minute
        // 1 word = 5 characters (standard)
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
            
            // Keep only last 10 sessions
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
        console.log(`Human action detected: ${action}`);
    }

    private async handleFileSave(document: vscode.TextDocument): Promise<void> {
        const fileUri = document.uri.toString();
        
        // Check if we have pending changes for this file
        const isAI = this.pendingChanges.get(fileUri) || this.isHumanTyping === false;
        
        if (isAI) {
            console.log(`Auto-committing AI changes for file: ${document.fileName}`);
            await this.commitChanges(document);
        } else {
            console.log(`Skipping commit for human changes: ${document.fileName}`);
        }
        
        // Clear pending changes for this file
        this.pendingChanges.delete(fileUri);
    }

    private async commitChanges(document: vscode.TextDocument): Promise<void> {
        try {
            // Check if there are actually changes to commit
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
                `AI Change Committed: ${message}`,
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
            'Are you sure you want to revert the last commit?',
            'Yes', 'No'
        );

        if (result === 'Yes') {
            const success = await this.gitManager.revertLastCommit();
            if (success) {
                vscode.window.showInformationMessage('Last commit reverted successfully');
            } else {
                vscode.window.showErrorMessage('Failed to revert last commit');
            }
        }
    }

    // Public method to manually set AI flag (for testing or external triggers)
    public setAIFlag(isAI: boolean): void {
        this.isHumanTyping = !isAI;
        console.log(`AI flag manually set to: ${isAI}`);
    }

    // Public method to get current typing status
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