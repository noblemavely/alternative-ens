#!/bin/bash

# Claude Automated Deploy to Hostinger
# Usage: bash .claude/deploy-to-hostinger.sh "feature" "Added new feature" "patch"

set -e

CHANGE_TYPE="${1:-improvement}"
DESCRIPTION="${2:-Automated improvement and feature enhancement}"
BUMP_VERSION="${3:-patch}"

echo "🚀 Starting Hostinger Deployment Process..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get current version
CURRENT_VERSION=$(jq -r '.version' package.json)
echo "📦 Current Version: $CURRENT_VERSION"
echo "📝 Change Type: $CHANGE_TYPE"
echo "📋 Description: $DESCRIPTION"
echo "🔢 Version Bump: $BUMP_VERSION"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Staging changes..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo "ℹ️  No changes to commit"
else
  echo "✅ Changes staged"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Creating commit..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

COMMIT_MESSAGE="[Claude AI] $CHANGE_TYPE: $DESCRIPTION"

if ! git diff --cached --quiet; then
  git commit \
    -m "$COMMIT_MESSAGE" \
    -m "Type: $CHANGE_TYPE" \
    -m "Environment: Hostinger Production" \
    -m "Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    -m "Co-Authored-By: Claude AI <claude@anthropic.com>"

  echo "✅ Commit created"
else
  echo "ℹ️  No changes to commit, skipping..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Bumping version..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm version $BUMP_VERSION --no-git-tag-version
NEW_VERSION=$(jq -r '.version' package.json)
echo "✅ Version bumped to v$NEW_VERSION"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Generating CHANGELOG..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update CHANGELOG.md
CHANGELOG_ENTRY="## [${NEW_VERSION}] - $(date +'%Y-%m-%d')

### $([[ $CHANGE_TYPE == "feature" ]] && echo "✨ Features" || [[ $CHANGE_TYPE == "bugfix" ]] && echo "🐛 Bug Fixes" || [[ $CHANGE_TYPE == "perf" ]] && echo "⚡ Performance" || [[ $CHANGE_TYPE == "docs" ]] && echo "📚 Documentation" || echo "✨ Improvements")

- $DESCRIPTION

"

# Prepend to CHANGELOG.md
if [ -f "CHANGELOG.md" ]; then
  EXISTING=$(cat CHANGELOG.md)
  echo -e "$CHANGELOG_ENTRY\n$EXISTING" > CHANGELOG.md
else
  echo "$CHANGELOG_ENTRY" > CHANGELOG.md
fi

echo "✅ CHANGELOG.md updated"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Staging version and changelog..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

git add package.json CHANGELOG.md

if ! git diff --cached --quiet; then
  git commit -m "chore: release v$NEW_VERSION" || true
  echo "✅ Version and changelog committed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Creating git tag..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION

Type: $CHANGE_TYPE
Description: $DESCRIPTION
Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')
Environment: Hostinger Production" || echo "ℹ️  Tag already exists"

echo "✅ Git tag created: v$NEW_VERSION"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 7: Pushing to GitHub..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

git push origin main || echo "⚠️  Could not push main branch"
git push origin --tags || echo "⚠️  Could not push tags"

echo "✅ Changes pushed to GitHub"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 8: Triggering GitHub Actions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v gh &> /dev/null; then
  gh workflow run deploy-hostinger.yml -r main || echo "⚠️  Could not trigger workflow"
  echo "✅ GitHub Actions workflow triggered"
else
  echo "⚠️  GitHub CLI not installed, workflow will trigger on push"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT INITIATED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Deployment Summary:"
echo "   Version: v$NEW_VERSION"
echo "   Type: $CHANGE_TYPE"
echo "   Description: $DESCRIPTION"
echo "   Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo "   Repository: https://github.com/noblemavely/alternative-ens"
echo "   Production URL: https://alternative.nativeworld.com"
echo ""
echo "🔗 Monitor deployment:"
echo "   https://github.com/noblemavely/alternative-ens/actions"
echo ""
echo "⏱️  Expected deployment time: 2-5 minutes"
echo ""
