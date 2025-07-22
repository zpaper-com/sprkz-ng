#!/bin/sh
# Health check script for Sprkz PDF Forms

# Configuration
HOST="localhost"
PORT="8080"
TIMEOUT="3"

# Health check function
check_health() {
    # Check if nginx is running and responding
    if ! curl -f -s --max-time "$TIMEOUT" "http://${HOST}:${PORT}/health" > /dev/null 2>&1; then
        echo "UNHEALTHY: nginx health check failed"
        return 1
    fi

    # Check if main application files are accessible
    if ! curl -f -s --max-time "$TIMEOUT" "http://${HOST}:${PORT}/" > /dev/null 2>&1; then
        echo "UNHEALTHY: main application not accessible"
        return 1
    fi

    # Check if static assets are being served
    if ! curl -f -s --max-time "$TIMEOUT" -I "http://${HOST}:${PORT}/static/" > /dev/null 2>&1; then
        # This might return 404, but nginx should respond
        if [ $? -eq 22 ]; then
            # 404 is expected for /static/ without file, but server should respond
            echo "HEALTHY: application responding"
            return 0
        else
            echo "UNHEALTHY: nginx not responding to static requests"
            return 1
        fi
    fi

    echo "HEALTHY: all checks passed"
    return 0
}

# Run health check
check_health
exit $?