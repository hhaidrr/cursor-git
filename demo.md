# Cursor Aider Git Demo

This demo shows how to use the Cursor Aider Git extension to automatically commit AI-generated changes.

## Setup

1. **Install the extension**:
   ```bash
   cd /home/hamzah/code/cursor-git
   npm install
   npm run compile
   ```

2. **Open in VS Code**:
   - Open the project folder in VS Code
   - Press `F5` to run the extension in a new Extension Development Host window

3. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

## Demo Steps

### 1. Enable Auto-Commit

1. Open the Command Palette (`Ctrl+Shift+P`)
2. Search for "Enable Auto-Commit"
3. Select "Cursor Aider Git: Enable Auto-Commit"
4. You should see a status bar indicator showing the extension is active

### 2. Test AI Change Detection

1. Create a new file or modify an existing one
2. Make a significant change (more than 10 characters)
3. Save the file (`Ctrl+S`)
4. The extension should automatically:
   - Detect the change
   - Stage the modified files
   - Create a commit with a descriptive message
   - Show a notification

### 3. Use the Chat Interface

1. Open the Command Palette (`Ctrl+Shift+P`)
2. Search for "Cursor Aider Git Chat" or look for the chat icon
3. The chat interface will open in a side panel
4. You can:
   - Type commit messages and commit manually
   - Ask for git status
   - View commit history

### 4. Test Configuration

1. Open Settings (`Ctrl+,`)
2. Search for "cursorAiderGit"
3. Try different configurations:
   - Change commit frequency to "manual"
   - Modify the commit message template
   - Add file exclusion patterns

### 5. Test Commands

Try these commands from the Command Palette:

- `Cursor Aider Git: Disable Auto-Commit` - Turn off automatic commits
- `Cursor Aider Git: Commit Current Changes` - Manually commit changes
- `Cursor Aider Git: Show Status` - Display current configuration

## Expected Behavior

- **Automatic Commits**: When you make changes and save, the extension should automatically commit them
- **Smart Messages**: Commit messages should describe the type of changes (e.g., "AI: Updated TypeScript files (3 files)")
- **Status Bar**: The status bar should show the extension status
- **Notifications**: You should see notifications when commits are made
- **Chat Interface**: The chat should respond to your commands and show git status

## Troubleshooting

If the extension doesn't work as expected:

1. **Check Git Repository**: Make sure you're in a git repository
2. **Check Console**: Open the Developer Console (`Help > Toggle Developer Tools`) to see any errors
3. **Check Configuration**: Verify the extension is enabled in settings
4. **Check File Changes**: Make sure you're making significant changes (more than 10 characters)

## Features Demonstrated

- AI change detection
- Automatic git staging and committing
- Smart commit message generation
- Chat interface for git operations
- Status bar integration
- Configuration options
- Error handling and notifications
