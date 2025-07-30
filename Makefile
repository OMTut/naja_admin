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


.DEFAULT_GOAL := help
######################################################################
# Help
######################################################################
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make install-api    - Set up the dev environment for api/ and install dependencies"
	@echo "  make run-api        - Run the API server"
	@echo "  make test-api       - Run API tests"
	@echo "  make clean-api      - Clean up the Backend API environment (remove venv)"

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
.PHONY: test-api
test-api:
	@echo Running API tests...
	@call $(API_ACTIVATE) && pytest $(API_TESTS)
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