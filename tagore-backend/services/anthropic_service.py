import logging
import anthropic  # type: ignore
from config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL, MAX_TOKENS, SYSTEM_PROMPT
import os 
import certifi
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
class AnthropicService:
    def __init__(self):
        """Initialize the Anthropic client"""
        # Set up SSL certificates
        
        os.environ['SSL_CERT_FILE'] = certifi.where()
        print(f"API Key loaded: {'*****' + ANTHROPIC_API_KEY[-4:] if ANTHROPIC_API_KEY else 'None'}")
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.model = ANTHROPIC_MODEL
        self.max_tokens = MAX_TOKENS
        self.system_prompt = SYSTEM_PROMPT
        logger.info(f"MODEL BEING USED: {self.model}")

    def get_client(self):
        """Return the initialized client"""
        return self.client

    def create_message(self, messages, tools=None):
        """Create a non-streaming message"""
        try:
            return self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=self.system_prompt,
                messages=messages,
                tools=tools,
            )
        except anthropic.APIConnectionError as e:
            logger.error("The server could not be reached")
            logger.error(f"Cause: {e.__cause__}")  # an underlying Exception, likely raised within httpx.
            raise
        except anthropic.RateLimitError as e:
            logger.error("A 429 status code was received; we should back off a bit.")
            raise
        except anthropic.APIStatusError as e:
            logger.error("Another non-200-range status code was received")
            logger.error(f"Status code: {e.status_code}")
            logger.error(f"Response: {e.response}")
            raise