# Fix for Beds.countAsync Error

## Issue
The error "Beds.countAsync is not a function" was occurring because the code was using Meteor v3 async methods (countAsync, fetchAsync, updateAsync, insertAsync) but these methods don't exist on standard Mongo.Collection objects.

## Solution
Replace the async method calls with their synchronous equivalents:
- `countAsync()` → `countDocuments()`
- `fetchAsync()` → `fetch()`
- `updateAsync()` → `update()`
- `insertAsync()` → `insert()`

These methods still work with async/await in Meteor v3.

## Changes Made
1. Changed `Beds.countAsync()` to `Beds.find({}).countDocuments()`
2. Changed `fetchAsync()` to `fetch()` for cursor operations
3. Changed `updateAsync()` to `update()` for update operations
4. Changed `insertAsync()` to `insert()` for insert operations

The code now properly handles async operations without using the non-existent *Async methods.