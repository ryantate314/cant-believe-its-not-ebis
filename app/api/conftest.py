"""Pytest configuration for API tests."""

import sys
from pathlib import Path

# Add the api directory to the Python path so tests can import main, core, etc.
sys.path.insert(0, str(Path(__file__).parent))
