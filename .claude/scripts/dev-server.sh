#!/bin/bash
# .claude/scripts/dev-server.sh
#
# Start, stop and inspect the loop's own Meteor dev server without ever killing
# a process this script did not start.
#
#   dev-server.sh start     start the server in its own process group, wait until ready
#   dev-server.sh stop      stop that process group (and only that group)
#   dev-server.sh restart   stop, then start
#   dev-server.sh status    report whether it is running and who holds the port
#
# The server is launched as the leader of a new process group and the group id
# is recorded. Stopping signals that group, so rspack, mongod and the app
# server go down with it even after the meteor tool itself has exited. Nothing
# is ever matched by name or by port.
#
# If the port is already held by something this script did not start, `start`
# refuses and says who holds it. That is a decision for a human, not the loop.
#
# Environment:
#   DEV_SERVER_CMD    command to run   (default: meteor npm run medical-home-autologin)
#   DEV_SERVER_PORT   port to wait on  (default: 3000)
#   DEV_SERVER_LOG    log file         (default: /tmp/meteor-server.log)
#   DEV_SERVER_WAIT   seconds to wait for readiness (default: 240)

set -uo pipefail

CMD="${DEV_SERVER_CMD:-meteor npm run medical-home-autologin}"
PORT="${DEV_SERVER_PORT:-3000}"
LOG="${DEV_SERVER_LOG:-/tmp/meteor-server.log}"
WAIT="${DEV_SERVER_WAIT:-240}"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
STATE_DIR="$ROOT/.meteor/local"
[ -d "$STATE_DIR" ] || STATE_DIR="${TMPDIR:-/tmp}"
PGID_FILE="$STATE_DIR/claude-dev-server.pgid"

recorded_pgid() {
  [ -f "$PGID_FILE" ] || return 1
  local pgid
  pgid="$(tr -cd '0-9' < "$PGID_FILE")"
  [ -n "$pgid" ] || return 1
  echo "$pgid"
}

# PIDs currently alive in a process group.
group_pids() {
  ps -axo pid=,pgid= | awk -v g="$1" '$2 == g { print $1 }'
}

# Alive while the leader exists or any member of its group does. The leader
# check covers the instant between launch and the group being created.
group_alive() {
  kill -0 "$1" 2>/dev/null || [ -n "$(group_pids "$1")" ]
}

# "pid command" lines for whatever is listening on the port.
port_holders() {
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | awk 'NR > 1 { print $2 }' | sort -u
}

# True when every listener on the port belongs to our recorded group.
port_is_ours() {
  local pgid="$1" pid owner
  for pid in $(port_holders); do
    owner="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ')"
    [ "$owner" = "$pgid" ] || return 1
  done
  return 0
}

describe_port() {
  local pid
  for pid in $(port_holders); do
    echo "  pid $pid  $(ps -o command= -p "$pid" 2>/dev/null | cut -c1-120)"
  done
}

cmd_status() {
  local pgid
  if pgid="$(recorded_pgid)" && group_alive "$pgid"; then
    echo "dev server: running (process group $pgid, $(group_pids "$pgid" | wc -l | tr -d ' ') processes)"
  else
    echo "dev server: not running (nothing started by this script is alive)"
  fi
  if [ -n "$(port_holders)" ]; then
    echo "port $PORT is held by:"
    describe_port
  else
    echo "port $PORT is free"
  fi
}

cmd_stop() {
  local pgid i
  if ! pgid="$(recorded_pgid)"; then
    echo "dev server: nothing recorded, nothing to stop"
    return 0
  fi
  if ! group_alive "$pgid"; then
    echo "dev server: process group $pgid already gone"
    rm -f "$PGID_FILE"
    return 0
  fi
  echo "dev server: stopping process group $pgid"
  kill -TERM -- "-$pgid" 2>/dev/null
  for i in $(seq 1 20); do
    group_alive "$pgid" || break
    sleep 1
  done
  if group_alive "$pgid"; then
    echo "dev server: still alive after 20s, sending KILL to group $pgid"
    kill -KILL -- "-$pgid" 2>/dev/null
    sleep 2
  fi
  if group_alive "$pgid"; then
    echo "dev server: could not stop process group $pgid" >&2
    return 1
  fi
  rm -f "$PGID_FILE"
  echo "dev server: stopped"
}

cmd_start() {
  local pgid i
  if pgid="$(recorded_pgid)" && group_alive "$pgid"; then
    echo "dev server: already running (process group $pgid); use restart to cycle it"
    return 0
  fi
  if [ -n "$(port_holders)" ]; then
    echo "dev server: port $PORT is held by a process this script did not start:" >&2
    describe_port >&2
    echo "Not killing it. Stop it yourself, or set DEV_SERVER_PORT, then run start again." >&2
    return 1
  fi

  cd "$ROOT" || return 1
  # perl makes the command the leader of a new process group, so the whole
  # tree can be signalled later by group id (macOS has no setsid).
  nohup perl -e 'setpgrp(0, 0); exec @ARGV or die "exec failed: $!"' \
    /bin/bash -c "$CMD" > "$LOG" 2>&1 &
  pgid=$!
  echo "$pgid" > "$PGID_FILE"
  echo "dev server: started process group $pgid, log at $LOG"
  sleep 1

  for i in $(seq 1 "$WAIT"); do
    if ! group_alive "$pgid"; then
      echo "dev server: exited during startup; last log lines:" >&2
      tail -20 "$LOG" >&2
      rm -f "$PGID_FILE"
      return 1
    fi
    if curl -s -o /dev/null "http://localhost:$PORT" && port_is_ours "$pgid"; then
      echo "dev server: ready on port $PORT after ${i}s"
      return 0
    fi
    sleep 1
  done
  echo "dev server: not ready after ${WAIT}s (still running; check $LOG)" >&2
  return 1
}

case "${1:-}" in
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_stop && cmd_start ;;
  status)  cmd_status ;;
  *) echo "usage: $(basename "$0") start|stop|restart|status" >&2; exit 2 ;;
esac
