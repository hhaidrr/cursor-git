# Change Log

All notable changes to the "cursor-aider-git" extension will be documented in this file.

## [0.1.0] - 2024-01-XX

### Added
- Initial release of Cursor Aider Git extension
- Automatic detection of AI-generated code changes
- Smart commit message generation based on file types and changes
- Configurable commit behavior (immediate, onSave, manual)
- Chat interface for managing commits and git operations
- Status bar integration with visual indicators
- Git integration with automatic staging and committing
- Configuration options for commit templates and file exclusions
- Error handling and rollback capabilities
- VS Code extension marketplace compatibility

### Features
- 🤖 AI Change Detection: Automatically detects when AI generates code changes
- 📝 Smart Commit Messages: Generates descriptive commit messages
- 💬 Chat Interface: Conversational interface for git operations
- ⚙️ Configurable: Customize commit behavior and message templates
- 🔄 Git Integration: Full Git workflow integration
- 📊 Status Bar: Visual status indicators and quick access

### Configuration
- `cursorAiderGit.enabled`: Enable/disable auto-commit
- `cursorAiderGit.commitMessageTemplate`: Custom commit message template
- `cursorAiderGit.autoStage`: Automatically stage files before commit
- `cursorAiderGit.commitFrequency`: When to commit changes
- `cursorAiderGit.excludePatterns`: File patterns to exclude from commits

### Commands
- `Cursor Aider Git: Enable Auto-Commit`
- `Cursor Aider Git: Disable Auto-Commit`
- `Cursor Aider Git: Commit Current Changes`
- `Cursor Aider Git: Show Status`
