#!/bin/bash

# Fix permissions for development stage
echo "Fixing permissions for development stage..."

# Change ownership of the project directory to current user
sudo chown -R $USER .

# Set appropriate permissions for development
echo "Setting development-friendly permissions..."

# Make all files and directories writable by owner
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;

# Make executable files executable
find . -name "*.sh" -exec chmod +x {} \;
find . -name "Dockerfile*" -exec chmod 644 {} \;

# Fix node_modules permissions if they exist
if [ -d "node_modules" ]; then
    echo "Fixing node_modules permissions..."
    chmod -R 755 node_modules
fi

# Fix packages/ui-components/dist if it exists
if [ -d "packages/ui-components/dist" ]; then
    echo "Fixing ui-components/dist permissions..."
    chmod -R 755 packages/ui-components/dist
fi

# Fix ~/.pnpm permissions if it exists
if [ -d "$HOME/.pnpm" ]; then
    echo "Fixing ~/.pnpm permissions..."
    sudo chown -R $USER $HOME/.pnpm
    chmod -R 755 $HOME/.pnpm
fi

echo "Development permissions fixed!"
echo ""
echo "To reinstate production permissions later, run:"
echo "  sudo chown -R root:root ."
echo "  sudo chmod -R 755 ."