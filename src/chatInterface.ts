import * as vscode from 'vscode';
import { GitManager } from './gitManager';

export class ChatInterface {
    private gitManager: GitManager;
    private panel: vscode.WebviewPanel | undefined;
    private messages: ChatMessage[] = [];

    constructor(gitManager: GitManager) {
        this.gitManager = gitManager;
    }

    async showChatPanel(): Promise<void> {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        // random commend
        this.panel = vscode.window.createWebviewPanel(
            'cursorGitChat',
            'Cursor Git Chat',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'commit':
                        await this.handleCommitRequest(message.text);
                        break;
                    case 'getStatus':
                        await this.handleStatusRequest();
                        break;
                    case 'getHistory':
                        await this.handleHistoryRequest();
                        break;
                }
            },
            undefined,
            []
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        // Add welcome message
        this.addMessage({
            type: 'system',
            content: 'Welcome to Cursor Git! I\'ll help you manage AI-generated changes with automatic git commits.',
            timestamp: new Date()
        });
    }

    addMessage(message: ChatMessage): void {
        this.messages.push(message);
        this.updateWebview();
    }

    private async handleCommitRequest(message: string): Promise<void> {
        try {
            this.addMessage({
                type: 'user',
                content: message,
                timestamp: new Date()
            });

            // Show typing indicator
            this.addMessage({
                type: 'assistant',
                content: 'Processing your request...',
                timestamp: new Date(),
                isTyping: true
            });

            const result = await this.gitManager.stageAndCommit(message);
            
            // Remove typing indicator
            this.messages = this.messages.filter(m => !m.isTyping);
            
            if (result.success) {
                this.addMessage({
                    type: 'assistant',
                    content: `Successfully committed: "${result.message}"`,
                    timestamp: new Date(),
                    commitHash: result.hash
                });
            } else {
                this.addMessage({
                    type: 'assistant',
                    content: `Commit failed: ${result.error}`,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            this.messages = this.messages.filter(m => !m.isTyping);
            this.addMessage({
                type: 'assistant',
                content: `Error: ${error}`,
                timestamp: new Date()
            });
        }
    }

    private async handleStatusRequest(): Promise<void> {
        try {
            const status = await this.gitManager.getStatus();
            const modifiedFiles = await this.gitManager.getModifiedFiles();
            
            let statusMessage = `Git Status:\n`;
            statusMessage += `• Modified: ${status.modified.length}\n`;
            statusMessage += `• Created: ${status.created.length}\n`;
            statusMessage += `• Deleted: ${status.deleted.length}\n`;
            statusMessage += `• Staged: ${status.staged.length}\n`;
            
            if (modifiedFiles.length > 0) {
                statusMessage += `\nModified Files:\n`;
                modifiedFiles.forEach(file => {
                    statusMessage += `• ${file}\n`;
                });
            }

            this.addMessage({
                type: 'assistant',
                content: statusMessage,
                timestamp: new Date()
            });
        } catch (error) {
            this.addMessage({
                type: 'assistant',
                content: `Error getting status: ${error}`,
                timestamp: new Date()
            });
        }
    }

    private async handleHistoryRequest(): Promise<void> {
        try {
            const lastCommit = await this.gitManager.getLastCommit();
            if (lastCommit) {
                this.addMessage({
                    type: 'assistant',
                    content: `Last commit: ${lastCommit}`,
                    timestamp: new Date()
                });
            } else {
                this.addMessage({
                    type: 'assistant',
                    content: 'No commits found in this repository',
                    timestamp: new Date()
                });
            }
        } catch (error) {
            this.addMessage({
                type: 'assistant',
                content: `Error getting history: ${error}`,
                timestamp: new Date()
            });
        }
    }

    private updateWebview(): void {
        if (this.panel) {
            this.panel.webview.html = this.getWebviewContent();
        }
    }

    private getWebviewContent(): string {
        const messagesHtml = this.messages.map(msg => this.renderMessage(msg)).join('');
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor Git Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
            max-width: 80%;
        }
        
        .message.user {
            background-color: var(--vscode-input-background);
            margin-left: auto;
            text-align: right;
        }
        
        .message.assistant {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
        }
        
        .message.system {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            text-align: center;
            margin: 0 auto;
        }
        
        .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .message-timestamp {
            font-size: 0.8em;
            opacity: 0.7;
            margin-top: 5px;
        }
        
        .input-container {
            display: flex;
            gap: 10px;
        }
        
        .input-field {
            flex: 1;
            padding: 10px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
        }
        
        .send-button {
            padding: 10px 20px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .send-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .typing-indicator {
            font-style: italic;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="chat-container" id="chatContainer">
        ${messagesHtml}
    </div>
    
    <div class="input-container">
        <input type="text" class="input-field" id="messageInput" placeholder="Type your message or commit message...">
        <button class="send-button" onclick="sendMessage()">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (message) {
                vscode.postMessage({
                    command: 'commit',
                    text: message
                });
                input.value = '';
            }
        }
        
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Auto-scroll to bottom
        function scrollToBottom() {
            const container = document.getElementById('chatContainer');
            container.scrollTop = container.scrollHeight;
        }
        
        // Scroll to bottom when new messages are added
        const observer = new MutationObserver(scrollToBottom);
        observer.observe(document.getElementById('chatContainer'), { childList: true });
        
        // Initial scroll
        scrollToBottom();
    </script>
</body>
</html>`;
    }

    private renderMessage(message: ChatMessage): string {
        const timestamp = message.timestamp.toLocaleTimeString();
        const content = message.isTyping ? 
            `<span class="typing-indicator">${message.content}</span>` : 
            message.content;
        
        return `
            <div class="message ${message.type}">
                <div class="message-content">${content}</div>
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;
    }
}

interface ChatMessage {
    type: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isTyping?: boolean;
    commitHash?: string;
}
