import * as vscode from 'vscode';
import { GitManager } from './gitManager';

export class ChangeDetector {
    private gitManager: GitManager;
    private disposables: vscode.Disposable[] = [];
    private lastCommitHash: string | null = null;
    private isEnabled: boolean = true;

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

        // Note: Removed file save listener - only commit on AI-generated changes
        // const fileChangeListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
        //     if (this.isEnabled && this.shouldAutoCommit()) {
        //         await this.handleFileChange(document);
        //     }
        // });

        // Set up AI completion listener (if available)
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
            // fileChangeListener, // Removed - only commit on AI changes
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
                return true; // This is handled by onDidSaveTextDocument
            case 'manual':
                return false;
            default:
                return true;
        }
    }

    private async handleFileChange(document: vscode.TextDocument): Promise<void> {
        try {
            const result = await this.gitManager.stageAndCommit();
            if (result.success) {
                this.lastCommitHash = result.hash || null;
                this.showCommitNotification(result.message);
            }
        } catch (error) {
            console.error('Error handling file change:', error);
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

    private isAIGeneratedChange(event: any): boolean {
        // This is a heuristic to detect AI-generated changes
        // In a real implementation, you might need to hook into Cursor's AI API
        
        // Skip undo operations
        if (event.kind === vscode.TextDocumentChangeReason.Undo) {
            return false;
        }

        // Check if the change is significant (more than a few characters)
        if (event.contentChanges && event.contentChanges.length > 0) {
            const totalChanges = event.contentChanges.reduce((sum: number, change: any) => {
                return sum + (change.text?.length || 0);
            }, 0);
            
            // Get configuration for minimum change threshold
            const config = vscode.workspace.getConfiguration('cursorGit');
            const minChangeThreshold = config.get<number>('aiChangeThreshold', 20);
            
            // If more than threshold characters changed, likely AI-generated
            if (totalChanges > minChangeThreshold) {
                console.log(`AI change detected: ${totalChanges} characters changed`);
                return true;
            }
        }

        // Check for multi-line changes (AI often generates multiple lines)
        if (event.contentChanges && event.contentChanges.length > 0) {
            const hasMultiLineChanges = event.contentChanges.some((change: any) => {
                return change.text && change.text.includes('\n');
            });
            
            if (hasMultiLineChanges) {
                console.log('AI change detected: multi-line change');
                return true;
            }
        }

        return false;
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
    }
}
