# Life Tree - Git Style Voice Journal

A NextJS application that creates a git-like tree structure of your life experiences, controlled entirely through voice commands using Vapi's voice AI.

## Features

- **Git-like Life Tree**: Your life as a branching timeline with commits, branches, and merges
- **Voice Control**: Add life events, create new life paths, and merge experiences through natural speech
- **Real-time Updates**: See your life tree update as you speak
- **Simple UI**: Clean interface showing tree statistics and JSON structure

## Tree Structure

The app models your life like a git repository:

- **Commits**: Individual life events (started a job, completed a project, etc.)
- **Branches**: Different life paths (career, personal, hobbies, relationships, etc.)
- **Merges**: When different life paths come together or influence each other

Each node contains:
- `title`: Event name
- `description`: What happened
- `timestamp`: When it occurred
- `type`: 'commit', 'branch', or 'merge'
- `branchName`: Which life path it belongs to
- `metadata`: Additional details like status, duration, etc.

## Voice Commands

You can speak natural language commands like:

- "I started a new job at Google as a software engineer"
- "I began learning guitar as a new hobby"
- "I completed my degree and it's now part of my main career path"
- "I started a side project about AI"
- "I finished the AI project and merged it back to my main career"

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd berkeley-ai
npm install
```

### 2. Environment Configuration

Copy the environment example and configure your Vapi API key:

```bash
cp env.example .env.local
```

Edit `.env.local` and add your Vapi API key:

```env
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key_here
```

### 3. Get Vapi API Key

1. Sign up at [vapi.ai](https://vapi.ai)
2. Create a new project
3. Get your API key from the dashboard
4. Add it to your `.env.local` file

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## API Endpoints

### Tree Operations
- `GET /api/tree` - Get the entire tree and statistics
- `POST /api/tree` - Add commits, create branches, or merge branches

### Vapi Integration
- `GET /api/vapi/setup` - Get Vapi tools configuration
- `POST /api/webhook/vapi` - Handle Vapi function calls

## Voice Integration Setup

### Current Demo Version
The current version simulates voice calls by adding sample data. To enable real voice integration:

### Full Voice Integration
1. **Set up Vapi Assistant**:
   - Create an assistant in Vapi dashboard
   - Configure the tools from `/api/vapi/setup`
   - Set the webhook URL to your domain + `/api/webhook/vapi`

2. **Configure Webhook**:
   - Deploy your app to a public domain
   - Update the webhook URL in Vapi dashboard
   - Ensure the webhook endpoint can handle function calls

3. **Update Frontend**:
   - Replace the simulated voice call with real Vapi SDK integration
   - Use the Vapi web components for voice interaction

## Available Tools

The voice assistant can use these tools:

### `add_commit`
Add a new life event to a branch
```json
{
  "branchName": "career",
  "title": "Started new job",
  "description": "Began working at Google",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### `create_branch`
Start a new life path
```json
{
  "branchName": "hobbies",
  "fromCommitId": "commit-id",
  "title": "Started learning guitar",
  "description": "Began a new hobby"
}
```

### `merge_branch`
Combine life paths
```json
{
  "branchName": "side-project",
  "targetBranch": "career",
  "title": "Completed AI project",
  "description": "Merged side project into career"
}
```

### `get_tree`, `get_branches`, `get_timeline`
Retrieve tree information for context

## Development

### Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── tree/route.ts          # Tree CRUD operations
│   │   ├── vapi/setup/route.ts    # Vapi tools configuration
│   │   └── webhook/vapi/route.ts  # Vapi webhook handler
│   └── page.tsx                   # Main UI
├── lib/
│   ├── treeService.ts             # Tree business logic
│   └── vapiService.ts             # Vapi integration
└── types/
    └── tree.ts                    # TypeScript definitions
```

### Adding New Features
1. **New Tree Operations**: Add methods to `TreeService`
2. **New Voice Tools**: Add tool definitions to `VapiService.getVapiTools()`
3. **UI Updates**: Modify `page.tsx` for new features

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vapi AI** - Voice integration
- **UUID** - Unique ID generation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the voice integration
5. Submit a pull request

## License

MIT License - see LICENSE file for details
