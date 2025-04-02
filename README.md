# Tagore Speaks

An interactive conversational AI application that embodies the spirit and wisdom of Rabindranath Tagore, the renowned Bengali poet, writer, composer, and philosopher.

## Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Data Flow](#data-flow)
- [Function Call Flow Example](#function-call-flow-example)
- [Component Breakdown](#component-breakdown)
  - [Backend (`tagore-backend`)](#backend-tagore-backend)
  - [Frontend (`tagore-frontend`)](#frontend-tagore-frontend)
  - [Data Layer (`tagore-data`)](#data-layer-tagore-data)
- [Features](#features)
- [Tool-Based Interactions](#tool-based-interactions)
- [Setup and Installation](#setup-and-installation)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

## Project Overview

Tagore Speaks is a conversational AI application that allows users to interact with a virtual Rabindranath Tagore, powered by Anthropic's Claude AI. The system provides responses in Tagore's style, offers access to his literary works, and maintains context-aware conversations. It features a React-based frontend, a Flask-based Python backend, and SQLite databases for content and conversation management.

```
┌───────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│                   │     │                  │     │                   │
│  tagore-frontend  │◄────►    tagore-backend│◄────►    tagore-data    │
│   (React + Vue)   │     │  (Flask + Python)│     │ (SQLite Databases)│
│                   │     │                  │     │                   │
└───────────────────┘     └──────────────────┘     └───────────────────┘
                                   ▲
                                   │
                                   ▼
                         ┌──────────────────┐
                         │                  │
                         │   Anthropic API  │
                         │    (Claude AI)   │
                         │                  │
                         └──────────────────┘
```

## System Architecture

The project follows a standard three-tier architecture:

1. **Presentation Layer** (`tagore-frontend`) - A React/Vue application handling UI rendering and user interactions
2. **Application Layer** (`tagore-backend`) - Flask backend that processes requests, manages conversations, and integrates with Anthropic's Claude AI
3. **Data Layer** (`tagore-data`) - SQLite databases storing Tagore's works, conversation history, and inventory items

### Technology Stack

- **Frontend**: React, Vue.js, Tailwind CSS, TypeScript
- **Backend**: Python, Flask, Anthropic API
- **Database**: SQLite
- **AI**: Anthropic Claude 3.5 Sonnet
- **Tools**: Custom function-calling capabilities for retrieving Tagore's works

## Data Flow

```
┌───────────────┐                                             ┌───────────────┐
│               │                                             │               │
│     User      │                                             │  Tagore's     │
│  (Web Browser)│                                             │  Literary     │
│               │                                             │   Works       │
└───────┬───────┘                                             └───────┬───────┘
        │                                                             │
        │ 1. User sends message                                       │
        ▼                                                             │
┌───────────────┐     2. Message passed to backend     ┌───────────────┐
│               │──────────────────────────────────────►               │
│   Frontend    │                                      │    Backend    │
│  (React/Vue)  │                                      │    (Flask)    │
│               │◄─────────────────────────────────────│               │
└───────────────┘     7. Response sent to frontend     └───────┬───────┘
        ▲                                                      │
        │                                                      │ 3. Message + 
        │                                                      │ conversation history
        │                                                      ▼
        │                                              ┌───────────────┐
        │                                              │               │
        │                                              │  Anthropic    │
        │                                              │  Claude AI    │
        │                                              │               │
        │                                              └───────┬───────┘
        │                                                      │
        │                                                      │ 4. May call tools
        │                                                      ▼
        │                                              ┌───────────────┐
        │                                              │               │
        │                                              │    Tools      │
        │                                              │  (list_works, │
        │                                              │get_work_content)
        │                                              │               │
        │                                              └───────┬───────┘
        │                                                      │
        │                                                      │ 5. Tool response
        │                                                      │ (content fetched)
        │                                                      ▼
        │                                              ┌───────────────┐
        │                                              │               │
        │                                              │  Anthropic    │
        │                                              │  Claude AI    │
        │                                              │               │
        │                                              └───────┬───────┘
        │                                                      │
        │                                                      │ 6. Final response
        │                                                      │ with tool outputs 
        └──────────────────────────────────────────────────────┘ incorporated
```

### Detailed Flow Explanation

1. **User Interaction**: User enters a message in the web interface
2. **Frontend Processing**: The frontend captures the message and sends it to the backend API
3. **Backend Request Handling**: The backend routes the request to the chat endpoint
4. **Response Generation**:
   - The backend fetches conversation history for context
   - It sends the user message and conversation history to Anthropic's Claude AI
   - Claude processes the message within the context of Tagore's persona
5. **Tool Calling** (if applicable):
   - If the request requires information about Tagore's works, Claude calls custom tools
   - Tools query the SQLite database to retrieve relevant information
   - Tool responses are integrated into Claude's final response
6. **Database Storage**: The conversation is stored in the database for future context
7. **Response Delivery**: The response is sent back to the frontend for display
8. **Frontend Rendering**: The frontend displays the response to the user

## Function Call Flow Example

Below is a detailed function call flow diagram for the user query "tell me a poetry on love". This traces the exact path of execution through all components of the system.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                               FRONTEND                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   │
   │ 1. User inputs: "tell me a poetry on love"
   │    src/components/ChatInterface.vue::handleUserInput()
   │
   │ 2. UI updates to show pending message
   │    src/components/MessageBubble.vue::render()
   │
   │ 3. API call to backend
   │    src/services/api.js::sendMessage("tell me a poetry on love")
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                BACKEND                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   │
   │ 4. Request received at chat endpoint
   │    routes/chat_routes.py::chat_message()
   │
   │ 5. Generate conversation ID if new conversation
   │    uuid.uuid4() -> "12345-abcde-67890"
   │
   │ 6. Pass to response service
   │    response_service = ResponseService()
   │    response_service.generate_full_response("tell me a poetry on love", conversation_id)
   │
   │ 7. Add user message to database
   │    db.py::add_message(conversation_id, "user", "tell me a poetry on love")
   │
   │ 8. Get conversation history
   │    db.py::get_messages_by_conversation_id(conversation_id)
   │
   │ 9. Prepare messages for Anthropic API
   │    services/response_service.py::generate_full_response()
   │
   │ 10. Call Anthropic API with tools
   │     services/anthropic_service.py::create_message(messages, tools=[LIST_WORKS_TOOL, GET_WORK_CONTENT_TOOL])
   │
   │ 11. Anthropic API processes request
   │     Claude analyzes: "tell me a poetry on love" + context + tools available
   │     Claude decides to use the list_works tool to find love poems
   │
   │ 12. Tool use detected in response
   │     services/response_service.py::_handle_tool_call(tool_use, conversation_id, user_message_id)
   │
   │ 13. Call list_works tool with category="poem" for love-related poems
   │     services/response_service.py::_handle_list_works(tool_use, conversation_id, user_message_id)
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              DATA LAYER                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   │
   │ 14. Execute SQL query against creations.db
   │     tools/tagore_tools.py::list_works({"category": "poem"})
   │     conn = sqlite3.connect(DB_PATH)
   │     cursor.execute("""
   │        SELECT w.id, w.title, c.name as category, w.has_parts, w.date_created
   │        FROM works w
   │        JOIN categories c ON w.category_id = c.id
   │        WHERE c.name = 'poem'
   │     """)
   │
   │ 15. Filter results for love-related poems (done by Claude's analysis)
   │
   │ 16. Select a specific love poem
   │     tools/tagore_tools.py::get_work_content({"title": "Lover's Gift"})
   │
   │ 17. Query database for poem content
   │     conn = sqlite3.connect(DB_PATH)
   │     cursor.execute("""
   │         SELECT w.id, w.title, c.name as category, w.has_parts, w.date_created
   │         FROM works w 
   │         JOIN categories c ON w.category_id = c.id
   │         WHERE w.title = ?
   │     """, ("Lover's Gift",))
   │
   │ 18. Retrieve poem parts
   │     cursor.execute("""
   │         SELECT * FROM work_parts
   │         WHERE work_id = ?
   │         ORDER BY part_number
   │     """, (work_id,))
   │
   │ 19. Return poem content
   │     {"found": true, "title": "Lover's Gift", "content": "...full poem text..."}
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                               BACKEND                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   │
   │ 20. Store tool call in database
   │     db.py::add_tool_call(conversation_id, user_message_id, "get_work_content",
   │                        tool_params_json, tool_response_json)
   │
   │ 21. Format tool response for readability
   │     tools/tagore_tools.py::format_work_content_response(tool_response)
   │
   │ 22. Pass formatted response back to Claude API
   │     Claude incorporates poem into conversational response
   │
   │ 23. Combine text and tool outputs into final response
   │     services/response_service.py::generate_full_response() final processing
   │
   │ 24. Store assistant's response in database
   │     db.py::add_message(conversation_id, "assistant", response_text)
   │
   │ 25. Prepare response JSON for frontend
   │     return jsonify({
   │         "response": response_text,
   │         "conversationId": conversation_id,
   │         "speakableChunks": speakable_chunks
   │     })
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                               FRONTEND                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   │
   │ 26. Response received
   │     src/services/api.js::handleResponse()
   │
   │ 27. Update chat state
   │     src/stores/chat.js::addMessage(response)
   │
   │ 28. Render message with poem
   │     src/components/MessageBubble.vue::render()
   │
   │ 29. Update UI with complete conversation
   │     src/components/ChatInterface.vue::updateChat()
   │
   │ 30. (Optional) Process speakable chunks for voice
   │     src/services/voice.js::speak(speakableChunks)
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                USER                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   │
   │ 31. User sees Tagore's response with a beautifully formatted love poem
   │
```

### Detail of Anthropic Tool Integration (Steps 11-13)

The following sequence diagram shows how Claude AI processes the tool calls for retrieving poetry:

```
┌──────────┐          ┌──────────────┐          ┌───────────┐          ┌─────────────┐
│  Claude  │          │ResponseService│          │TagoreTools│          │  Database   │
└────┬─────┘          └───────┬──────┘          └─────┬─────┘          └──────┬──────┘
     │                        │                        │                       │
     │ tool_use request       │                        │                       │
     │───────────────────────>│                        │                       │
     │                        │                        │                       │
     │                        │ list_works({"category": "poem"})               │
     │                        │───────────────────────>│                       │
     │                        │                        │                       │
     │                        │                        │ SELECT FROM works     │
     │                        │                        │──────────────────────>│
     │                        │                        │                       │
     │                        │                        │ Return poems          │
     │                        │                        │<─────────────────────│
     │                        │                        │                       │
     │                        │ Return poems list      │                       │
     │                        │<──────────────────────│                       │
     │                        │                        │                       │
     │ Return poems list      │                        │                       │
     │<──────────────────────│                        │                       │
     │                        │                        │                       │
     │ tool_use for specific poem                      │                       │
     │───────────────────────>│                        │                       │
     │                        │                        │                       │
     │                        │ get_work_content({"title": "Lover's Gift"})    │
     │                        │───────────────────────>│                       │
     │                        │                        │                       │
     │                        │                        │ SELECT poem content   │
     │                        │                        │──────────────────────>│
     │                        │                        │                       │
     │                        │                        │ Return poem content   │
     │                        │                        │<─────────────────────│
     │                        │                        │                       │
     │                        │ Return poem content    │                       │
     │                        │<──────────────────────│                       │
     │                        │                        │                       │
     │ Final response with poem                        │                       │
     │<──────────────────────│                        │                       │
     │                        │                        │                       │
```

## Component Breakdown

### Backend (`tagore-backend`)

The backend is organized as follows:

```
tagore-backend/
├── app.py                 # Flask application entry point
├── config.py              # Configuration settings
├── db.py                  # Database connection and operations
├── .env                   # Environment variables
├── environment.yml        # Conda environment configuration
├── services/
│   ├── __init__.py
│   ├── anthropic_service.py  # Integration with Anthropic API
│   └── response_service.py   # Process responses and tool calls
├── routes/
│   ├── __init__.py
│   ├── chat_routes.py        # API endpoints for chat functionality
│   └── inventory_routes.py   # API endpoints for inventory management
└── tools/
    ├── __init__.py
    ├── tagore_tools.py       # Tools for accessing Tagore's works
    └── inventory_tools.py    # Tools for inventory management
```

#### Key Components

1. **Flask App (`app.py`)**: Entry point that initializes the application, registers routes/blueprints, and configures CORS.

2. **Configuration (`config.py`)**: 
   - Loads environment variables
   - Defines API settings for Anthropic
   - Contains system prompt configuration
   - Provides context-awareness functions (datetime, location)

3. **Database Utilities (`db.py`)**: 
   - Initializes database connections
   - Provides functions for message storage and retrieval
   - Stores tool call data and responses

4. **Services**:
   - **`anthropic_service.py`**: Handles communication with Anthropic API
     - Initializes the Anthropic client
     - Manages API requests with proper tool formatting
     - Handles API errors and logging
   - **`response_service.py`**: Processes responses and tool calls
     - Coordinates message flow between frontend, database, and Anthropic
     - Executes tool calls and formats responses
     - Handles speakable content for voice output

5. **Routes**:
   - **`chat_routes.py`**: Exposes endpoints for chat functionality
     - `/api/chat`: Processes user messages and returns responses
     - `/api/cartesia-auth`: Authentication for external services
   - **`inventory_routes.py`**: Manages inventory-related endpoints

6. **Tools**:
   - **`tagore_tools.py`**: Provides access to Tagore's literary works
     - `list_works`: Lists literary works with filtering options
     - `get_work_content`: Retrieves content of specific works
   - **`inventory_tools.py`**: Manages inventory items
     - `list_items`: Lists inventory items
     - `get_item_details`: Gets detailed information about items
     - `create_item`: Creates new inventory items
     - `update_item`: Updates existing items
     - `record_transaction`: Records sales/purchases

### Frontend (`tagore-frontend`)

The frontend is a React/Vue.js application with Tailwind CSS for styling:

```
tagore-frontend/
├── index.html
├── package.json
├── public/
├── src/
│   ├── App.vue                 # Main application component
│   ├── assets/                 # Static assets
│   ├── components/             # Reusable UI components
│   │   ├── ChatInterface.vue   # Chat UI component
│   │   ├── TagoreAvatar.vue    # Tagore's avatar component
│   │   ├── MessageBubble.vue   # Message display component
│   │   └── ...
│   ├── services/               # API service functions
│   │   └── api.js              # Backend API integration
│   ├── stores/                 # State management
│   │   └── chat.js             # Chat state management
│   └── main.js                 # Application entry point
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.ts              # Vite build configuration
└── tsconfig.json               # TypeScript configuration
```

### Data Layer (`tagore-data`)

The data layer consists of SQLite databases and utilities for managing content:

```
tagore-data/
├── tagore-data/                # Inner directory with primary data
│   └── creations.db            # SQLite database of Tagore's works
├── tagore_speaks_conversations.db  # Conversation history database
├── inventory.db                # Inventory management database
├── manage_creations.py         # Script for managing literary works
├── cleanup_categories.py       # Utilities for data cleanup
└── seeSQL.py                   # Database inspection utility
```

#### Database Schemas

1. **Creations Database (`creations.db`)**:
   - `categories`: Stores categories of works (poems, short stories, etc.)
   - `works`: Stores metadata about literary works
   - `work_parts`: Stores the actual content of works, divided by parts if applicable

2. **Conversations Database (`tagore_speaks_conversations.db`)**:
   - `conversations`: Stores conversation metadata
   - `messages`: Stores individual messages in conversations
   - `tool_calls`: Records tool calls made during conversations

3. **Inventory Database (`inventory.db`)**:
   - `items`: Stores inventory items
   - `transactions`: Records sales and purchases

## Features

### Core Capabilities

1. **Conversational AI**:
   - Natural language interaction with a virtual Rabindranath Tagore
   - Context-aware conversations that maintain history
   - Responses crafted in Tagore's style and persona

2. **Literary Access**:
   - Browse Tagore's works by category
   - Read complete works or specific parts
   - Get personalized recommendations

3. **Context Awareness**:
   - Aware of current date and time
   - Approximates user location for relevant responses
   - Remembers conversation history for coherent dialogue

4. **Inventory Management**:
   - Track virtual inventory items
   - Record sales and purchases
   - Manage item details and categories

## Tool-Based Interactions

The system uses custom tools to enhance Claude's capabilities:

### Literary Works Tools

1. **`list_works`**: 
   - **Description**: Lists creative works by Tagore
   - **Parameters**:
     - `category`: Type of works to list (poem, short-stories, essay, non-fiction, all)
     - `random`: Whether to return random works
     - `limit`: Maximum number of works to return
   - **Response**: List of works with metadata

2. **`get_work_content`**:
   - **Description**: Retrieves content of a specific work
   - **Parameters**:
     - `title`: Title of the work
     - `part_number`: Specific part to retrieve
     - `whole_work`: Whether to retrieve the entire work
     - `fuzzy_match`: Whether to use fuzzy matching for the title
   - **Response**: Content of the requested work

### Inventory Tools

1. **`list_items`**:
   - **Description**: Lists inventory items
   - **Parameters**: Various filtering and sorting options
   - **Response**: List of matching items

2. **`get_item_details`**:
   - **Description**: Gets detailed information about an item
   - **Parameters**: Item ID or name
   - **Response**: Detailed item information

3. **`create_item`**:
   - **Description**: Creates a new inventory item
   - **Parameters**: Item details
   - **Response**: Created item information

4. **`update_item`**:
   - **Description**: Updates an existing item
   - **Parameters**: Item ID and updated details
   - **Response**: Updated item information

5. **`record_transaction`**:
   - **Description**: Records a sale or purchase
   - **Parameters**: Transaction details
   - **Response**: Transaction confirmation

## Setup and Installation

### Prerequisites

- Python 3.8+
- Node.js 14+
- Anthropic API key

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tagore-speaks.git
   cd tagore-speaks
   ```

2. Set up the Python environment:
   ```bash
   cd tagore-backend
   conda env create -f environment.yml
   conda activate tagore-speaks
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Anthropic API key
   ```

4. Initialize the database:
   ```bash
   cd ../tagore-data
   python manage_creations.py --init
   ```

5. Start the backend server:
   ```bash
   cd ../tagore-backend
   python app.py
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd ../tagore-frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

## API Documentation

### Chat Endpoints

#### `POST /api/chat`

Processes a user message and returns a response.

**Request Body**:
```json
{
  "message": "Tell me about your poetry",
  "conversationId": "optional-existing-conversation-id"
}
```

**Response**:
```json
{
  "response": "My poetry often explores the relationship between humanity and nature...",
  "conversationId": "conversation-uuid",
  "speakableChunks": [
    {
      "text": "My poetry often explores...",
      "speakable": true
    }
  ]
}
```

#### `GET /api/cartesia-auth`

Provides authentication for external voice services.

**Response**:
```json
{
  "apiKey": "cartesia-api-key",
  "expiresAt": null
}
```

### Inventory Endpoints

Various endpoints for inventory management (list, create, update, transaction).

## Development

### Anthropic Claude AI Integration

The system integrates with Anthropic's Claude AI using the Anthropic Python SDK. The key integration points are:

1. **Client Initialization**:
   ```python
   self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
   ```

2. **Message Creation**:
   ```python
   response = self.client.messages.create(
       model=self.model,
       max_tokens=self.max_tokens,
       system=self.system_prompt,
       messages=messages,
       tools=tool_resources
   )
   ```

3. **Tool Definition**:
   ```python
   tool_resource = {
       "type": "custom",
       "custom": {
           "name": tool["name"],
           "description": tool["description"],
           "parameters": tool["input_schema"]
       }
   }
   ```

4. **Tool Call Handling**:
   ```python
   if content_block.type == "tool_use":
       # Process tool calls
       results = self._handle_tool_call(content_block, conversation_id, user_message_id)
   ```

### System Prompt Design

The system prompt is carefully crafted to embody Tagore's persona, including:

1. **Identity**: Sets the identity as Rabindranath Tagore
2. **Context Awareness**: Includes current date/time and location
3. **Response Directives**: Guidelines for response length and style
4. **Core Perspectives**: Key philosophical elements of Tagore's worldview
5. **Conversation Guidelines**: How to handle different types of questions

## Troubleshooting

### Common Issues

1. **API Key Issues**:
   - Check that your Anthropic API key is valid and properly set in `.env`
   - Ensure the API key has the correct permissions

2. **Tool Calling Issues**:
   - Verify tool format matches Anthropic API requirements
   - Check that database paths are correct
   - Ensure tool parameters match schema definitions
   - Ensure you are on the latest version of Anthropic

3. **Database Issues**:
   - Run database initialization scripts if tables are missing
   - Check file permissions for SQLite database files

4. **Frontend Connection Issues**:
   - Verify API URL configuration in frontend services
   - Check CORS settings in the backend

## Future Enhancements

1. **Multilingual Support**: Add support for Bengali language interactions
2. **Enhanced Voice Interface**: Improve voice input/output capabilities
3. **Expanded Literary Collection**: Add more of Tagore's works
4. **Visual Elements**: Include images related to Tagore's life and works
5. **Community Features**: Allow users to share conversations or insights

---


## Acknowledgements

- Anthropic for Claude AI
- https://github.com/abhiagni11/tagore-speaks.git


