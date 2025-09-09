#!/bin/bash

# Test A2A Polling for Task Updates
# This simulates what an external system would do to check for responses

TASK_ID=$1

if [ -z "$TASK_ID" ]; then
  echo "Usage: $0 <task-id>"
  echo "Example: $0 BWv88w6dSAKc6Q5dZ"
  exit 1
fi

echo "🔍 Polling for updates on task: $TASK_ID"
echo "================================================"

# Poll tasks/get to see the current state
echo -e "\n📊 Getting task status via tasks/get:"
curl -s -X POST http://localhost:3000/api/a2a \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": \"poll-1\",
    \"method\": \"tasks/get\",
    \"params\": {
      \"id\": \"$TASK_ID\"
    }
  }" | python -m json.tool

echo -e "\n💡 To see real-time updates, use SSE subscription:"
echo "curl -X POST http://localhost:3000/api/a2a \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Accept: text/event-stream\" \\"
echo "  -d '{\"jsonrpc\": \"2.0\", \"id\": \"sse-1\", \"method\": \"tasks/resubscribe\", \"params\": {\"id\": \"$TASK_ID\"}}'"