#!/bin/bash
# GitHub Repository Settings Setup Script
# This script helps configure GitHub repository settings including automatic branch deletion

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}GitHub Repository Settings Setup${NC}"
echo "=================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    echo ""
    echo "Or use the manual method described in docs/github-settings.md"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You need to authenticate with GitHub first.${NC}"
    echo "Running: gh auth login"
    gh auth login
fi

# Get repository information
REPO_INFO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
if [ -z "$REPO_INFO" ]; then
    echo -e "${RED}Error: Could not get repository information.${NC}"
    echo "Make sure you're running this script from within a repository directory."
    exit 1
fi
echo -e "Repository: ${GREEN}${REPO_INFO}${NC}"
echo ""

# Function to enable a setting
enable_setting() {
    local setting_name=$1
    local setting_key=$2
    local setting_value=$3
    
    echo -n "Enabling ${setting_name}... "
    if gh api repos/${REPO_INFO} --method PATCH -f ${setting_key}=${setting_value} &> /dev/null; then
        echo -e "${GREEN}✓ Done${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Function to check current setting
check_setting() {
    local setting_name=$1
    local setting_key=$2
    
    local current_value=$(gh api repos/${REPO_INFO} --jq .${setting_key} 2>/dev/null)
    if [ $? -ne 0 ] || [ -z "$current_value" ]; then
        echo -e "${setting_name}: ${RED}[Error reading value]${NC}"
    else
        echo -e "${setting_name}: ${YELLOW}${current_value}${NC}"
    fi
}

echo "Current Settings:"
echo "----------------"
check_setting "Auto-delete branches" "delete_branch_on_merge"
check_setting "Allow squash merge" "allow_squash_merge"
check_setting "Allow merge commit" "allow_merge_commit"
check_setting "Allow rebase merge" "allow_rebase_merge"
check_setting "Allow auto-merge" "allow_auto_merge"
echo ""

# Ask user what they want to configure
echo "What would you like to configure?"
echo "1) Enable automatic branch deletion after merge (推薦)"
echo "2) Configure all recommended PR settings"
echo "3) View current settings only (already shown above)"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "Configuring automatic branch deletion..."
        enable_setting "Automatic branch deletion" "delete_branch_on_merge" "true"
        echo ""
        echo -e "${GREEN}✓ Configuration complete!${NC}"
        echo ""
        echo "From now on, when you merge a Pull Request, the source branch will be"
        echo "automatically deleted to keep your repository clean."
        ;;
    2)
        echo ""
        echo "Configuring recommended Pull Request settings..."
        enable_setting "Automatic branch deletion" "delete_branch_on_merge" "true"
        enable_setting "Allow squash merge" "allow_squash_merge" "true"
        enable_setting "Allow merge commit" "allow_merge_commit" "true"
        enable_setting "Allow rebase merge" "allow_rebase_merge" "true"
        enable_setting "Allow auto-merge" "allow_auto_merge" "true"
        echo ""
        echo -e "${GREEN}✓ All settings configured!${NC}"
        ;;
    3)
        echo ""
        echo "No changes made."
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "For more information, see: docs/github-settings.md"
echo ""
echo -e "${GREEN}Done!${NC}"
