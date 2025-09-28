# Configuration Reference

## Typing Speed Settings

### `cursorGit.typingSpeedThreshold`
- **Type**: `number`
- **Default**: `150`
- **Range**: `50-500`
- **Description**: WPM threshold - anything above this is considered AI-generated
- **Usage**: Lower values = more sensitive to AI detection

### `cursorGit.minCharactersForAnalysis`
- **Type**: `number`
- **Default**: `10`
- **Range**: `5-50`
- **Description**: Minimum characters needed to analyze typing speed
- **Usage**: Higher values = more reliable but less responsive

### `cursorGit.sessionTimeout`
- **Type**: `number`
- **Default**: `2000`
- **Range**: `500-10000`
- **Description**: Timeout in milliseconds before starting a new typing session
- **Usage**: Lower values = more sensitive to pauses

## Commit Behavior

### `cursorGit.commitFrequency`
- **Type**: `string`
- **Default**: `"onSave"`
- **Options**: `"immediate"`, `"onSave"`, `"manual"`
- **Description**: When to commit changes
- **Usage**: 
  - `"immediate"` = commit on every AI detection
  - `"onSave"` = commit only when file is saved
  - `"manual"` = never auto-commit

### `cursorGit.autoStage`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Automatically stage modified files before committing
- **Usage**: `false` = manual staging required

### `cursorGit.excludePatterns`
- **Type**: `array`
- **Default**: `["*.log", "*.tmp", "node_modules/**"]`
- **Description**: File patterns to exclude from auto-commit
- **Usage**: Add patterns like `"*.test.js"` or `"temp/**"`

## AI Integration

### `cursorGit.useCursorAI`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Use Cursor's native AI for generating commit messages
- **Usage**: `false` = use heuristic-based messages

### `cursorGit.aiAuthorSuffix`
- **Type**: `string`
- **Default**: `"(agent)"`
- **Description**: Suffix to append to author name for AI commits
- **Usage**: Customize to identify AI commits in git history

## User Interface

### `cursorGit.showNotifications`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Show notifications for AI-generated commits
- **Usage**: `false` = silent operation

### `cursorGit.enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable/disable the entire extension
- **Usage**: Master switch for all functionality

## Message Templates

### `cursorGit.commitMessageTemplate`
- **Type**: `string`
- **Default**: `"feat: {description}"`
- **Description**: Template for commit messages
- **Placeholders**:
  - `{description}` - Auto-generated change description
  - `{type}` - Commit type (feat, fix, docs, etc.)
- **Examples**:
  - `"AI: {description}"` - Simple AI prefix
  - `"{type}: {description} (AI-generated)"` - Include type and AI marker

## Recommended Settings

### For Fast Typists
```json
{
  "cursorGit.typingSpeedThreshold": 200,
  "cursorGit.sessionTimeout": 3000,
  "cursorGit.minCharactersForAnalysis": 15
}
```

### For Slow Typists
```json
{
  "cursorGit.typingSpeedThreshold": 100,
  "cursorGit.sessionTimeout": 1500,
  "cursorGit.minCharactersForAnalysis": 8
}
```

### For Maximum Sensitivity
```json
{
  "cursorGit.typingSpeedThreshold": 120,
  "cursorGit.sessionTimeout": 1000,
  "cursorGit.minCharactersForAnalysis": 5
}
```

### For Conservative Detection
```json
{
  "cursorGit.typingSpeedThreshold": 200,
  "cursorGit.sessionTimeout": 5000,
  "cursorGit.minCharactersForAnalysis": 20
}
```

## Troubleshooting

### Too Many False Positives
- Increase `typingSpeedThreshold`
- Increase `minCharactersForAnalysis`
- Increase `sessionTimeout`

### Missing AI Detection
- Decrease `typingSpeedThreshold`
- Decrease `minCharactersForAnalysis`
- Decrease `sessionTimeout`

### Performance Issues
- Increase `sessionTimeout`
- Increase `minCharactersForAnalysis`
- Disable `showNotifications`

---

*For more detailed explanations, see [heuristic-logic.md](./heuristic-logic.md)*

