#!/bin/bash
# TripAlfa Task Monitor
STATE_DIR="./state"
LOG_DIR="./logs"

show_status() {
    local task="$1"
    local sf="$STATE_DIR/${task}.state"
    local lf=$(ls -t "$LOG_DIR/${task}_"*.log 2>/dev/null | head -1)
    echo "Task: $task"
    [[ -f "$sf" ]] && echo "State: $(cat "$sf")" || echo "State: none"
    if [[ -n "$lf" ]]; then
        echo "Log: $lf ($(stat -f%z "$lf" 2>/dev/null | numfmt --to=iec 2>/dev/null || echo "unknown"))"
        tail -5 "$lf"
    fi
    echo "---"
}

if [[ -n "$1" ]]; then
    show_status "$1"
else
    echo "Tasks with state:"; ls "$STATE_DIR"/*.state 2>/dev/null | xargs -I{} basename {} .state
    echo "Logs:"; ls -lt "$LOG_DIR"/*.log 2>/dev/null | head -20
fi
