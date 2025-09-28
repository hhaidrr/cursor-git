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
    console.log('Cursor Git extension is now active!');

    // Initialize components
    gitManager = new GitManager();
    changeDetector = new ChangeDetector(gitManager);
    chatInterface = new ChatInterface(gitManager);
    statusBarManager = new StatusBarManager();

    // Register commands
    const enableCommand = vscode.commands.registerCommand('cursorGit.enable', () => {
        vscode.workspace.getConfiguration('cursorGit').update('enabled', true, vscode.ConfigurationTarget.Global);
        statusBarManager.updateStatus(true);
        vscode.window.showInformationMessage('Cursor Git: Auto-commit enabled');
    });

    const disableCommand = vscode.commands.registerCommand('cursorGit.disable', () => {
        vscode.workspace.getConfiguration('cursorGit').update('enabled', false, vscode.ConfigurationTarget.Global);
        statusBarManager.updateStatus(false);
        vscode.window.showInformationMessage('Cursor Git: Auto-commit disabled');
    });

    const commitNowCommand = vscode.commands.registerCommand('cursorGit.commitNow', async () => {
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

    const showStatusCommand = vscode.commands.registerCommand('cursorGit.showStatus', () => {
        const config = vscode.workspace.getConfiguration('cursorGit');
        const isEnabled = config.get('enabled', true);
        const commitFrequency = config.get('commitFrequency', 'immediate');
        const useCursorAI = config.get('useCursorAI', true);
        
        vscode.window.showInformationMessage(
            `Cursor Git Status:\n` +
            `Enabled: ${isEnabled ? 'Yes' : 'No'}\n` +
            `Commit Frequency: ${commitFrequency}\n` +
            `Auto Stage: ${config.get('autoStage', true) ? 'Yes' : 'No'}\n` +
            `Use Cursor AI: ${useCursorAI ? 'Yes' : 'No'}`
        );
    });

    const testCursorAICommand = vscode.commands.registerCommand('cursorGit.testCursorAI', async () => {
        try {
            // Get modified files
            const modifiedFiles = await gitManager.getModifiedFiles();
            if (modifiedFiles.length === 0) {
                vscode.window.showInformationMessage('No changes to test with. Make some changes first.');
                return;
            }

            // Stage files for testing
            await gitManager.stageFiles(modifiedFiles);
            
            // Test Cursor AI generation
            const config = vscode.workspace.getConfiguration('cursorGit');
            const useCursorAI = config.get('useCursorAI', true);
            
            if (!useCursorAI) {
                vscode.window.showWarningMessage('Cursor AI is disabled. Enable it in settings to test.');
                return;
            }

            // Try to generate a commit message using Cursor AI
            const result = await vscode.commands.executeCommand('cursor.generateGitCommitMessage');
            
            if (typeof result === 'string' && result.trim()) {
                vscode.window.showInformationMessage(
                    `Cursor AI Generated Message:\n"${result.trim()}"`,
                    'Use This Message',
                    'Cancel'
                ).then(selection => {
                    if (selection === 'Use This Message') {
                        gitManager.commitChanges(result.trim());
                    }
                });
            } else {
                vscode.window.showWarningMessage('Cursor AI did not generate a message. This might be a limitation of the current implementation.');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Test failed: ${error}`);
        }
    });

    // New command to test AI generation with sample files
    const testAISampleCommand = vscode.commands.registerCommand('cursorGit.testAISample', async () => {
        try {
            const testMessage = await gitManager.testAIGeneration();
            vscode.window.showInformationMessage(`AI Test Message: ${testMessage}`);
        } catch (error) {
            vscode.window.showErrorMessage(`AI Test failed: ${error}`);
        }
    });

    // Command to check available Cursor AI commands
    const checkCursorAICommand = vscode.commands.registerCommand('cursorGit.checkCursorAI', async () => {
        try {
            // Check if the command exists
            const commands = await vscode.commands.getCommands();
            const cursorCommands = commands.filter(cmd => cmd.includes('cursor'));
            
            vscode.window.showInformationMessage(
                `Available Cursor commands: ${cursorCommands.length}\n` +
                `Cursor AI commands: ${cursorCommands.filter(cmd => cmd.includes('generate')).join(', ')}`
            );
            
            // Try to execute the command to see what happens
            try {
                const result = await vscode.commands.executeCommand('cursor.generateGitCommitMessage');
                vscode.window.showInformationMessage(`Command result: ${typeof result} - ${result}`);
            } catch (cmdError) {
                vscode.window.showErrorMessage(`Command error: ${cmdError}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Check failed: ${error}`);
        }
    });

    // Register all commands
    context.subscriptions.push(enableCommand, disableCommand, commitNowCommand, showStatusCommand, testCursorAICommand, testAISampleCommand, checkCursorAICommand);

    // Initialize change detection
    changeDetector.initialize();

    // Set up status bar
    statusBarManager.initialize();

    // Show welcome message
    vscode.window.showInformationMessage(
        'Cursor Git is ready! Use the command palette to enable auto-commit.',
        'Enable Auto-Commit'
    ).then(selection => {
        if (selection === 'Enable Auto-Commit') {
            vscode.commands.executeCommand('cursorGit.enable');
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
