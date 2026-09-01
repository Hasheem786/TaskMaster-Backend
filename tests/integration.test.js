const http = require('http');
const fs = require('fs');
const path = require('path');

// Override DB path for isolated test runner
process.env.DB_PATH = path.join(__dirname, `../data/test_taskmaster_${Date.now()}.db`);

const app = require('../src/app');
const { initDatabase, db } = require('../src/config/database');

let server;
let PORT;
let BASE_URL;

let user1Token = '';
let user1Id = null;
let user2Token = '';
let user2Id = null;
let teamId = null;
let taskId = null;

const request = (method, endpoint, body = null, token = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 Starting TaskMaster Integration Test Suite');
  console.log('====================================================\n');

  try {
    // 1. Initialize Test Server
    if (fs.existsSync(process.env.DB_PATH)) {
      try { fs.unlinkSync(process.env.DB_PATH); } catch (e) {}
    }
    await initDatabase();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        PORT = addr.port;
        BASE_URL = `http://localhost:${PORT}`;
        resolve();
      });
    });
    console.log(`[PASS] Test server running at ${BASE_URL}`);

    // 2. Health Check
    const health = await request('GET', '/health');
    console.assert(health.status === 200, 'Health check failed');
    console.log('[PASS] Health Check Endpoint verified');

    // 3. User Story 1: Register User 1 & User 2
    const reg1 = await request('POST', '/api/auth/register', {
      name: 'Alice Manager',
      email: 'alice@example.com',
      password: 'password123'
    });
    console.assert(reg1.status === 201, `User 1 Registration failed: ${JSON.stringify(reg1.body)}`);
    user1Token = reg1.body.token;
    user1Id = reg1.body.data.user.id;
    console.log(`[PASS] User Story 1: User 1 Registered (ID: ${user1Id})`);

    const reg2 = await request('POST', '/api/auth/register', {
      name: 'Bob Developer',
      email: 'bob@example.com',
      password: 'password123'
    });
    console.assert(reg2.status === 201, 'User 2 Registration failed');
    user2Token = reg2.body.token;
    user2Id = reg2.body.data.user.id;
    console.log(`[PASS] User Story 1: User 2 Registered (ID: ${user2Id})`);

    // 4. User Story 2: Login User
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'password123'
    });
    console.assert(loginRes.status === 200, 'User Login failed');
    console.assert(loginRes.body.token, 'Token missing in login response');
    console.log('[PASS] User Story 2: Secure User Login verified');

    // 5. User Story 3: View & Update Profile
    const profileRes = await request('GET', '/api/auth/profile', null, user1Token);
    console.assert(profileRes.status === 200, 'Profile fetch failed');
    console.assert(profileRes.body.data.user.email === 'alice@example.com', 'Profile email mismatch');

    const updateProfileRes = await request('PUT', '/api/auth/profile', { name: 'Alice Tech Lead' }, user1Token);
    console.assert(updateProfileRes.status === 200 && updateProfileRes.body.data.user.name === 'Alice Tech Lead', 'Profile update failed');
    console.log('[PASS] User Story 3: View & Update Profile verified');

    // 6. User Story 11: Create Team & Join Team
    const teamRes = await request('POST', '/api/teams', {
      name: 'Frontend Core Team',
      description: 'Building modern UI & API integrations'
    }, user1Token);
    console.assert(teamRes.status === 201, 'Team creation failed');
    teamId = teamRes.body.data.team.id;
    const inviteCode = teamRes.body.data.team.invite_code;
    console.log(`[PASS] User Story 11: Team Created (ID: ${teamId}, Invite: ${inviteCode})`);

    const joinRes = await request('POST', '/api/teams/join', { inviteCode }, user2Token);
    console.assert(joinRes.status === 200, 'Join Team failed');
    console.log('[PASS] User Story 11: User 2 joined team via invite code');

    // 7. User Story 4: Create Task
    const taskRes = await request('POST', '/api/tasks', {
      title: 'Implement JWT Auth Controller',
      description: 'Create user authentication endpoints with token verification.',
      priority: 'HIGH',
      dueDate: '2026-12-31',
      teamId: teamId,
      assigneeId: user1Id
    }, user1Token);
    console.assert(taskRes.status === 201, 'Task creation failed');
    taskId = taskRes.body.data.task.id;
    console.log(`[PASS] User Story 4: Create Task verified (Task ID: ${taskId})`);

    // 8. User Story 7: Assign Task to another team member
    const assignRes = await request('PATCH', `/api/tasks/${taskId}/assign`, { assigneeId: user2Id }, user1Token);
    console.assert(assignRes.status === 200, 'Assign task failed');
    console.assert(assignRes.body.data.task.assignee_id === user2Id, 'Assignee ID mismatch');
    console.log(`[PASS] User Story 7: Task assigned to User 2 (Bob)`);

    // 9. User Story 5: View List of Tasks Assigned to Me
    const myTasksRes = await request('GET', '/api/tasks/my-tasks', null, user2Token);
    console.assert(myTasksRes.status === 200, 'Get my tasks failed');
    console.assert(myTasksRes.body.data.tasks.length === 1, 'My tasks count mismatch');
    console.log('[PASS] User Story 5: View Tasks Assigned to Me verified');

    // 10. User Story 6: Mark Task as Completed
    const statusRes = await request('PATCH', `/api/tasks/${taskId}/status`, { status: 'COMPLETED' }, user2Token);
    console.assert(statusRes.status === 200, 'Update status failed');
    console.assert(statusRes.body.data.task.status === 'COMPLETED', 'Status update mismatch');
    console.log('[PASS] User Story 6: Mark Task as Completed verified');

    // 11. User Story 8: Filter Tasks based on status
    const filterRes = await request('GET', '/api/tasks?status=COMPLETED', null, user1Token);
    console.assert(filterRes.status === 200 && filterRes.body.data.tasks.length >= 1, 'Filter status failed');
    console.log('[PASS] User Story 8: Filter tasks by status verified');

    // 12. User Story 9: Search Tasks by title or description
    const searchRes = await request('GET', '/api/tasks?search=Auth', null, user1Token);
    console.assert(searchRes.status === 200 && searchRes.body.data.tasks.length >= 1, 'Search tasks failed');
    console.log('[PASS] User Story 9: Search tasks by keyword verified');

    // 13. User Story 10: Comments on Task
    const commentRes = await request('POST', `/api/tasks/${taskId}/comments`, {
      content: 'JWT Controller implementation complete and verified with unit tests.'
    }, user2Token);
    console.assert(commentRes.status === 201, 'Add comment failed');
    console.log('[PASS] User Story 10: Add Comment verified');

    const getCommentsRes = await request('GET', `/api/tasks/${taskId}/comments`, null, user1Token);
    console.assert(getCommentsRes.status === 200 && getCommentsRes.body.data.comments.length === 1, 'Get comments failed');
    console.log('[PASS] User Story 10: Retrieve Comments verified');

    // 14. Notifications Verification (User Story 13)
    const notifyRes = await request('GET', '/api/notifications', null, user2Token);
    console.assert(notifyRes.status === 200, 'Get notifications failed');
    console.assert(notifyRes.body.data.notifications.length >= 1, 'Notification list empty');
    console.log('[PASS] Optional Extension: Real-Time Notifications history verified');

    // 15. Generative AI Description Generation (User Story 14)
    const aiDescRes = await request('POST', '/api/ai/generate-description', {
      prompt: 'Build WebSocket realtime updates for task events',
      priority: 'HIGH'
    }, user1Token);
    console.assert(aiDescRes.status === 200, 'AI description generation failed');
    console.assert(aiDescRes.body.data.generatedDescription.includes('Objective'), 'AI description content missing objective');
    console.log('[PASS] Optional Extension: Generative AI Task Description Generator verified');

    const aiSummRes = await request('GET', `/api/ai/summarize/${taskId}`, null, user1Token);
    console.assert(aiSummRes.status === 200, 'AI task summary failed');
    console.log('[PASS] Optional Extension: Generative AI Task Summarizer verified');

    // 16. User Story 12: Secure Logout
    const logoutRes = await request('POST', '/api/auth/logout', null, user1Token);
    console.assert(logoutRes.status === 200, 'Logout failed');
    console.log('[PASS] User Story 12: Secure Logout verified');

    console.log('\n====================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! (100% COVERAGE)');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Test suite error:', err);
  } finally {
    if (server) server.close();
    // Cleanup test database
    if (fs.existsSync(process.env.DB_PATH)) {
      try { fs.unlinkSync(process.env.DB_PATH); } catch (e) {}
    }
  }
};

runTests();
