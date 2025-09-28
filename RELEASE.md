# Release Process

This document explains how to build and release new versions of the Cursor Git extension for local development and testing.

## Automated Build via GitHub Actions

### Prerequisites

None! The workflow is configured for local development and testing only.

### Release Steps

#### Method 1: Tag-based Release (Recommended)

1. **Update version in package.json**
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```

2. **Push the tag**
   ```bash
   git push origin main --tags
   ```

3. **GitHub Actions will automatically:**
   - Build the extension
   - Run tests and linting
   - Package the extension (.vsix file)
   - Create a GitHub release with the .vsix file
   - Provide instructions for local installation

#### Method 2: Manual Release

1. **Go to GitHub Actions**
   - Navigate to the "Actions" tab in your repository
   - Select "Build and Release Extension" workflow
   - Click "Run workflow"
   - Enter the version (e.g., v1.0.0)
   - Click "Run workflow"

### What the Workflow Does

1. **Build Process:**
   - Installs dependencies (`npm ci`)
   - Runs linting (`npm run lint`)
   - Runs tests (`npm test`)
   - Compiles TypeScript (`npm run compile`)
   - Packages extension (`npm run package`)

2. **Release Process:**
   - Uploads .vsix file as artifact
   - Creates GitHub release with generated release notes
   - Provides local installation instructions

### Manual Build (Local)

If you prefer to build manually:

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build and package
npm run build

# Install locally for testing
code --install-extension cursor-git-*.vsix
```

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Troubleshooting

1. **Build fails:**
   - Check that all tests pass locally
   - Ensure TypeScript compiles without errors
   - Verify linting passes

2. **Local installation fails:**
   - Ensure VS Code is closed before installing
   - Try installing from command line: `code --install-extension cursor-git-*.vsix`
   - Check that the .vsix file is not corrupted

3. **Release not created:**
   - Verify the tag follows the pattern `v*` (e.g., v1.0.0)
   - Check GitHub Actions logs for errors
