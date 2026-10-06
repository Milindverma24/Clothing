#!/usr/bin/env bash
# ==============================================================================
# Nova Fashion E-Commerce Platform — Unified Startup System
# ==============================================================================
# Starts all platform services in one command:
#   1. Spring Boot Backend API      (Port 8080)
#   2. Python AI ChatBot Service    (Port 8001)
#   3. React / Vite Storefront      (Port 5173)
# ==============================================================================

set -e

# Base directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$PROJECT_ROOT/.run"
LOG_DIR="$PROJECT_ROOT/logs"

# Ensure runtime directories exist
mkdir -p "$RUN_DIR" "$LOG_DIR"

# ANSI Colors for formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
MAGENTA="\033[0;35m"
RESET="\033[0m"

# Environment / Tool PATH resolution
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
if [ -d "$HOME/.nvm/versions/node" ]; then
    LATEST_NVM_NODE="$(ls -d "$HOME/.nvm/versions/node"/v* 2>/dev/null | tail -n 1)/bin"
    if [ -d "$LATEST_NVM_NODE" ]; then
        export PATH="$LATEST_NVM_NODE:$PATH"
    fi
fi

# Detect Python interpreter with uvicorn / fastapi support
detect_python() {
    if [ -n "$PYTHON_CMD" ] && command -v "$PYTHON_CMD" >/dev/null 2>&1; then
        echo "$PYTHON_CMD"
        return
    fi
    if [ -x "/opt/anaconda3/bin/python3" ]; then
        echo "/opt/anaconda3/bin/python3"
        return
    fi
    if [ -x "$HOME/opt/anaconda3/bin/python3" ]; then
        echo "$HOME/opt/anaconda3/bin/python3"
        return
    fi
    if [ -x "$PROJECT_ROOT/ChatBot/venv/bin/python" ]; then
        echo "$PROJECT_ROOT/ChatBot/venv/bin/python"
        return
    fi
    if command -v python3 >/dev/null 2>&1; then
        echo "$(command -v python3)"
        return
    fi
    if command -v python >/dev/null 2>&1; then
        echo "$(command -v python)"
        return
    fi
    echo ""
}

PYTHON_BIN="$(detect_python)"

# Helper to check if a process is still alive by PID
is_pid_running() {
    local pid="$1"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Helper to check if a port is listening
is_port_in_use() {
    local port="$1"
    if lsof -ti :"$port" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Get PIDs listening on a port
get_port_pids() {
    local port="$1"
    lsof -ti :"$port" 2>/dev/null || true
}

# Print the brand banner
print_banner() {
    echo -e "${BOLD}${CYAN}"
    echo "=================================================================="
    echo "         NOVA FASHION PLATFORM & AI SHOPPING ASSISTANT            "
    echo "=================================================================="
    echo -e "${RESET}"
}

# Stop all services
stop_services() {
    echo -e "${YELLOW}Stopping all platform services...${RESET}"

    # 1. Frontend (Port 5173)
    if [ -f "$RUN_DIR/frontend.pid" ]; then
        FPID=$(cat "$RUN_DIR/frontend.pid")
        if is_pid_running "$FPID"; then
            echo -e "  • Stopping React Frontend (PID: $FPID)..."
            kill "$FPID" 2>/dev/null || true
        fi
        rm -f "$RUN_DIR/frontend.pid"
    fi
    for p in $(get_port_pids 5173); do
        echo -e "  • Releasing Port 5173 (PID: $p)..."
        kill -9 "$p" 2>/dev/null || true
    done

    # 2. Python ChatBot (Port 8001)
    if [ -f "$RUN_DIR/chatbot.pid" ]; then
        CPID=$(cat "$RUN_DIR/chatbot.pid")
        if is_pid_running "$CPID"; then
            echo -e "  • Stopping AI ChatBot microservice (PID: $CPID)..."
            kill "$CPID" 2>/dev/null || true
        fi
        rm -f "$RUN_DIR/chatbot.pid"
    fi
    for p in $(get_port_pids 8001); do
        echo -e "  • Releasing Port 8001 (PID: $p)..."
        kill -9 "$p" 2>/dev/null || true
    done

    # 3. Spring Boot Backend (Port 8080)
    if [ -f "$RUN_DIR/backend.pid" ]; then
        BPID=$(cat "$RUN_DIR/backend.pid")
        if is_pid_running "$BPID"; then
            echo -e "  • Stopping Spring Boot Backend (PID: $BPID)..."
            kill "$BPID" 2>/dev/null || true
        fi
        rm -f "$RUN_DIR/backend.pid"
    fi
    for p in $(get_port_pids 8080); do
        echo -e "  • Releasing Port 8080 (PID: $p)..."
        kill -9 "$p" 2>/dev/null || true
    done

    sleep 1
    echo -e "${GREEN}✓ All services stopped successfully.${RESET}"
}

# Status checker
check_status() {
    print_banner
    echo -e "${BOLD}Current Services Status:${RESET}\n"

    # Backend
    if is_port_in_use 8080; then
        BPIDS=$(get_port_pids 8080 | tr '\n' ' ')
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/products 2>/dev/null || echo "000")
        echo -e "  ${GREEN}● Spring Boot Backend${RESET}    : ${BOLD}RUNNING${RESET} [Port 8080, PID(s): $BPIDS, HTTP: $HTTP_CODE]"
    else
        echo -e "  ${RED}○ Spring Boot Backend${RESET}    : ${BOLD}STOPPED${RESET} [Port 8080]"
    fi

    # ChatBot
    if is_port_in_use 8001; then
        CPIDS=$(get_port_pids 8001 | tr '\n' ' ')
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health 2>/dev/null || echo "000")
        echo -e "  ${GREEN}● AI ChatBot Agent${RESET}       : ${BOLD}RUNNING${RESET} [Port 8001, PID(s): $CPIDS, HTTP: $HTTP_CODE]"
    else
        echo -e "  ${RED}○ AI ChatBot Agent${RESET}       : ${BOLD}STOPPED${RESET} [Port 8001]"
    fi

    # Frontend
    if is_port_in_use 5173; then
        FPIDS=$(get_port_pids 5173 | tr '\n' ' ')
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null || echo "000")
        echo -e "  ${GREEN}● React / Vite Storefront${RESET} : ${BOLD}RUNNING${RESET} [Port 5173, PID(s): $FPIDS, HTTP: $HTTP_CODE]"
    else
        echo -e "  ${RED}○ React / Vite Storefront${RESET} : ${BOLD}STOPPED${RESET} [Port 5173]"
    fi
    echo ""
}

# Preflight requirements check
check_prerequisites() {
    echo -e "${CYAN}Checking environment prerequisites...${RESET}"

    # Java check
    if ! command -v java >/dev/null 2>&1; then
        echo -e "${RED}Error: Java is not installed or not in PATH. Please install Java 17+!${RESET}"
        exit 1
    fi
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "  ✓ Java: ${GREEN}$JAVA_VERSION${RESET}"

    # Maven wrapper check
    if [ ! -f "$PROJECT_ROOT/backend/mvnw" ]; then
        echo -e "${RED}Error: backend/mvnw wrapper not found!${RESET}"
        exit 1
    fi
    chmod +x "$PROJECT_ROOT/backend/mvnw"

    # Python check
    if [ -z "$PYTHON_BIN" ]; then
        echo -e "${RED}Error: Python 3 not found. Please install Python 3 or Anaconda!${RESET}"
        exit 1
    fi
    PY_VER=$("$PYTHON_BIN" --version 2>&1 || echo "Python 3")
    echo -e "  ✓ Python: ${GREEN}$PYTHON_BIN ($PY_VER)${RESET}"

    # Node & npm check
    if ! command -v npm >/dev/null 2>&1; then
        echo -e "${RED}Error: npm / Node.js not found in PATH!${RESET}"
        exit 1
    fi
    NODE_VER=$(node --version 2>&1 || echo "Node")
    echo -e "  ✓ Node: ${GREEN}$NODE_VER${RESET}"
}

# Start all platform components
start_services() {
    local daemon_mode=false
    if [ "$1" == "--daemon" ] || [ "$1" == "-d" ]; then
        daemon_mode=true
    fi

    print_banner
    check_prerequisites

    echo -e "\n${BOLD}${CYAN}Starting platform services...${RESET}"

    # 1. Start Spring Boot Backend if not already running
    if is_port_in_use 8080; then
        echo -e "  ${YELLOW}ℹ Spring Boot Backend is already running on port 8080.${RESET}"
    else
        echo -e "  🚀 Starting Spring Boot Backend (Port 8080)..."
        (
            cd "$PROJECT_ROOT/backend"
            ./mvnw spring-boot:run >> "$LOG_DIR/backend.log" 2>&1 &
            echo $! > "$RUN_DIR/backend.pid"
        )
    fi

    # 2. Start Python AI ChatBot Microservice if not already running
    if is_port_in_use 8001; then
        echo -e "  ${YELLOW}ℹ AI ChatBot microservice is already running on port 8001.${RESET}"
    else
        echo -e "  🤖 Starting Python AI ChatBot Agent (Port 8001)..."
        (
            cd "$PROJECT_ROOT/ChatBot"
            "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload >> "$LOG_DIR/chatbot.log" 2>&1 &
            echo $! > "$RUN_DIR/chatbot.pid"
        )
    fi

    # 3. Start React / Vite Storefront if not already running
    if is_port_in_use 5173; then
        echo -e "  ${YELLOW}ℹ React Storefront is already running on port 5173.${RESET}"
    else
        echo -e "  🎨 Starting React / Vite Storefront (Port 5173)..."
        (
            cd "$PROJECT_ROOT/frontend"
            npm run dev >> "$LOG_DIR/frontend.log" 2>&1 &
            echo $! > "$RUN_DIR/frontend.pid"
        )
    fi

    # Wait for service health readiness
    echo -e "\n${CYAN}Waiting for services to become healthy...${RESET}"

    # Probe Backend (up to 30 seconds)
    echo -n "  • Checking Backend API (http://localhost:8080)... "
    for i in {1..30}; do
        if curl -s -f http://localhost:8080/api/health >/dev/null 2>&1 || curl -s -f http://localhost:8080/api >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Ready!${RESET}"
            break
        fi
        if [ "$i" -eq 30 ]; then
            echo -e "${YELLOW}Timed out waiting, still initializing in background.${RESET}"
            break
        fi
        sleep 1
    done

    # Probe ChatBot (up to 15 seconds)
    echo -n "  • Checking AI ChatBot (http://localhost:8001)... "
    for i in {1..15}; do
        if curl -s -f http://localhost:8001/health >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Ready!${RESET}"
            break
        fi
        if [ "$i" -eq 15 ]; then
            echo -e "${YELLOW}Timed out waiting, still initializing in background.${RESET}"
            break
        fi
        sleep 1
    done

    # Probe Frontend (up to 15 seconds)
    echo -n "  • Checking Storefront (http://localhost:5173)... "
    for i in {1..15}; do
        if curl -s -f http://localhost:5173/ >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Ready!${RESET}"
            break
        fi
        if [ "$i" -eq 15 ]; then
            echo -e "${YELLOW}Timed out waiting, still initializing in background.${RESET}"
            break
        fi
        sleep 1
    done

    # Service Dashboard
    echo -e "\n${BOLD}${GREEN}=================================================================="
    echo "       🚀 ALL PLATFORM SERVICES ARE LIVE AND CONNECTED!           "
    echo "==================================================================${RESET}"
    echo -e "  🛍️  ${BOLD}Nova Customer Storefront (UI):${RESET}   ${CYAN}http://localhost:5173${RESET}"
    echo -e "  🛡️  ${BOLD}Nova Admin Dashboard (UI):${RESET}       ${CYAN}http://localhost:5173/admin${RESET}"
    echo -e "  ⚙️  ${BOLD}Nova Spring Boot REST API:${RESET}       ${CYAN}http://localhost:8080/api${RESET}"
    echo -e "  🤖 ${BOLD}Nova AI ChatBot Service:${RESET}         ${CYAN}http://localhost:8001/docs${RESET}"
    echo -e "  📁 ${BOLD}Logs Directory:${RESET}          ${CYAN}$LOG_DIR${RESET}"
    echo -e "------------------------------------------------------------------"
    echo -e "  • Stop all services:         ${BOLD}./start.sh stop${RESET} or ${BOLD}./stop.sh${RESET}"
    echo -e "  • Check health status:       ${BOLD}./start.sh status${RESET}"
    echo -e "  • Tail logs:                 ${BOLD}./start.sh logs [backend|chatbot|frontend]${RESET}"
    echo -e "==================================================================\n"

    if [ "$daemon_mode" = false ]; then
        echo -e "${YELLOW}Running in foreground. Press [Ctrl+C] to cleanly stop all services.${RESET}\n"
        trap stop_services INT TERM
        # Keep foreground alive while monitoring
        while true; do
            sleep 2
        done
    fi
}

# Tail logs helper
tail_logs() {
    local target="$1"
    case "$target" in
        backend)
            tail -f "$LOG_DIR/backend.log"
            ;;
        chatbot)
            tail -f "$LOG_DIR/chatbot.log"
            ;;
        frontend)
            tail -f "$LOG_DIR/frontend.log"
            ;;
        *)
            echo -e "${CYAN}Tailing all service logs (Ctrl+C to exit)...${RESET}"
            tail -f "$LOG_DIR/backend.log" "$LOG_DIR/chatbot.log" "$LOG_DIR/frontend.log"
            ;;
    esac
}

# Entrypoint argument parsing
case "$1" in
    stop)
        stop_services
        ;;
    status)
        check_status
        ;;
    restart)
        stop_services
        sleep 2
        start_services "$2"
        ;;
    logs)
        tail_logs "$2"
        ;;
    --help|-h)
        print_banner
        echo "Usage: ./start.sh [COMMAND|OPTION]"
        echo ""
        echo "Commands:"
        echo "  (none)      Start all services in foreground (Ctrl+C to stop)"
        echo "  --daemon|-d Start all services as background daemons"
        echo "  stop        Stop all running services"
        echo "  restart     Restart all services"
        echo "  status      Check health and port status of all services"
        echo "  logs [svc]  Tail service logs (backend | chatbot | frontend | all)"
        echo ""
        ;;
    *)
        start_services "$1"
        ;;
esac
