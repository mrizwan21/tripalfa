#!/bin/bash
# TripAlfa Long-Running Task Runner
# Usage: ./scripts/run-long-task.sh <script-name>
# Features: auto-restart, persistent logging, progress tracking, macOS notifications

MAX_RETRIES=${MAX_RETRIES:-50}
INITIAL_BACKOFF=${INITIAL_BACKOFF:-30}
MAX_BACKOFF=${MAX_BACKOFF:-300}
LOG_DIR="./logs"
STATE_DIR="./state"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$LOG_DIR" "$STATE_DIR"

RUNNING=true
cleanup() {
    echo "Stopping gracefully..."
    RUNNING=false
    [ -n "$CHILD_PID" ] && kill -TERM "$CHILD_PID" 2>/dev/null && wait "$CHILD_PID" 2>/dev/null
    exit 130
}
trap cleanup SIGINT SIGTERM SIGHUP

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

notify_macos() {
    [[ "$OSTYPE" == "darwin"* ]] && osascript -e "display notification \"$2\" with title \"$1\""
}

main() {
    local task_name="${1}"; shift
    local extra_args="$@"
    
    if [[ -z "$task_name" ]]; then
        echo "Usage: $0 <script-name> [args]"
        echo "Available:"; ls "$SCRIPT_DIR"/*.ts 2>/dev/null | xargs -I{} basename {} .ts
        exit 1
    fi
    
    local ts=$(date '+%Y%m%d_%H%M%S')
    LOG_FILE="$LOG_DIR/${task_name}_${ts}.log"
    STATE_FILE="$STATE_DIR/${task_name}.state"
    
    echo "==========================================================="
    echo " TripAlfa Long-Running Task Runner"
    echo " Task: $task_name"
    echo " Log:  $LOG_FILE"
    echo "==========================================================="
    
    local script_path=""
    [[ -f "$SCRIPT_DIR/${task_name}.ts" ]] && script_path="$SCRIPT_DIR/${task_name}.ts"
    [[ -f "$SCRIPT_DIR/${task_name}.js" ]] && script_path="$SCRIPT_DIR/${task_name}.js"
    [[ -f "$task_name" ]] && script_path="$task_name"
    
    if [[ -z "$script_path" ]]; then echo "Script not found: $task_name"; exit 1; fi
    
    log "Starting: $task_name"
    
    local attempt=0 backoff=$INITIAL_BACKOFF
    local start_time=$(date +%s)
    
    while $RUNNING && [ $attempt -lt $MAX_RETRIES ]; do
        attempt=$((attempt + 1))
        log "Attempt $attempt/$MAX_RETRIES"
        echo "{\"attempt\": $attempt, \"started\": $(date +%s)}" > "$STATE_FILE"
        
        if [[ "$script_path" == *.ts ]]; then
            npx tsx "$script_path" $extra_args >> "$LOG_FILE" 2>&1 &
        else
            node "$script_path" $extra_args >> "$LOG_FILE" 2>&1 &
        fi
        CHILD_PID=$!
        wait $CHILD_PID
        EXIT_CODE=$?
        CHILD_PID=""
        
        local duration=$(( $(date +%s) - start_time ))
        log "Exit code: $EXIT_CODE | Duration: $((duration/3600))h $(((duration%3600)/60))m"
        
        if [ $EXIT_CODE -eq 0 ]; then
            log "SUCCESS!"
            echo "{\"status\": \"completed\"}" > "$STATE_FILE"
            notify_macos "Task Complete" "$task_name finished!"
            exit 0
        fi
        
        if [ $attempt -ge $MAX_RETRIES ]; then
            log "MAX RETRIES REACHED"
            echo "{\"status\": \"failed\"}" > "$STATE_FILE"
            notify_macos "Task Failed" "$task_name failed after $attempt attempts"
            exit 1
        fi
        
        log "Waiting ${backoff}s before retry..."
        sleep $backoff
        backoff=$((backoff * 2))
        [ $backoff -gt $MAX_BACKOFF ] && backoff=$MAX_BACKOFF
    done
}

main "$@"
