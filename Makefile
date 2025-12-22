.PHONY: help dev dev:frontend dev:backend build test lint format clean

# Default target
help:
	@echo "Available commands:"
	@echo "  dev           - Start both frontend and backend in parallel"
	@echo "  dev:frontend  - Start frontend only (Vite dev server)"
	@echo "  dev:backend   - Start backend only (Cloudflare Workers)"
	@echo "  build         - Build frontend and workers"
	@echo "  test          - Run tests"
	@echo "  lint          - Run ESLint"
	@echo "  format        - Format code with Prettier"
	@echo "  clean         - Clean build artifacts"

# Start both frontend and backend
dev:
	@echo "Starting frontend and backend..."
	@npm run dev & npm run dev:workers

# Start frontend only
dev:frontend:
	@echo "Starting frontend..."
	@npm run dev

# Start backend only  
dev:backend:
	@echo "Starting backend..."
	@npm run dev:workers

# Build everything
build:
	@echo "Building frontend and workers..."
	@npm run build
	@npm run build:workers

# Run tests
test:
	@echo "Running tests..."
	@npm run test

# Run linting
lint:
	@echo "Running ESLint..."
	@npm run lint

# Format code
format:
	@echo "Formatting code..."
	@npm run format

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist/
	@rm -rf .wrangler/