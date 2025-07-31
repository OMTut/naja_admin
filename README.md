# Naja Admin

This project contains the backend API and frontend UI for the Naja Admin dashboard.

## Quick Start

This project uses a `Makefile` to automate common development tasks.

### 1. Install Dependencies

This command will create a Python virtual environment in `api/venv` and install all the required packages from `api/requirements.txt`.

```shell
make install-api
```

Install npm dependencies for the React frontend
```shell
make install-frontend
```

### 2. Run the Development Servers

This will start the FastAPI development server with auto-reloading enabled. The API will be available at `http://127.0.0.1:8000`.

```shell
make run-api
```

Run the React + Vite frontend
```shell
make run-frontend
```

### 3. Run Tests

This command will execute the test suite for the backend API using `pytest`.

```shell
make test-api
```

### 4. Clean the Environment

This will completely remove the Python virtual environment directory (`api/venv`). This is useful for starting fresh or troubleshooting.

```shell
make clean-api
make clean-frontend
```

### Available Commands

To see a list of all available commands, you can run `make` or `make help`:

```shell
make help
```

