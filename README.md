# Trend Vision One MCP Server

A Model Context Protocol (MCP) server implementation for interacting with Trend Vision One's API through Large Language Models (LLMs) like ChatGPT or Claude.

## Overview

This server acts as a bridge between LLMs and the Trend Vision One API, allowing you to retrieve and analyze security alerts through natural language conversations. It implements tools that enable seamless interaction with Trend Micro's XDR platform using the Model Context Protocol.

## Features

- Get a list of security alerts with customizable filtering and sorting
- Retrieve detailed information about specific alerts
- Access investigation notes related to alerts
- Generate AI-powered summaries of findings and impact assessments
- Provide recommended actions based on alert severity

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- A Trend Vision One account with API access
- An access token for the Trend Vision One API

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/trendvisionserver.git
   cd trendvisionserver
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file to add your Trend Vision One API access token.

## Configuration

The server uses environment variables for configuration:

| Variable     | Description                            | Required |
| ------------ | -------------------------------------- | -------- |
| API_BASE_URL | The base URL for Trend Vision One API  | Yes      |
| ACCESS_TOKEN | Your Trend Vision One API access token | Yes      |

The default region is set to `https://api.mea.xdr.trendmicro.com`. If you need to use a different region, update the API_BASE_URL in your .env file.

## Running the Server

1. Build the TypeScript code:

   ```bash
   npm run build
   ```

2. Start the MCP server:
   ```bash
   npm start
   ```

The server will start running on stdio, which allows it to communicate with LLM clients.

## Usage

This MCP server provides several tools that LLMs can use to interact with the Trend Vision One API:

### Available Tools

#### 1. get-system-instructions

Retrieves guidelines on how to effectively use the Trend Vision One tools.

**Example LLM prompt:**
"What's the recommended way to use these tools?"

#### 2. get-alerts-list

Gets a list of alerts from Trend Vision One with flexible filtering options.

**Parameters:**

- `startDateTime` (optional): Start of time range (ISO-8601 format)
- `endDateTime` (optional): End of time range (ISO-8601 format)
- `status` (optional): Filter by alert status (new, in_progress, closed, reopened)
- `severity` (optional): Filter by severity (critical, high, medium, low, informational)
- And many more filtering options

**Example LLM prompt:**
"Show me all critical severity alerts from the past week"

#### 3. get-alert-details

Gets detailed information about a specific alert, including notes and an AI-generated investigation summary.

**Parameters:**

- `alertId` (required): The unique identifier of the alert

**Example LLM prompt:**
"Give me details about alert ABC123 with a summary of findings"

### Example Conversation

Here's an example of how you might interact with this server through an LLM:

1. **User:** "Show me recent in-progress alerts"
2. **LLM:** "I'll retrieve recent in-progress alerts from Trend Vision One" (calls get-alerts-list)
3. **User:** "Tell me more about the first alert in the list"
4. **LLM:** "I'll get detailed information about that alert" (calls get-alert-details with the alert ID)
5. **User:** "What actions should we take for this alert?"
6. **LLM:** "Based on the alert details and recommended actions..." (provides analysis based on the alert summary)

## Connecting to LLM Clients

This server is designed to work with any LLM client that supports the Model Context Protocol (MCP). To connect:

1. For Claude: Use the Claude Artifact format to make the server available to Claude
2. For other MCP-compatible LLMs: Follow the specific connection instructions for that LLM

## Troubleshooting

If you encounter issues:

1. Check that your API token is valid and has the correct permissions
2. Verify that the API base URL matches your Trend Vision One region
3. Check the server logs for error messages
4. Ensure your Node.js version is compatible

## Testing

### Prerequisites

- Ensure you have successfully built your MCP project
- Have Claude Desktop installed from claude.ai
- Have Node.js installed on your system

### Configuration Steps

1. Open Claude Desktop
2. Navigate to Settings
3. Go to the Developer tab
4. Locate and edit the configuration file

### Configuration File Details

The configuration file is typically located at `claude_desktop_config.json`. You'll need to add a server configuration for your MCP project.

#### Example Configuration

```json
{
  "mcpServers": {
    "trendvision": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/trendvisionserver/build/index.js"]
    }
  }
}
```

### Important Notes:

- Replace `/ABSOLUTE/PATH/TO/trendvisionserver/` with the full, absolute path to your project directory
- Ensure the path points to the compiled index.js in your project's build directory
- Use forward slashes (/) even on Windows systems
- Double-check that the path is correct and the file exists

### Verification

1. Reboot Claude Desktop
2. Check for the Trend Vision tool in the interface
3. Try asking Claude to retrieve some alerts to verify the integration is working

## License

[Your license information here]

## Contributing

[Your contribution guidelines here]
