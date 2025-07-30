# Naja Admin

This project contains the backend API and frontend UI for the Naja Admin dashboard.

## Quick Start

This project uses a `Makefile` to automate common development tasks. Currently, only the api portion of the project is included.

The following commands are available for managing the backend API.

### 1. Install Dependencies

This command will create a Python virtual environment in `api/venv` and install all the required packages from `api/requirements.txt`.

```shell
make install-api
```

### 2. Run the Development Server

This will start the FastAPI development server with auto-reloading enabled. The API will be available at `http://127.0.0.1:8000`.

```shell
make run-api
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
```

### Available Commands

To see a list of all available commands, you can run `make` or `make help`:

```shell
make help
```

