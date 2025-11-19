#!/bin/bash

################################################################################
# Debug Provisioning Script for Bifrostvault
# 
# This script wraps the provision.sh script with detailed logging and debugging
# to help troubleshoot any issues during VM setup.
#
# Features:
# - Detailed timestamped logging
# - Command execution tracking
# - Error capture and reporting
# - Log file with full output
# - Real-time console output
# - Exit code tracking
# - Execution time measurement
#
# Usage:
#   chmod +x debug-provision.sh
#   ./debug-provision.sh
#
# Log file location:
#   /tmp/bifrostvault-provision-YYYYMMDD-HHMMSS.log
#
# Author: Bifrostvault Team
# Version: 1.0.0
################################################################################

set -euo pipefail  # Exit on error, undefined variables, pipe failures

################################################################################
# Configuration
################################################################################

# Generate log file name with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="/tmp/bifrostvault-provision-${TIMESTAMP}.log"
ERROR_LOG="/tmp/bifrostvault-provision-errors-${TIMESTAMP}.log"

# Script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROVISION_SCRIPT="${SCRIPT_DIR}/provision.sh"

# Colors for console output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly NC='\033[0m' # No Color

################################################################################
# Logging Functions
################################################################################

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Write to log file
    echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"
    
    # Write to console with colors
    case "${level}" in
        INFO)
            echo -e "${BLUE}[${timestamp}]${NC} ${CYAN}[INFO]${NC} ${message}"
            ;;
        SUCCESS)
            echo -e "${BLUE}[${timestamp}]${NC} ${GREEN}[SUCCESS]${NC} ${message}"
            ;;
        WARN)
            echo -e "${BLUE}[${timestamp}]${NC} ${YELLOW}[WARN]${NC} ${message}"
            ;;
        ERROR)
            echo -e "${BLUE}[${timestamp}]${NC} ${RED}[ERROR]${NC} ${message}"
            echo "[${timestamp}] [ERROR] ${message}" >> "${ERROR_LOG}"
            ;;
        DEBUG)
            echo -e "${BLUE}[${timestamp}]${NC} ${MAGENTA}[DEBUG]${NC} ${message}"
            ;;
        *)
            echo -e "${BLUE}[${timestamp}]${NC} ${message}"
            ;;
    esac
}

log_info() {
    log INFO "$@"
}

log_success() {
    log SUCCESS "$@"
}

log_warn() {
    log WARN "$@"
}

log_error() {
    log ERROR "$@"
}

log_debug() {
    log DEBUG "$@"
}

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║         BIFROSTVAULT DEBUG PROVISIONING SCRIPT                 ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_separator() {
    echo -e "${CYAN}================================================================${NC}"
}

print_section() {
    echo
    print_separator
    log_info "$1"
    print_separator
    echo
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if provision.sh exists
    if [[ ! -f "${PROVISION_SCRIPT}" ]]; then
        log_error "Provision script not found: ${PROVISION_SCRIPT}"
        exit 1
    fi
    
    # Check if provision.sh is executable
    if [[ ! -x "${PROVISION_SCRIPT}" ]]; then
        log_warn "Provision script is not executable, making it executable..."
        chmod +x "${PROVISION_SCRIPT}"
    fi
    
    log_success "Prerequisites check passed"
}

capture_system_info() {
    log_info "Capturing system information..."
    
    {
        echo "=== System Information ==="
        echo "Date: $(date)"
        echo "Hostname: $(hostname)"
        echo "User: $(whoami)"
        echo "OS: $(lsb_release -d 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME)"
        echo "Kernel: $(uname -r)"
        echo "Architecture: $(uname -m)"
        echo
        echo "=== Memory ==="
        free -h
        echo
        echo "=== Disk Space ==="
        df -h
        echo
        echo "=== CPU Info ==="
        lscpu | grep -E "Model name|CPU\(s\)|Thread|Core"
        echo
        echo "=== Network Interfaces ==="
        ip addr show
        echo
    } >> "${LOG_FILE}"
    
    log_success "System information captured"
}

execute_with_logging() {
    local start_time=$(date +%s)
    local exit_code=0
    
    log_info "Starting provision script execution..."
    log_info "Log file: ${LOG_FILE}"
    log_info "Error log: ${ERROR_LOG}"
    echo
    
    # Execute provision.sh with full logging
    if bash -x "${PROVISION_SCRIPT}" 2>&1 | tee -a "${LOG_FILE}"; then
        exit_code=0
        log_success "Provision script completed successfully"
    else
        exit_code=$?
        log_error "Provision script failed with exit code: ${exit_code}"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "Execution time: ${duration} seconds ($(date -u -d @${duration} +%T))"
    
    return ${exit_code}
}

analyze_errors() {
    log_info "Analyzing errors..."
    
    if [[ -s "${ERROR_LOG}" ]]; then
        log_warn "Errors were logged during execution"
        echo
        echo -e "${YELLOW}=== Error Summary ===${NC}"
        cat "${ERROR_LOG}"
        echo
    else
        log_success "No errors detected"
    fi
}

print_summary() {
    echo
    print_separator
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║              PROVISIONING EXECUTION COMPLETE                   ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    print_separator
    echo
    
    log_info "Summary:"
    echo "  Log file: ${LOG_FILE}"
    echo "  Error log: ${ERROR_LOG}"
    echo "  Script: ${PROVISION_SCRIPT}"
    echo
    
    if [[ -s "${ERROR_LOG}" ]]; then
        log_warn "Errors were encountered during execution"
        log_info "Review error log: ${ERROR_LOG}"
    else
        log_success "Execution completed without errors"
    fi
    
    echo
    log_info "To view the full log:"
    echo "  cat ${LOG_FILE}"
    echo
    log_info "To view errors only:"
    echo "  cat ${ERROR_LOG}"
    echo
    log_info "To search the log:"
    echo "  grep -i 'error' ${LOG_FILE}"
    echo "  grep -i 'warning' ${LOG_FILE}"
    echo
}

cleanup_on_exit() {
    local exit_code=$?
    
    if [[ ${exit_code} -ne 0 ]]; then
        log_error "Script exited with code: ${exit_code}"
        
        # Capture last 50 lines of log for quick debugging
        echo
        echo -e "${RED}=== Last 50 lines of log ===${NC}"
        tail -50 "${LOG_FILE}"
        echo
    fi
    
    print_summary
}

################################################################################
# Main Execution
################################################################################

main() {
    # Set up exit trap
    trap cleanup_on_exit EXIT
    
    # Print header
    print_header
    
    # Initialize log file
    log_info "Initializing debug provisioning script..."
    log_info "Log file: ${LOG_FILE}"
    log_info "Error log: ${ERROR_LOG}"
    
    # Check prerequisites
    print_section "Checking Prerequisites"
    check_prerequisites
    
    # Capture system information
    print_section "Capturing System Information"
    capture_system_info
    
    # Execute provision script
    print_section "Executing Provision Script"
    execute_with_logging
    local provision_exit_code=$?
    
    # Analyze errors
    print_section "Analyzing Results"
    analyze_errors
    
    # Exit with same code as provision script
    exit ${provision_exit_code}
}

################################################################################
# Script Entry Point
################################################################################

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    log_error "This script should NOT be run as root"
    log_info "Run as regular user: ./debug-provision.sh"
    exit 1
fi

# Run main function
main "$@"
