#!/bin/bash
# Script to fix the HTTP package error

echo "Cleaning Meteor build cache..."
rm -rf .meteor/local/bundler-cache
rm -rf .meteor/local/plugin-cache
rm -rf .meteor/local/isopacks

echo "Clearing node_modules..."
rm -rf node_modules

echo "Installing fetch package (if not already installed)..."
meteor add fetch

echo "Rebuilding the project..."
meteor npm install

echo "Done! Try running 'meteor run' again."