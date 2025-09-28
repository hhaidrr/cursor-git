# Cursor Git

Automatically commit AI-generated changes in Cursor IDE using intelligent typing speed detection.

## Features

- **Smart Detection**: Uses typing speed (WPM) to distinguish between human and AI-generated changes
- **User Action Respect**: Automatically detects human actions (delete, undo, backspace) and skips commits
- **Configurable**: Adjustable thresholds and behavior settings
- **AI-Powered Messages**: Uses Cursor's native AI for intelligent commit messages
- **File Save Trigger**: Only commits when files are saved, preventing premature commits

## Quick Start

1. **Install** the extension from VS Code marketplace
2. **Enable** auto-commit via Command Palette (`Ctrl+Shift+P` → "Enable Auto-Commit")
3. **Start coding** - the extension will automatically detect and commit AI-generated changes

## How It Works

The extension uses a **typing speed-based heuristic**:

- **Human typing**: Typically 20-80 WPM → Skip commit
- **AI generation**: Often 200+ WPM → Auto-commit
- **User actions**: Delete, undo, backspace → Always skip commit
- **File save**: Only commits when file is saved

## Configuration

### Key Settings

```json
{
  "cursorGit.typingSpeedThreshold": 150,    // WPM threshold (50-500)
  "cursorGit.sessionTimeout": 2000,         // Session timeout in ms
  "cursorGit.commitFrequency": "onSave",    // When to commit
  "cursorGit.useCursorAI": true             // Use Cursor AI for messages
}
```

### All Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `typingSpeedThreshold` | number | 150 | WPM threshold for AI detection |
| `minCharactersForAnalysis` | number | 10 | Min chars needed for analysis |
| `sessionTimeout` | number | 2000 | Session timeout in milliseconds |
| `commitFrequency` | string | "onSave" | When to commit changes |
| `autoStage` | boolean | true | Auto-stage files before commit |
| `useCursorAI` | boolean | true | Use Cursor AI for commit messages |
| `aiAuthorSuffix` | string | "(agent)" | Suffix for AI commits |
| `showNotifications` | boolean | true | Show commit notifications |

## Commands

- `Cursor Git: Enable Auto-Commit` - Enable the extension
- `Cursor Git: Disable Auto-Commit` - Disable the extension
- `Cursor Git: Commit Current Changes` - Manually commit changes
- `Cursor Git: Show Status` - Display current settings and status
- `Cursor Git: Check Typing Status` - Show current typing mode
- `Cursor Git: Set AI Flag` - Manually set typing mode

## Documentation

For detailed information about the heuristic logic and implementation:

- **[Heuristic Logic](./docs/heuristic-logic.md)** - Complete algorithm documentation
- **[Configuration Reference](./docs/configuration-reference.md)** - All settings explained
- **[Docs README](./docs/README.md)** - Documentation overview

## Examples

### Human Typing (Skipped)
```
User types: "function test() {"
Speed: 45 WPM
Action: Skip commit
```

### AI Generation (Committed)
```
AI generates: Complete function with comments
Speed: 300 WPM
Action: Auto-commit on save
```

### Mixed Editing (Skipped)
```
AI generates code → User deletes part → User adds comment
Action: Skip commit (user action detected)
```

## Troubleshooting

### Too Many Commits
- Increase `typingSpeedThreshold` to 200+
- Increase `sessionTimeout` to 3000+
- Set `commitFrequency` to "manual"

### Missing Commits
- Decrease `typingSpeedThreshold` to 120
- Decrease `minCharactersForAnalysis` to 5
- Check if user actions are being detected

### Performance Issues
- Increase `sessionTimeout`
- Disable `showNotifications`
- Use "onSave" commit frequency

## Requirements

- VS Code 1.74.0 or higher
- Cursor IDE (for AI features)
- Git repository

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Cursor Git"
4. Click Install

### From Source
1. Clone the repository
2. Run `npm install`
3. Run `npm run compile`
4. Press `F5` to run in Extension Development Host

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by the aider project's git-native workflow
- Built for the Cursor IDE community

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Update documentation
5. Submit a pull request

---

*For detailed technical documentation, see the [docs/](./docs/) folder.*