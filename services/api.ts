import axios from 'axios';

// For production (Vercel), use relative URL so proxy works; for local dev, use env variable.
const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check for Demo Mode blocking
    // We import the store dynamically to avoid circular dependencies if possible, 
    // but direct import is usually fine in Next.js client-side.
    // However, api.ts might be imported before store initialization. 
    // Safer to check localStorage for the flag.
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('isDemoMode') === 'true';

    if (isDemoMode) {
      // Mock /auth/me for user data
      if (config.method?.toLowerCase() === 'get' && config.url?.endsWith('/auth/me')) {
        config.adapter = async (config) => {
          return {
            data: {
              status: 'success',
              data: {
                id: 'demo-user-id',
                email: 'demo@hrm.com',
                role: 'ADMIN',
                isActive: true,
                employee: {
                  id: 'demo-emp-id',
                  employeeId: 'DEMO001',
                  firstName: 'Demo',
                  lastName: 'User',
                  position: 'System Evaluator',
                  department: 'Evaluation',
                  avatar: undefined
                }
              }
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          };
        };
      }

      // Mock /reports/employees for dashboard stats
      if (config.method?.toLowerCase() === 'get' && config.url?.endsWith('/reports/employees')) {
        config.adapter = async (config) => {
          return {
            data: {
              status: 'success',
              data: {
                total: 25,
                active: 24,
                inactive: 1,
                byDepartment: [
                  { department: 'Engineering', _count: { _all: 12 } },
                  { department: 'Design', _count: { _all: 5 } },
                  { department: 'HR', _count: { _all: 3 } },
                  { department: 'Sales', _count: { _all: 5 } }
                ],
                byRole: [
                  { role: 'EMPLOYEE', _count: { _all: 20 } },
                  { role: 'MANAGER', _count: { _all: 4 } },
                  { role: 'ADMIN', _count: { _all: 1 } }
                ]
              }
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          };
        };
      }

      // Mock /leave for leave stats
      if (config.method?.toLowerCase() === 'get' && (config.url?.includes('/leave') || config.url?.includes('/leave?'))) {
        config.adapter = async (config) => {
          if (config.url?.includes('/balance')) {
            return {
              data: {
                status: 'success',
                data: {
                  total: 20,
                  used: 5,
                  remaining: 15
                }
              },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }
          return {
            data: {
              status: 'success',
              data: [
                {
                  id: 'imp-leave-1',
                  employeeId: 'demo-emp-id',
                  type: 'VACATION',
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 86400000).toISOString(),
                  days: 2,
                  reason: 'Demo Vacation',
                  status: 'APPROVED',
                  createdAt: new Date().toISOString(),
                  employee: {
                    id: 'demo-emp-id',
                    firstName: 'Demo',
                    lastName: 'User',
                    employeeId: 'DEMO001'
                  }
                }
              ]
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          };
        };
      }

      // Mock /users
      if (config.method?.toLowerCase() === 'get' && config.url?.includes('/users')) {
        config.adapter = async (config) => {
          if (config.url?.match(/\/users\/[\w-]+$/)) {
            // Get user by ID (mock)
            return {
              data: {
                status: 'success',
                data: {
                  id: 'demo-user-id',
                  email: 'demo@hrm.com',
                  role: 'ADMIN',
                  isActive: true,
                  employee: {
                    id: 'demo-emp-id',
                    employeeId: 'DEMO001',
                    firstName: 'Demo',
                    lastName: 'User',
                    department: 'Engineering',
                    position: 'Software Engineer',
                    avatar: undefined
                  }
                }
              },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          const users = [
            {
              id: 'demo-user-id',
              email: 'demo@hrm.com',
              role: 'ADMIN',
              isActive: true,
              employee: {
                id: 'demo-emp-id',
                employeeId: 'DEMO001',
                firstName: 'Demo',
                lastName: 'User',
                department: 'Engineering',
                position: 'Software Engineer',
                avatar: undefined
              }
            },
            {
              id: 'user-2',
              email: 'alice@hrm.com',
              role: 'HR',
              isActive: true,
              employee: {
                id: 'demo-emp-2',
                employeeId: 'DEMO002',
                firstName: 'Alice',
                lastName: 'Smith',
                department: 'HR',
                position: 'HR Manager',
                avatar: undefined
              }
            },
            {
              id: 'user-3',
              email: 'bob@hrm.com',
              role: 'MANAGER',
              isActive: true,
              employee: {
                id: 'demo-emp-3',
                employeeId: 'DEMO003',
                firstName: 'Bob',
                lastName: 'Johnson',
                department: 'Sales',
                position: 'Sales Manager',
                avatar: undefined
              }
            },
            {
              id: 'user-4',
              email: 'charlie@hrm.com',
              role: 'EMPLOYEE',
              isActive: false,
              employee: {
                id: 'demo-emp-4',
                employeeId: 'DEMO004',
                firstName: 'Charlie',
                lastName: 'Brown',
                department: 'Marketing',
                position: 'Content Writer',
                avatar: undefined
              }
            }
          ];

          return {
            data: {
              status: 'success',
              data: {
                users: users,
                pagination: {
                  currentPage: 1,
                  totalPages: 1,
                  totalCount: users.length,
                  limit: 20
                }
              }
            },
            status: 200, statusText: 'OK', headers: {}, config, request: {}
          };
        };
      }


      // Mock /employees
      if (config.method?.toLowerCase() === 'get' && config.url?.includes('/employees')) {
        config.adapter = async (config) => {
          if (config.url?.includes('/departments')) {
            return {
              data: { status: 'success', data: ['Engineering', 'HR', 'Sales', 'Marketing', 'Design'] },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          const employees = [
            {
              id: 'demo-emp-id',
              employeeId: 'DEMO001',
              firstName: 'Demo',
              lastName: 'User',
              department: 'Engineering',
              position: 'Software Engineer',
              isActive: true,
              email: 'demo@hrm.com'
            },
            {
              id: 'demo-emp-2',
              employeeId: 'DEMO002',
              firstName: 'Alice',
              lastName: 'Smith',
              department: 'HR',
              position: 'HR Manager',
              isActive: true,
              email: 'alice@hrm.com'
            }
          ];

          if (config.url?.match(/\/employees\/[\w-]+$/) && !config.url?.endsWith('/employees')) {
            return {
              data: { status: 'success', data: employees[0] },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          return {
            data: {
              status: 'success',
              data: employees
            },
            status: 200, statusText: 'OK', headers: {}, config, request: {}
          };
        };
      }

      // Mock /attendance
      if (config.method?.toLowerCase() === 'get' && config.url?.includes('/attendance')) {
        config.adapter = async (config) => {
          if (config.url?.includes('/monthly-report')) {
            return {
              data: {
                status: 'success',
                data: {
                  totalDays: 20,
                  presentDays: 18,
                  absentDays: 1,
                  lateDays: 1,
                  workFromHomeDays: 2,
                  attendance: []
                }
              },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }
          return {
            data: {
              status: 'success',
              data: [
                {
                  id: 'att-1',
                  info: 'Demo Attendance',
                  status: 'PRESENT',
                  date: new Date().toISOString(),
                  punchIn: new Date().toISOString(),
                  punchOut: new Date().toISOString()
                }
              ]
            },
            status: 200, statusText: 'OK', headers: {}, config, request: {}
          };
        };
      }

      // Mock /projects
      if (config.method?.toLowerCase() === 'get' && config.url?.includes('/projects')) {
        config.adapter = async (config) => {
          if (config.url?.includes('/stats')) {
            return {
              data: {
                status: 'success',
                data: {
                  totalProjects: 5,
                  activeProjects: 3,
                  completedProjects: 2,
                  overduedProjects: 0,
                  projectsByStatus: { 'IN_PROGRESS': 3, 'COMPLETED': 2 },
                  projectsByPriority: { 'HIGH': 2, 'MEDIUM': 3 }
                }
              },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          const projects = [
            {
              id: 'proj-1',
              name: 'Demo Project Alpha',
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              progress: 75,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
              description: 'A demo project for testing.',
              manager: { firstName: 'Demo', lastName: 'Manager' },
              members: []
            }
          ];

          if (config.url?.match(/\/projects\/[\w-]+$/) && !config.url?.endsWith('/projects')) {
            return {
              data: { status: 'success', data: projects[0] },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          // Project list wrapper with pagination structure
          return {
            data: {
              status: 'success',
              data: {
                projects: projects,
                pagination: {
                  currentPage: 1,
                  totalPages: 1,
                  totalCount: 1,
                  limit: 20
                }
              }
            },
            status: 200, statusText: 'OK', headers: {}, config, request: {}
          };
        };
      }

      // Mock /tasks
      if (config.method?.toLowerCase() === 'get' && config.url?.includes('/tasks')) {
        config.adapter = async (config) => {
          const tasks = [
            {
              _id: 'task-1',
              title: 'Implement Demo Mode',
              description: 'Add mock data for all modules',
              status: 'In Progress',
              priority: 'High',
              storyPoints: 5,
              projectId: { _id: 'proj-1', name: 'Demo Project Alpha' },
              assigneeId: {
                _id: 'demo-emp-id',
                firstName: 'Demo',
                lastName: 'User',
                avatar: undefined
              },
              tags: ['feature', 'urgent'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              _id: 'task-2',
              title: 'Fix Navigation',
              description: 'Ensure all links work',
              status: 'Backlog',
              priority: 'Medium',
              storyPoints: 3,
              projectId: { _id: 'proj-1', name: 'Demo Project Alpha' },
              assigneeId: {
                _id: 'demo-emp-2',
                firstName: 'Alice',
                lastName: 'Smith'
              },
              tags: ['bug'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];

          if (config.url?.match(/\/tasks\/[\w-]+$/) && !config.url?.endsWith('/tasks')) {
            return {
              data: { status: 'success', data: tasks[0] },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          return {
            data: { status: 'success', data: tasks },
            status: 200, statusText: 'OK', headers: {}, config, request: {}
          };
        };
      }

      // Mock /performance
      if (config.method?.toLowerCase() === 'get' && config.url?.includes('/performance')) {
        config.adapter = async (config) => {
          const performances = [
            {
              id: 'perf-1',
              employeeId: 'demo-emp-id',
              reviewPeriod: '2023-Q4',
              rating: 4.5,
              goals: ['Improve code quality', 'Mentor juniors'],
              achievements: ['Delivered Project X', 'Reduced bugs by 20%'],
              feedback: 'Excellent work this quarter.',
              createdAt: new Date().toISOString(),
              employee: {
                id: 'demo-emp-id',
                firstName: 'Demo',
                lastName: 'User',
                employeeId: 'DEMO001'
              }
            }
          ];

          if (config.url?.match(/\/performance\/[\w-]+$/)) {
            // Get by ID
            return {
              data: { status: 'success', data: performances[0] },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          return {
            data: { status: 'success', data: performances },
            status: 200, statusText: 'OK', headers: {}, config, request: {}
          };
        };
      }

      // Mock /recruitment
      if (config.method?.toLowerCase() === 'get' && config.url?.includes('/recruitment')) {
        config.adapter = async (config) => {
          if (config.url?.includes('/jobs')) {
            const jobs = [
              {
                id: 'job-1',
                title: 'Senior Frontend Developer',
                department: 'Engineering',
                position: 'Senior Engineer',
                description: 'We are looking for a React expert.',
                requirements: ['5+ years React', 'TypeScript', 'Next.js'],
                location: 'Remote',
                employmentType: 'FULL_TIME',
                status: 'OPEN',
                postedAt: new Date().toISOString(),
                applications: []
              },
              {
                id: 'job-2',
                title: 'UX Designer',
                department: 'Design',
                position: 'Designer',
                description: 'Creative designer needed.',
                requirements: ['Figma', 'Adobe XD', 'User Research'],
                location: 'New York',
                employmentType: 'FULL_TIME',
                status: 'OPEN',
                postedAt: new Date().toISOString(),
                applications: []
              }
            ];

            if (config.url?.match(/\/recruitment\/jobs\/[\w-]+$/)) {
              return {
                data: { status: 'success', data: jobs[0] },
                status: 200, statusText: 'OK', headers: {}, config, request: {}
              };
            }

            return {
              data: { status: 'success', data: jobs },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          if (config.url?.includes('/applications')) {
            return {
              data: {
                status: 'success',
                data: [
                  {
                    id: 'app-1',
                    jobPostingId: 'job-1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '123-456-7890',
                    status: 'PENDING',
                    appliedAt: new Date().toISOString(),
                    jobPosting: { title: 'Senior Frontend Developer' }
                  }
                ]
              },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          return {
            data: { status: 'success', data: [] },
            status: 200, statusText: 'OK', headers: {}, config, request: {}
          };
        };
      }

      // Mock /chat
      if (config.method?.toLowerCase() === 'get' && config.url?.includes('/chat')) {
        config.adapter = async (config) => {
          // Conversations
          if (config.url?.includes('/conversations')) {
            return {
              data: {
                status: 'success',
                data: [
                  {
                    employee: {
                      id: 'demo-emp-2',
                      firstName: 'Alice',
                      lastName: 'Smith',
                      avatar: undefined,
                      position: 'HR Manager'
                    },
                    lastMessage: {
                      id: 'msg-1',
                      message: 'Hey, how is the demo going?',
                      type: 'text',
                      createdAt: new Date().toISOString(),
                      sender: { id: 'demo-emp-2', firstName: 'Alice', lastName: 'Smith' }
                    },
                    unreadCount: 1
                  }
                ]
              },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          // Groups
          if (config.url?.includes('/groups') && !config.url?.includes('/messages')) {
            return {
              data: {
                status: 'success',
                data: [
                  {
                    id: 'group-1',
                    name: 'General',
                    description: 'General discussion',
                    type: 'PUBLIC',
                    createdBy: 'admin-id',
                    createdAt: new Date().toISOString(),
                    members: [],
                    myRole: 'MEMBER'
                  }
                ]
              },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          // Messages (Direct or Group)
          if (config.url?.includes('/messages')) {
            return {
              data: {
                status: 'success',
                data: [
                  {
                    id: 'msg-1',
                    senderId: 'demo-emp-2',
                    message: 'Welcome to the demo chat!',
                    type: 'text',
                    isRead: true,
                    createdAt: new Date().toISOString(),
                    sender: { id: 'demo-emp-2', firstName: 'Alice', lastName: 'Smith' }
                  },
                  {
                    id: 'msg-2',
                    senderId: 'demo-emp-id',
                    message: 'Thanks! Everything looks great.',
                    type: 'text',
                    isRead: true,
                    createdAt: new Date(Date.now() + 1000).toISOString(),
                    sender: { id: 'demo-emp-id', firstName: 'Demo', lastName: 'User' }
                  }
                ]
              },
              status: 200, statusText: 'OK', headers: {}, config, request: {}
            };
          }

          return {
            data: { status: 'success', data: [] },
            status: 200, statusText: 'OK', headers: {}, config, request: {}
          };
        };
      }

      // Block mutations
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        const controller = new AbortController();
        config.signal = controller.signal;
        controller.abort('Demo Mode: Write operations are simulated.');

        config.adapter = async (config) => {
          return {
            data: { status: 'success', message: 'Action simulated (Demo Mode)' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          };
        };
      }
    }

    const token = localStorage.getItem('accessToken');
    // In demo mode, we might use a fake token, which matches what we set in authStore.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

