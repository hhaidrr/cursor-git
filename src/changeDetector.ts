import * as vscode from 'vscode';
import { GitManager } from './gitManager';

export class ChangeDetector {
    private gitManager: GitManager;
    private disposables: vscode.Disposable[] = [];
    private lastCommitHash: string | null = null;
    private isEnabled: boolean = true;
    
    // AI Command Tracking
    private aiCommandExecuted: boolean = false;
    private aiCommandTimeout: NodeJS.Timeout | null = null;
    private lastAICommandTime: number = 0;
    private recentAICommands: string[] = [];
    
    // Change Pattern Tracking
    private recentChanges: Array<{timestamp: number, size: number, hasNewlines: boolean}> = [];
    private typingPattern: Array<{timestamp: number, interval: number}> = [];

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

        // Set up command execution listener to detect AI commands
        const commandListener = vscode.commands.registerCommand('*', async (command, ...args) => {
            if (this.isAIGeneratedCommand(command)) {
                this.flagAIGenerated(command);
            }
        });

        // Set up AI completion listener
        const aiCompletionListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
            if (this.isEnabled && this.isAIGeneratedChange(event) && this.shouldAutoCommit()) {
                // Debounce to avoid multiple commits for rapid changes
                setTimeout(async () => {
                    await this.handleAIGeneratedChange(event);
                }, 1000);
            }
        });

        // Set up cursor position change listener to detect AI completions
        const cursorChangeListener = vscode.window.onDidChangeTextEditorSelection(async (event) => {
            if (this.isEnabled && this.isAIGeneratedChange(event) && this.shouldAutoCommit()) {
                setTimeout(async () => {
                    await this.handleAIGeneratedChange(event);
                }, 1000);
            }
        });

        this.disposables.push(
            configChangeListener,
            commandListener,
            aiCompletionListener,
            cursorChangeListener
        );

        await this.updateEnabledState();
    }

    private async updateEnabledState(): Promise<void> {
        const config = vscode.workspace.getConfiguration('cursorGit');
        this.isEnabled = config.get('enabled', true);
    }

    private shouldAutoCommit(): boolean {
        const config = vscode.workspace.getConfiguration('cursorGit');
        const frequency = config.get<string>('commitFrequency', 'immediate');
        
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

    private async handleAIGeneratedChange(event: any): Promise<void> {
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

    private isAIGeneratedCommand(command: string): boolean {
        // Comprehensive list of Cursor AI commands
        const aiCommands = [
            'cursor.chat',
            'cursor.complete',
            'cursor.accept',
            'cursor.reject',
            'cursor.generateGitCommitMessage',
            'cursor.ask',
            'cursor.explain',
            'cursor.fix',
            'cursor.refactor',
            'cursor.optimize',
            'cursor.generate',
            'cursor.edit',
            'cursor.rewrite',
            'cursor.improve',
            'cursor.add',
            'cursor.remove',
            'cursor.replace',
            'cursor.insert',
            'cursor.append',
            'cursor.prepend',
            'cursor.continue',
            'cursor.stop',
            'cursor.undo',
            'cursor.redo',
            'cursor.acceptSuggestion',
            'cursor.rejectSuggestion',
            'cursor.showSuggestion',
            'cursor.hideSuggestion',
            'cursor.nextSuggestion',
            'cursor.previousSuggestion',
            'cursor.toggleSuggestion',
            'cursor.acceptWord',
            'cursor.acceptLine',
            'cursor.acceptAll',
            'cursor.rejectAll',
            'cursor.acceptPartial',
            'cursor.rejectPartial'
        ];

        return aiCommands.some(aiCmd => 
            command.includes(aiCmd) || 
            command.startsWith(aiCmd) ||
            command.endsWith(aiCmd)
        );
    }

    private flagAIGenerated(command: string): void {
        const now = Date.now();
        this.aiCommandExecuted = true;
        this.lastAICommandTime = now;
        
        // Track recent AI commands (keep last 10)
        this.recentAICommands.unshift(command);
        if (this.recentAICommands.length > 10) {
            this.recentAICommands.pop();
        }
        
        // Clear any existing timeout
        if (this.aiCommandTimeout) {
            clearTimeout(this.aiCommandTimeout);
        }
        
        // Reset flag after 10 seconds (AI commands can take time to complete)
        this.aiCommandTimeout = setTimeout(() => {
            this.aiCommandExecuted = false;
        }, 10000);
        
        console.log(`AI command detected: ${command}`);
    }

    private isAIGeneratedChange(event: any): boolean {
        const now = Date.now();
        
        // Skip undo operations
        if (event.kind === vscode.TextDocumentChangeReason.Undo) {
            return false;
        }

        // PRIMARY DETECTION: Recent AI command execution
        if (this.aiCommandExecuted && (now - this.lastAICommandTime) < 10000) {
            console.log('AI change detected: recent AI command execution');
            return true;
        }

        // Track change patterns for analysis
        this.trackChangePattern(event, now);

        // SECONDARY DETECTION: Pattern-based heuristics
        return this.analyzeChangePatterns(event, now);
    }

    private trackChangePattern(event: any, timestamp: number): void {
        if (event.contentChanges && event.contentChanges.length > 0) {
            const totalChanges = event.contentChanges.reduce((sum: number, change: any) => {
                return sum + (change.text?.length || 0);
            }, 0);
            
            const hasNewlines = event.contentChanges.some((change: any) => {
                return change.text && change.text.includes('\n');
            });

            // Track recent changes (keep last 20)
            this.recentChanges.unshift({
                timestamp,
                size: totalChanges,
                hasNewlines
            });
            if (this.recentChanges.length > 20) {
                this.recentChanges.pop();
            }

            // Track typing intervals
            if (this.typingPattern.length > 0) {
                const lastTyping = this.typingPattern[0];
                const interval = timestamp - lastTyping.timestamp;
                this.typingPattern.unshift({ timestamp, interval });
                if (this.typingPattern.length > 10) {
                    this.typingPattern.pop();
                }
            } else {
                this.typingPattern.push({ timestamp, interval: 0 });
            }
        }
    }

    private analyzeChangePatterns(event: any, now: number): boolean {
        const config = vscode.workspace.getConfiguration('cursorGit');
        const minChangeThreshold = config.get<number>('aiChangeThreshold', 20);
        const aiConfidenceThreshold = config.get<number>('aiConfidenceThreshold', 0.7);

        // Calculate AI confidence score
        let confidence = 0;

        // 1. Size-based detection
        if (event.contentChanges && event.contentChanges.length > 0) {
            const totalChanges = event.contentChanges.reduce((sum: number, change: any) => {
                return sum + (change.text?.length || 0);
            }, 0);
            
            if (totalChanges > minChangeThreshold) {
                confidence += 0.3;
                console.log(`Size-based AI detection: ${totalChanges} characters`);
            }
        }

        // 2. Multi-line detection
        if (event.contentChanges && event.contentChanges.length > 0) {
            const hasMultiLineChanges = event.contentChanges.some((change: any) => {
                return change.text && change.text.includes('\n');
            });
            
            if (hasMultiLineChanges) {
                confidence += 0.2;
                console.log('Multi-line AI detection');
            }
        }

        // 3. Rapid change detection (AI often makes multiple rapid changes)
        const recentRapidChanges = this.recentChanges.filter(change => 
            (now - change.timestamp) < 2000 && change.size > 10
        );
        if (recentRapidChanges.length >= 3) {
            confidence += 0.2;
            console.log('Rapid change AI detection');
        }

        // 4. Typing pattern analysis (AI changes are usually faster than human typing)
        if (this.typingPattern.length >= 3) {
            const avgInterval = this.typingPattern.slice(0, 3).reduce((sum, pattern) => 
                sum + pattern.interval, 0) / 3;
            
            if (avgInterval < 100) { // Less than 100ms between changes
                confidence += 0.2;
                console.log('Fast typing pattern AI detection');
            }
        }

        // 5. Large block changes (AI often generates complete functions/blocks)
        if (event.contentChanges && event.contentChanges.length > 0) {
            const hasLargeBlock = event.contentChanges.some((change: any) => {
                return change.text && (
                    change.text.includes('function ') ||
                    change.text.includes('class ') ||
                    change.text.includes('interface ') ||
                    change.text.includes('const ') ||
                    change.text.includes('let ') ||
                    change.text.includes('var ')
                );
            });
            
            if (hasLargeBlock) {
                confidence += 0.1;
                console.log('Large block AI detection');
            }
        }

        const isAI = confidence >= aiConfidenceThreshold;
        if (isAI) {
            console.log(`AI change detected with confidence: ${confidence.toFixed(2)}`);
        }

        return isAI;
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

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        if (this.aiCommandTimeout) {
            clearTimeout(this.aiCommandTimeout);
        }
    }
}
