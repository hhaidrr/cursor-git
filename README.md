# Cursor Git

A VS Code extension that automatically commits AI-generated changes in Cursor IDE, similar to the aider workflow.

## Features

- **Automatic AI Change Detection**: Detects when AI generates code changes and automatically commits them
- **Smart Commit Messages**: Uses Cursor's native AI to generate intelligent, context-aware commit messages
- **Fallback System**: Falls back to heuristic-based commit messages if Cursor AI is unavailable
- **Chat Interface**: Provides a conversational interface for managing commits and git operations
- **Configurable**: Customize commit behavior, frequency, and message templates
- **Git Integration**: Full integration with Git for staging, committing, and reverting changes
- **Status Bar**: Visual indicator showing extension status and quick access to commands

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to run the extension in a new Extension Development Host window

## Usage

### Basic Usage

1. **Enable Auto-Commit**: Use the command palette (`Ctrl+Shift+P`) and search for "Enable Auto-Commit"
2. **Start Coding**: The extension will automatically detect AI-generated changes and commit them
3. **View Status**: Check the status bar for extension status and use the chat interface for more control

### Commands

- `Cursor Git: Enable Auto-Commit` - Enable automatic committing
- `Cursor Git: Disable Auto-Commit` - Disable automatic committing
- `Cursor Git: Commit Current Changes` - Manually commit current changes
- `Cursor Git: Show Status` - Display current configuration and status
- `Cursor Git: Test Cursor AI Commit Generation` - Test Cursor's AI commit message generation
- `Cursor Git: Test AI with Sample Files` - Test AI generation with sample file patterns

### Configuration

The extension can be configured through VS Code settings:

```json
{
  "cursorGit.enabled": true,
  "cursorGit.commitMessageTemplate": "feat: {description}",
  "cursorGit.autoStage": true,
  "cursorGit.commitFrequency": "immediate",
  "cursorGit.excludePatterns": ["*.log", "*.tmp", "node_modules/**"],
  "cursorGit.aiAuthorSuffix": "(agent)",
  "cursorGit.useCursorAI": true
}
```

#### Configuration Options

- **enabled**: Enable/disable the extension
- **commitMessageTemplate**: Template for commit messages (use `{description}` for auto-generated description, `{type}` for commit type)
- **autoStage**: Automatically stage modified files before committing
- **commitFrequency**: When to commit changes (`immediate`, `onSave`, `manual`)
- **excludePatterns**: File patterns to exclude from auto-commit
- **aiAuthorSuffix**: Suffix to append to author name for AI commits (default: "(agent)")
- **useCursorAI**: Use Cursor's native AI for generating commit messages (default: true)

## How It Works

1. **Change Detection**: The extension monitors file changes and text editor events to detect AI-generated modifications
2. **AI-Powered Commit Messages**: Uses Cursor's native AI to generate intelligent, context-aware commit messages based on staged changes and git history
3. **Fallback System**: Falls back to heuristic-based commit message generation if Cursor AI is unavailable
4. **Conventional Commits**: Automatically generates conventional commit messages (feat, fix, docs, style, refactor, test, chore) based on file patterns
5. **Git Operations**: Automatically stages and commits changes using the Git API
6. **User Feedback**: Provides notifications and a chat interface for user interaction

### Conventional Commit Types

The extension automatically detects the appropriate commit type based on file patterns:

- **feat**: New features or functionality (default)
- **fix**: Bug fixes
- **docs**: Documentation changes (README, .md files)
- **style**: Code style changes (CSS, SCSS, formatting)
- **refactor**: Code refactoring (file deletions, restructuring)
- **test**: Test files and testing changes
- **chore**: Configuration, build files, dependencies

## Architecture

The extension consists of several key components:

- **GitManager**: Handles all Git operations (staging, committing, status checking)
- **ChangeDetector**: Monitors for AI-generated changes and triggers commits
- **ChatInterface**: Provides a webview-based chat interface for user interaction
- **StatusBarManager**: Manages the status bar indicator and notifications

## Development

### Prerequisites

- Node.js (v16 or later)
- npm
- VS Code
- Git

### Building

```bash
npm install
npm run compile
```

### Testing

```bash
npm test
```

### Packaging

```bash
npm run build
```

This will compile the TypeScript and package the extension into a `.vsix` file.

### Automated Builds

The extension uses GitHub Actions for automated building and local releases:

- **CI Workflow**: Runs on every push/PR to main/develop branches
- **Release Workflow**: Triggers on version tags (e.g., `v1.0.0`)
- **Local Installation**: Creates GitHub releases with `.vsix` files for local testing

See [RELEASE.md](RELEASE.md) for detailed build and installation instructions.

## Limitations

- Currently uses heuristics to detect AI-generated changes (may need refinement for specific use cases)
- Requires a Git repository to be initialized
- Commit frequency settings may need tuning based on your workflow

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by the aider project's git-native workflow
- Built for the Cursor IDE community
