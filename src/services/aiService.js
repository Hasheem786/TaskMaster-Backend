const env = require('../config/env');

const generateTaskDescription = async (prompt, priority = 'MEDIUM') => {
  if (!prompt || prompt.trim() === '') {
    throw new Error('Prompt or task title is required to generate description');
  }

  const cleanPrompt = prompt.trim();

  // If Gemini API Key is configured, use official Google Gemini REST / SDK API
  if (env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert project manager. Generate a clear, structured task description for a task titled/prompted: "${cleanPrompt}". Include: 1. Objective 2. Key Action Items 3. Definition of Done.`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to smart local description generator:', err.message);
    }
  }

  // Smart local description synthesis fallback
  const normalized = cleanPrompt.toLowerCase();
  let actionItems = [
    '- Review initial task specifications and requirements.',
    '- Coordinate implementation steps with relevant team members.',
    '- Perform manual testing and verify edge cases.'
  ];

  if (normalized.includes('auth') || normalized.includes('login') || normalized.includes('jwt')) {
    actionItems = [
      '- Setup user authentication controllers and JWT token validation.',
      '- Encrypt user credentials with BCrypt password hashing.',
      '- Add route protection middleware and handle token expiration.'
    ];
  } else if (normalized.includes('db') || normalized.includes('database') || normalized.includes('model')) {
    actionItems = [
      '- Design database tables, fields, and index constraints.',
      '- Implement CRUD repository operations with error handling.',
      '- Verify data integrity and foreign key cascading.'
    ];
  } else if (normalized.includes('api') || normalized.includes('endpoint')) {
    actionItems = [
      '- Define RESTful API endpoints and HTTP status code mappings.',
      '- Implement input validation and error middleware.',
      '- Test endpoints with sample JSON payloads.'
    ];
  }

  return `### Objective
Execute and complete work for: "${cleanPrompt}"

### Deliverables & Key Tasks
${actionItems.join('\n')}

### Priority & Acceptance Criteria
- **Priority**: ${priority.toUpperCase()}
- **Definition of Done**: Code implemented, reviewed, tested, and integrated smoothly into the main branch.`;
};

const summarizeTask = async (task, comments = []) => {
  const commentText = comments.length > 0
    ? comments.map(c => `- ${c.user_name}: ${c.content}`).join('\n')
    : 'No comments posted yet.';

  if (env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Summarize this task titled "${task.title}" with status "${task.status}" and priority "${task.priority}". Description: "${task.description}". Comments:\n${commentText}`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to smart local summary generator:', err.message);
    }
  }

  return `Task Summary for "${task.title}" [Status: ${task.status} | Priority: ${task.priority}]:
- Description: ${task.description || 'No description provided.'}
- Assignee: ${task.assignee_name || 'Unassigned'}
- Total Comments: ${comments.length}
- Last Activity: ${comments.length > 0 ? comments[comments.length - 1].content : 'No activity recorded.'}`;
};

module.exports = {
  generateTaskDescription,
  summarizeTask
};
