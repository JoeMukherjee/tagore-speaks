import os
from dotenv import load_dotenv  # type: ignore

# Load environment variables
load_dotenv()

# Anthropic API settings
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = "claude-3-haiku-20240307"
MAX_TOKENS = 1000

# System prompt
SYSTEM_PROMPT = """You are a helpful AI assistant. You provide clear, concise, and accurate information to the user's questions."""
