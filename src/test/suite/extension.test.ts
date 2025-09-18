import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('cursor-git.cursor-git'));
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        
        const expectedCommands = [
            'cursorGit.enable',
            'cursorGit.disable',
            'cursorGit.commitNow',
            'cursorGit.showStatus'
        ];

        for (const command of expectedCommands) {
            assert.ok(commands.includes(command), `Command ${command} should be registered`);
        }
    });

    test('Configuration should have default values', () => {
        const config = vscode.workspace.getConfiguration('cursorGit');
        
        assert.strictEqual(config.get('enabled'), true);
        assert.strictEqual(config.get('commitMessageTemplate'), 'AI: {description}');
        assert.strictEqual(config.get('autoStage'), true);
        assert.strictEqual(config.get('commitFrequency'), 'immediate');
    });
});
