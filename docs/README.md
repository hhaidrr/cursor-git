# Cursor Git Documentation

This folder contains documentation for the Cursor Git extension, focusing on the heuristic logic and implementation details.

## Files

- **[heuristic-logic.md](./heuristic-logic.md)** - Complete documentation of the typing speed-based detection algorithm
- **README.md** - This file

## Purpose

The documentation here serves to:

1. **Explain the logic** in plain language for planning and discussion
2. **Document decisions** and reasoning behind implementation choices
3. **Provide reference** for future development and maintenance
4. **Enable collaboration** by making the approach clear to all contributors

## Key Concepts

### Typing Speed Detection
The core heuristic measures typing speed (WPM) to distinguish between human and AI-generated changes.

### User Action Detection
Certain actions (delete, undo, backspace) are considered human-only and immediately flag changes as human.

### Session Management
Typing events are grouped into sessions based on time gaps to ensure accurate speed calculation.

### File Save Trigger
Commits only happen on file save, using a boolean flag to determine if changes are AI or human.

## Usage

This documentation is intended for:
- **Developers** working on the extension
- **Users** who want to understand how it works
- **Contributors** planning new features
- **Maintainers** debugging issues

## Contributing

When making changes to the heuristic logic:
1. Update the relevant documentation
2. Explain the reasoning behind changes
3. Update examples and edge cases
4. Test the changes thoroughly

---

*For technical implementation details, see the source code in the `src/` directory.*

