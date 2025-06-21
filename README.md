# 🌳 Life Tree Journal

A voice-controlled life story management application built with Next.js and Vapi. This advanced journaling app allows you to build a comprehensive tree of your life experiences, memories, relationships, and achievements through natural voice conversation.

## 🚀 Features

### Voice-Controlled Life Journaling
- **Natural Voice Interaction**: Use your voice to add experiences, people, places, and goals to your life tree
- **Intelligent Assistant**: Powered by Vapi's AI assistant that understands context and asks follow-up questions
- **Emotional Intelligence**: Captures emotions, lessons learned, and personal insights

### Life Tree Structure
- **Hierarchical Organization**: Organize your life story in a tree structure with parent-child relationships
- **Multiple Node Types**: 
  - Experiences & Memories
  - People & Relationships
  - Places & Locations
  - Achievements & Milestones
  - Goals & Aspirations
  - Skills & Learning
  - Events & Occasions

### Rich Metadata
- **Emotional Tracking**: Tag experiences with emotions felt
- **Geographic Context**: Add locations and places
- **Temporal Organization**: Date-based timeline of your life
- **Relationship Mapping**: Connect people to experiences
- **Custom Tags**: Categorize and organize your entries
- **Importance Levels**: Mark critical, high, medium, or low importance

### Analytics & Insights
- **Life Statistics**: Overview of your life tree composition
- **Timeline Analysis**: Chronological view of your life events
- **Relationship Analytics**: See connections between people and experiences
- **Growth Tracking**: Monitor how your life story evolves over time

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Voice AI**: Vapi (Voice AI Platform)
- **Backend**: Next.js API Routes
- **Data Storage**: In-memory (easily extensible to database)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd berkeley-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Vapi credentials:
   ```env
   VAPI_API_KEY=your_vapi_api_key_here
   VAPI_PUBLIC_KEY=your_vapi_public_key_here
   VAPI_ASSISTANT_ID=your_assistant_id_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎤 Setting Up Vapi Integration

1. **Get Vapi API Keys**
   - Sign up at [vapi.ai](https://vapi.ai)
   - Create a new project
   - Get your API keys from the dashboard

2. **Configure Webhook**
   - Set your webhook URL to: `https://your-domain.com/api/webhook/vapi`
   - For local development, use ngrok or similar service

3. **Create Assistant**
   - Click "Setup Vapi Assistant" in the app
   - Or use the API endpoint: `POST /api/vapi/setup`

## 🔧 API Endpoints

### Tree Management
- `GET /api/tree` - Get entire life tree
- `POST /api/tree` - Add new node
- `PUT /api/tree` - Update existing node
- `DELETE /api/tree?nodeId=...` - Delete node

### Analytics & Search
- `GET /api/tree?action=stats` - Get tree statistics
- `GET /api/tree?action=analytics` - Get detailed analytics
- `GET /api/tree?action=timeline` - Get chronological timeline
- `GET /api/tree?action=search&...` - Search nodes with filters

### Vapi Integration
- `POST /api/webhook/vapi` - Vapi webhook handler
- `POST /api/vapi/setup` - Create Vapi assistant
- `POST /api/tree/sample` - Generate sample data

## 🗣️ Voice Commands

The Vapi assistant understands natural language commands like:

- **"Add a new experience about graduating from college"**
- **"Tell me about my best friend Sarah"**
- **"Document the time I hiked in Yosemite"**
- **"What are my recent life entries?"**
- **"Show me my life statistics"**
- **"Add a goal to learn machine learning"**
- **"What places are important in my life?"**

## 📊 Data Structure

### LifeTreeNode
```typescript
interface LifeTreeNode {
  id: string;
  type: 'experience' | 'person' | 'place' | 'achievement' | 'milestone' | 'memory' | 'goal' | 'relationship' | 'skill' | 'event';
  title: string;
  description: string;
  date?: string;
  location?: string;
  people?: string[];
  emotions?: string[];
  tags?: string[];
  importance: 'low' | 'medium' | 'high' | 'critical';
  children: LifeTreeNode[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

## 🎯 Use Cases

### Personal Life Journaling
- Document important life events and milestones
- Track personal growth and development
- Remember lessons learned from experiences
- Maintain a timeline of your life story

### Relationship Mapping
- Document important people in your life
- Track how relationships evolve over time
- Remember shared experiences and memories
- Understand your social network

### Goal Tracking
- Set and track personal and professional goals
- Document progress and achievements
- Learn from setbacks and challenges
- Celebrate successes and milestones

### Memory Preservation
- Capture precious memories before they fade
- Document family history and stories
- Preserve cultural and personal heritage
- Create a legacy for future generations

## 🔮 Future Enhancements

- **Database Integration**: PostgreSQL/MongoDB for persistent storage
- **Media Support**: Photos, videos, and audio attachments
- **Export Features**: PDF, JSON, or other formats
- **Privacy Controls**: User authentication and data protection
- **Mobile App**: React Native or Flutter mobile application
- **AI Insights**: Machine learning analysis of life patterns
- **Collaboration**: Share life stories with family and friends
- **Timeline Visualization**: Interactive timeline charts
- **Memory Triggers**: AI-powered memory prompts and reminders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vapi](https://vapi.ai) for providing the voice AI platform
- [Next.js](https://nextjs.org) for the React framework
- [Tailwind CSS](https://tailwindcss.com) for styling
- The open-source community for inspiration and tools

## 📞 Support

If you have any questions or need help setting up the application, please:

1. Check the [Vapi documentation](https://docs.vapi.ai)
2. Review the API endpoints in this README
3. Open an issue in the repository
4. Contact the development team

---

**Built with ❤️ for preserving life stories through voice technology**
