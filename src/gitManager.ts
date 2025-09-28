import * as vscode from 'vscode';
import { simpleGit, SimpleGit, StatusResult } from 'simple-git';
import * as path from 'path';

export interface CommitResult {
    success: boolean;
    message: string;
    error?: string;
    hash?: string;
}

export class GitManager {
    private git: SimpleGit;
    private workspaceRoot: string;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        this.git = simpleGit(this.workspaceRoot);
    }

    async getStatus(): Promise<StatusResult> {
        try {
            return await this.git.status();
        } catch (error) {
            console.error('Error getting git status:', error);
            throw error;
        }
    }

    async getCurrentAuthor(): Promise<{name: string, email: string}> {
        try {
            const name = await this.git.getConfig('user.name');
            const email = await this.git.getConfig('user.email');
            return {
                name: name.value || 'Unknown',
                email: email.value || 'unknown@example.com'
            };
        } catch (error) {
            console.error('Error getting git author info:', error);
            return {
                name: 'Unknown',
                email: 'unknown@example.com'
            };
        }
    }

    private async getAIAuthor(): Promise<{name: string, email: string}> {
        try {
            const config = vscode.workspace.getConfiguration('cursorGit');
            const suffix = config.get('aiAuthorSuffix', '(agent)');
            const currentAuthor = await this.getCurrentAuthor();
            
            return {
                name: `${currentAuthor.name} ${suffix}`,
                email: currentAuthor.email
            };
        } catch (error) {
            console.error('Error getting AI author info:', error);
            return {
                name: 'AI Assistant (agent)',
                email: 'ai@example.com'
            };
        }
    }

    async getModifiedFiles(): Promise<string[]> {
        try {
            const status = await this.getStatus();
            return [
                ...status.modified,
                ...status.created,
                ...status.renamed.map(r => r.to),
                ...status.deleted
            ];
        } catch (error) {
            console.error('Error getting modified files:', error);
            return [];
        }
    }

    async stageFiles(files: string[]): Promise<boolean> {
        try {
            if (files.length === 0) {
                return true;
            }

            // Filter out files that match exclude patterns
            const config = vscode.workspace.getConfiguration('cursorGit');
            const excludePatterns = config.get<string[]>('excludePatterns', []);
            const filteredFiles = this.filterExcludedFiles(files, excludePatterns);

            if (filteredFiles.length === 0) {
                console.log('No files to stage after filtering');
                return true;
            }

            await this.git.add(filteredFiles);
            console.log(`Staged ${filteredFiles.length} files:`, filteredFiles);
            return true;
        } catch (error) {
            console.error('Error staging files:', error);
            return false;
        }
    }

    async commitChanges(customMessage?: string): Promise<CommitResult> {
        try {
            const status = await this.getStatus();
            const stagedFiles = status.staged;

            if (stagedFiles.length === 0) {
                return {
                    success: false,
                    message: 'No staged changes to commit',
                    error: 'No staged changes'
                };
            }

            const message = customMessage || await this.generateCommitMessage(stagedFiles);
            const aiAuthor = await this.getAIAuthor();
            
            const commitResult = await this.git.commit(message, undefined, {
                '--author': `${aiAuthor.name} <${aiAuthor.email}>`
            });
            
            return {
                success: true,
                message: message,
                hash: commitResult.commit
            };
        } catch (error) {
            console.error('Error committing changes:', error);
            return {
                success: false,
                message: '',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async stageAndCommit(customMessage?: string): Promise<CommitResult> {
        try {
            const modifiedFiles = await this.getModifiedFiles();
            
            if (modifiedFiles.length === 0) {
                return {
                    success: false,
                    message: 'No changes to commit',
                    error: 'No modified files'
                };
            }

            const config = vscode.workspace.getConfiguration('cursorGit');
            const autoStage = config.get('autoStage', true);

            if (autoStage) {
                const staged = await this.stageFiles(modifiedFiles);
                if (!staged) {
                    return {
                        success: false,
                        message: '',
                        error: 'Failed to stage files'
                    };
                }
            }

            return await this.commitChanges(customMessage);
        } catch (error) {
            console.error('Error in stage and commit:', error);
            return {
                success: false,
                message: '',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async generateCommitMessage(files: string[]): Promise<string> {
        const config = vscode.workspace.getConfiguration('cursorGit');
        const useCursorAI = config.get<boolean>('useCursorAI', true);

        if (useCursorAI) {
            try {
                // Use Cursor's native AI commit message generation
                return await this.generateCursorCommitMessage();
            } catch (error) {
                console.error('Cursor AI commit generation failed:', error);
                // Fall back to heuristic method
            }
        }

        // Fallback to heuristic method
        return this.generateHeuristicCommitMessage(files);
    }

    private async generateCursorCommitMessage(): Promise<string> {
        try {
            // First, ensure files are staged
            const status = await this.getStatus();
            if (status.staged.length === 0) {
                // Stage the modified files
                const modifiedFiles = await this.getModifiedFiles();
                await this.stageFiles(modifiedFiles);
            }

            // Try to execute the Cursor AI command
            const result = await vscode.commands.executeCommand('cursor.generateGitCommitMessage');
            
            if (typeof result === 'string' && result.trim()) {
                return result.trim();
            }

            // If direct command doesn't work, we might need to wait for user interaction
            // or use a different approach
            throw new Error('Cursor AI command did not return a message');
            
        } catch (error) {
            console.error('Error with Cursor AI commit generation:', error);
            throw error;
        }
    }

    private async generateHeuristicCommitMessage(files: string[]): Promise<string> {
        const config = vscode.workspace.getConfiguration('cursorGit');
        const template = config.get('commitMessageTemplate', 'feat: {description}');

        // Analyze file changes to generate a description and determine commit type
        const analysis = await this.analyzeChanges(files);
        
        // If template doesn't contain a type prefix, add conventional commit type
        if (!template.includes('{type}') && !template.match(/^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert):/)) {
            return `${analysis.type}: ${analysis.description}`;
        }
        
        return template.replace('{description}', analysis.description).replace('{type}', analysis.type);
    }

    private async analyzeChanges(files: string[]): Promise<{type: string, description: string}> {
        try {
            // Get file extensions to understand the type of changes
            const extensions = files.map(f => path.extname(f)).filter(ext => ext);
            const uniqueExtensions = [...new Set(extensions)];

            // Count different types of files
            const stats = {
                total: files.length,
                extensions: uniqueExtensions,
                hasNewFiles: files.some(f => f.includes('(new file)')),
                hasDeletedFiles: files.some(f => f.includes('(deleted)'))
            };

            // Determine commit type based on file patterns and changes
            let commitType = 'feat'; // Default to feat
            let description = '';

            // Check for specific file patterns to determine commit type
            const hasTestFiles = files.some(f => f.includes('test') || f.includes('spec') || f.endsWith('.test.') || f.endsWith('.spec.'));
            const hasDocFiles = files.some(f => f.endsWith('.md') || f.endsWith('.txt') || f.includes('doc'));
            const hasConfigFiles = files.some(f => f.includes('config') || f.endsWith('.json') || f.endsWith('.yml') || f.endsWith('.yaml'));
            const hasStyleFiles = files.some(f => f.endsWith('.css') || f.endsWith('.scss') || f.endsWith('.sass') || f.endsWith('.less'));
            const hasBuildFiles = files.some(f => f.includes('build') || f.includes('webpack') || f.includes('rollup') || f.endsWith('.lock'));

            // Determine commit type
            if (hasTestFiles && !stats.hasNewFiles) {
                commitType = 'test';
            } else if (hasDocFiles) {
                commitType = 'docs';
            } else if (hasStyleFiles) {
                commitType = 'style';
            } else if (hasConfigFiles || hasBuildFiles) {
                commitType = 'chore';
            } else if (stats.hasDeletedFiles && !stats.hasNewFiles) {
                commitType = 'refactor';
            } else if (files.some(f => f.includes('fix') || f.includes('bug'))) {
                commitType = 'fix';
            }

            // Generate description based on file types and changes
            if (stats.hasNewFiles && stats.hasDeletedFiles) {
                description = 'add and remove files';
            } else if (stats.hasNewFiles) {
                description = 'add new files';
            } else if (stats.hasDeletedFiles) {
                description = 'remove files';
            } else if (uniqueExtensions.length === 1) {
                const ext = uniqueExtensions[0];
                description = `update ${ext} files`;
            } else if (uniqueExtensions.length > 1) {
                description = 'update multiple file types';
            } else {
                description = 'update files';
            }

            // Add file count if more than 1
            if (stats.total > 1) {
                description += ` (${stats.total} files)`;
            }

            return { type: commitType, description };
        } catch (error) {
            console.error('Error analyzing changes:', error);
            return { type: 'feat', description: 'AI-generated changes' };
        }
    }

    private filterExcludedFiles(files: string[], excludePatterns: string[]): string[] {
        if (excludePatterns.length === 0) {
            return files;
        }

        return files.filter(file => {
            return !excludePatterns.some(pattern => {
                // Simple glob pattern matching
                const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
                return regex.test(file);
            });
        });
    }

    async getLastCommit(): Promise<string | null> {
        try {
            const log = await this.git.log({ maxCount: 1 });
            return log.latest?.hash || null;
        } catch (error) {
            console.error('Error getting last commit:', error);
            return null;
        }
    }

    // New method to test AI commit message generation
    async testAIGeneration(): Promise<string> {
        const testFiles = ['src/test.ts', 'src/ai-test.js'];
        return await this.generateCommitMessage(testFiles);
    }

    async revertLastCommit(): Promise<boolean> {
        try {
            await this.git.reset(['--soft', 'HEAD~1']);
            return true;
        } catch (error) {
            console.error('Error reverting last commit:', error);
            return false;
        }
    }
}
