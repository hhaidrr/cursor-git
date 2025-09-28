# Change Log

All notable changes to the "cursor-git" extension will be documented in this file.

## [0.1.0] - 2024-01-XX

### Added
- Initial release of Cursor Git extension
- Automatic detection of AI-generated code changes
- Smart conventional commit message generation (feat, fix, docs, etc.) based on file types and changes
- Configurable commit behavior (immediate, onSave, manual)
- Chat interface for managing commits and git operations
- Status bar integration with visual indicators
- Git integration with automatic staging and committing
- Configuration options for commit templates and file exclusions
- Error handling and rollback capabilities
- VS Code extension marketplace compatibility

### Features
- AI Change Detection: Automatically detects when AI generates code changes
- Smart Commit Messages: Generates descriptive commit messages
- Chat Interface: Conversational interface for git operations
- Configurable: Customize commit behavior and message templates
- Git Integration: Full Git workflow integration
- Status Bar: Visual status indicators and quick access

### Configuration
- `cursorGit.enabled`: Enable/disable auto-commit
- `cursorGit.commitMessageTemplate`: Custom commit message template
- `cursorGit.autoStage`: Automatically stage files before commit
- `cursorGit.commitFrequency`: When to commit changes
- `cursorGit.excludePatterns`: File patterns to exclude from commits

### Commands
- `Cursor Git: Enable Auto-Commit`
- `Cursor Git: Disable Auto-Commit`
- `Cursor Git: Commit Current Changes`
- `Cursor Git: Show Status`
