import * as vscode from 'vscode';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private isEnabled: boolean = false;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
    }

    initialize(): void {
        this.updateStatusFromConfig();
        this.statusBarItem.show();
    }

    updateStatus(enabled: boolean): void {
        this.isEnabled = enabled;
        this.updateStatusBarItem();
    }

    private async updateStatusFromConfig(): Promise<void> {
        const config = vscode.workspace.getConfiguration('cursorAiderGit');
        this.isEnabled = config.get('enabled', true);
        this.updateStatusBarItem();
    }

    private updateStatusBarItem(): void {
        if (this.isEnabled) {
            this.statusBarItem.text = '$(git-commit) Aider Git';
            this.statusBarItem.tooltip = 'Cursor Aider Git: Auto-commit enabled\nClick to disable';
            this.statusBarItem.command = 'cursorAiderGit.disable';
            this.statusBarItem.backgroundColor = undefined;
        } else {
            this.statusBarItem.text = '$(git-commit) Aider Git (off)';
            this.statusBarItem.tooltip = 'Cursor Aider Git: Auto-commit disabled\nClick to enable';
            this.statusBarItem.command = 'cursorAiderGit.enable';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
    }

    showTemporaryMessage(message: string, duration: number = 3000): void {
        const originalText = this.statusBarItem.text;
        const originalTooltip = this.statusBarItem.tooltip;
        
        this.statusBarItem.text = message;
        this.statusBarItem.tooltip = message;
        
        setTimeout(() => {
            this.statusBarItem.text = originalText;
            this.statusBarItem.tooltip = originalTooltip;
        }, duration);
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}
