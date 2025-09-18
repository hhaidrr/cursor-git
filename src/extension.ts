import * as vscode from 'vscode';
import { GitManager } from './gitManager';
import { ChangeDetector } from './changeDetector';
import { ChatInterface } from './chatInterface';
import { StatusBarManager } from './statusBarManager';

let gitManager: GitManager;
let changeDetector: ChangeDetector;
let chatInterface: ChatInterface;
let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Cursor Aider Git extension is now active!');

    // Initialize components
    gitManager = new GitManager();
    changeDetector = new ChangeDetector(gitManager);
    chatInterface = new ChatInterface(gitManager);
    statusBarManager = new StatusBarManager();

    // Register commands
    const enableCommand = vscode.commands.registerCommand('cursorAiderGit.enable', () => {
        vscode.workspace.getConfiguration('cursorAiderGit').update('enabled', true, vscode.ConfigurationTarget.Global);
        statusBarManager.updateStatus(true);
        vscode.window.showInformationMessage('Cursor Aider Git: Auto-commit enabled');
    });

    const disableCommand = vscode.commands.registerCommand('cursorAiderGit.disable', () => {
        vscode.workspace.getConfiguration('cursorAiderGit').update('enabled', false, vscode.ConfigurationTarget.Global);
        statusBarManager.updateStatus(false);
        vscode.window.showInformationMessage('Cursor Aider Git: Auto-commit disabled');
    });

    const commitNowCommand = vscode.commands.registerCommand('cursorAiderGit.commitNow', async () => {
        try {
            const result = await gitManager.commitChanges();
            if (result.success) {
                vscode.window.showInformationMessage(`Committed: ${result.message}`);
                chatInterface.addMessage({
                    type: 'assistant',
                    content: `Committed: ${result.message}`,
                    timestamp: new Date()
                });
            } else {
                vscode.window.showErrorMessage(`Commit failed: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Commit error: ${error}`);
        }
    });

    const showStatusCommand = vscode.commands.registerCommand('cursorAiderGit.showStatus', () => {
        const config = vscode.workspace.getConfiguration('cursorAiderGit');
        const isEnabled = config.get('enabled', true);
        const commitFrequency = config.get('commitFrequency', 'immediate');
        
        vscode.window.showInformationMessage(
            `Cursor Aider Git Status:\n` +
            `Enabled: ${isEnabled ? 'Yes' : 'No'}\n` +
            `Commit Frequency: ${commitFrequency}\n` +
            `Auto Stage: ${config.get('autoStage', true) ? 'Yes' : 'No'}`
        );
    });

    // Register all commands
    context.subscriptions.push(enableCommand, disableCommand, commitNowCommand, showStatusCommand);

    // Initialize change detection
    changeDetector.initialize();

    // Set up status bar
    statusBarManager.initialize();

    // Show welcome message
    vscode.window.showInformationMessage(
        'Cursor Aider Git is ready! Use the command palette to enable auto-commit.',
        'Enable Auto-Commit'
    ).then(selection => {
        if (selection === 'Enable Auto-Commit') {
            vscode.commands.executeCommand('cursorAiderGit.enable');
        }
    });
}

export function deactivate() {
    if (changeDetector) {
        changeDetector.dispose();
    }
    if (statusBarManager) {
        statusBarManager.dispose();
    }
}
