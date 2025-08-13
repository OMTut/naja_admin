# Makefile for naja_admin
######################################################################
# Config
######################################################################

# Backend API Variables
API_DIR := api
API_VENV := $(API_DIR)/venv
API_REQUIREMENTS := $(API_DIR)/requirements.txt
API_ACTIVATE := $(API_VENV)/Scripts/activate.bat
API_TESTS := $(API_DIR)/tests
API_APP := main:app

# Frontend Variables
FRONTEND_DIR := frontend


.DEFAULT_GOAL := help
######################################################################
# Help
######################################################################
.PHONY: help
help:
	@echo "Available Backend commands:"
	@echo "  make install-api    - Set up the dev environment for api/ and install dependencies"
	@echo "  make run-api        - Run the API server"
	@echo "  make test-api       - Run API tests"
	@echo "  make test-api-clean - Run API tests with clean output"
	@echo "  make test-api-quick - Run API tests with minimal output"
	@echo "  make test-api-by-file - Run API tests grouped by file"
	@echo "  make clean-api      - Clean up the Backend API environment (remove venv)"
	@echo ""
	@echo "Available Frontend commands:"
	@echo "  make install-frontend     - Install frontend dependencies"
	@echo "  make run-frontend	   - Run the frontend development server"
	@echo "  make build-frontend       - Build the frontend for production"
	@echo "  make lint-frontend        - Run linting on the frontend code"
	@echo "  make clean-frontend       - Clean frontend environment"


######################################################################
# API Setup and Run
######################################################################
.PHONY: install-api run-api
# Set up the dev environment for api/ if it doesn't exist
# Install dependencies
install-api:
	@echo Setting up Backend API environment...
	@if not exist $(API_VENV) (python -m venv $(API_VENV)) else (echo "Virtual environment already exists.")
	@echo Installing dependencies...
	@call $(API_ACTIVATE) && pip install -r $(API_REQUIREMENTS)
	@echo Backend API setup complete.

# Run the API server
run-api:
	@echo Starting the API server...
	@call $(API_ACTIVATE) && uvicorn --app-dir $(API_DIR) $(API_APP) --reload

######################################################################
# API Testing
######################################################################
.PHONY: test-api test-api-clean test-api-quick test-api-by-file
test-api:
	@echo Running API tests...
	@call $(API_ACTIVATE) && pytest $(API_TESTS)
	@echo API tests completed.

# Clean output - no traceback, no header
test-api-clean:
	@echo Running API tests with clean output...
	@call $(API_ACTIVATE) && pytest $(API_TESTS) --tb=no --no-header -v
	@echo API tests completed.

# Quick output - minimal
test-api-quick:
	@echo Running API tests with minimal output...
	@call $(API_ACTIVATE) && pytest $(API_TESTS) -q
	@echo API tests completed.

# Group by file
test-api-by-file:
	@echo Running API tests grouped by file...
	@call $(API_ACTIVATE) && pytest $(API_TESTS) --tb=short --no-header -q
	@echo API tests completed.

######################################################################
# Cleanup
# Removes the venv.
# Used to test the setup process, but also in case venv is corrupted.
######################################################################
.PHONY: clean-api
clean-api:
	@echo Cleaning up Backend API environment...
	@if exist "$(API_VENV)" (rmdir /s /q "$(API_VENV)") else (echo "Virtual environment does not exist.")
	@echo Backend API environment cleaned up.

######################################################################
# Frontend Setup and Run
######################################################################
.PHONY: install-frontend run-frontend
install-frontend:
	@echo Installing frontend dependencies...
	@cd $(FRONTEND_DIR) && npm install
	@echo Frontend dependencies installed.

run-frontend:
	@echo Starting the frontend development server...
	@cd $(FRONTEND_DIR) && npm run dev

######################################################################
# Build Frontend
######################################################################
.PHONY: build-frontend
build-frontend:
	@echo "Building the frontend for production..."
	@cd $(FRONTEND_DIR) && npm run build

######################################################################
# Lint Frontend
######################################################################
.PHONY: lint-frontend
lint-frontend:
	@echo "Linting the frontend code..."
	@cd $(FRONTEND_DIR) && npm run lint
	@echo "Frontend linting completed."

######################################################################
# Clean Frontend
######################################################################
.PHONY: clean-frontend
clean-frontend:
	@echo "Cleaning up the frontend environment..."
	@if exist "$(FRONTEND_DIR)\node_modules" (rmdir /s /q "$(FRONTEND_DIR)\node_modules") else (echo "node_modules does not exist.")
	@echo "Frontend environment cleaned up."