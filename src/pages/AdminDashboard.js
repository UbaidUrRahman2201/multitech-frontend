// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  MessageSquare,
  LogOut,
  Zap,
  Plus,
  X,
  Upload,
  Send,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
} from 'lucide-react';

let socket;

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Forms
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', files: [] });
  const [newMessage, setNewMessage] = useState({ receiver: '', subject: '', content: '' });
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Employee' });


  useEffect(() => {
    fetchData();
    
    // Socket.io connection
    socket = io('http://localhost:5000');
    socket.emit('join', user._id);

    socket.on('taskUpdated', (task) => {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    });

    socket.on('taskCompleted', (task) => {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
      fetchData(); // Refresh stats
    });

    socket.on('newMessage', (message) => {
      if (message.receiver._id === user._id) {
        setMessages(prev => [message, ...prev]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user._id]);

  const fetchData = async () => {
    try {
      const [statsRes, employeesRes, tasksRes, messagesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats'),
        axios.get('http://localhost:5000/api/admin/employees'),
        axios.get('http://localhost:5000/api/tasks'),
        axios.get('http://localhost:5000/api/messages'),
      ]);

      setStats(statsRes.data);
      setEmployees(employeesRes.data);
      setTasks(tasksRes.data);
      setMessages(messagesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/employees', newEmployee);
      setShowEmployeeModal(false);
      setNewEmployee({ name: '', email: '', password: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating employee');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newTask.title);
      formData.append('description', newTask.description);
      formData.append('assignedTo', newTask.assignedTo);
      
      for (let file of newTask.files) {
        formData.append('files', file);
      }

      await axios.post('http://localhost:5000/api/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowTaskModal(false);
      setNewTask({ title: '', description: '', assignedTo: '', files: [] });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating task');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/messages', newMessage);
      setShowMessageModal(false);
      setNewMessage({ receiver: '', subject: '', content: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending message');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure? This will delete all related tasks and messages.')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/employees/${id}`);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting employee');
      }
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`http://localhost:5000/api/tasks/${id}`);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting task');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'in-progress': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-blue-400 bg-blue-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tech-darker via-tech-dark to-tech-darker">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-tech-blue to-tech-purple rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MultiTechWorld</h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'overview'
                  ? 'bg-tech-blue text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'employees'
                  ? 'bg-tech-blue text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Employees</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'tasks'
                  ? 'bg-tech-blue text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span>Tasks</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'messages'
                  ? 'bg-tech-blue text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'register'
                  ? 'bg-tech-blue text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Register User</span>
            </button>

          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Dashboard Overview</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-10 h-10 text-blue-400" />
                    <span className="text-3xl font-bold text-white">{stats.totalEmployees || 0}</span>
                  </div>
                  <p className="text-gray-300 font-medium">Total Employees</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <CheckSquare className="w-10 h-10 text-purple-400" />
                    <span className="text-3xl font-bold text-white">{stats.totalTasks || 0}</span>
                  </div>
                  <p className="text-gray-300 font-medium">Total Tasks</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-xl p-6 border border-green-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                    <span className="text-3xl font-bold text-white">{stats.completedTasks || 0}</span>
                  </div>
                  <p className="text-gray-300 font-medium">Completed Tasks</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <Clock className="w-10 h-10 text-yellow-400" />
                    <span className="text-3xl font-bold text-white">{stats.pendingTasks || 0}</span>
                  </div>
                  <p className="text-gray-300 font-medium">Pending Tasks</p>
                </div>
              </div>

              {/* Recent Tasks */}
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Recent Tasks</h3>
                <div className="space-y-3">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-400">
                          Assigned to: {task.assignedTo.name}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white">Employees</h2>
                <button
                  onClick={() => setShowEmployeeModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-tech-blue text-white rounded-lg hover:shadow-lg transition"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Employee</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(employee => (
                  <div key={employee._id} className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-tech-blue to-tech-purple rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {employee.name.charAt(0)}
                      </div>
                      <button
                        onClick={() => handleDeleteEmployee(employee._id)}
                        className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{employee.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{employee.email}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        Joined: {new Date(employee.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white">Tasks</h2>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-tech-blue text-white rounded-lg hover:shadow-lg transition"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Task</span>
                </button>
              </div>

              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task._id} className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
                        <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>To: {task.assignedTo.name}</span>
                          <span>•</span>
                          <span>{new Date(task.assignedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {task.files.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-400 mb-2">Attached Files:</p>
                        <div className="flex flex-wrap gap-2">
                          {task.files.map((file, idx) => (
                            <a
                              key={idx}
                              href={`http://localhost:5000/${file.path}`}
                              download
                              className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-lg text-sm text-tech-blue hover:bg-white/20 transition"
                            >
                              <Download className="w-4 h-4" />
                              <span>{file.filename}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {task.completionFiles.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Completion Files:</p>
                        <div className="flex flex-wrap gap-2">
                          {task.completionFiles.map((file, idx) => (
                            <a
                              key={idx}
                              href={`http://localhost:5000/${file.path}`}
                              download
                              className="flex items-center space-x-2 px-3 py-1 bg-green-400/20 rounded-lg text-sm text-green-400 hover:bg-green-400/30 transition"
                            >
                              <Download className="w-4 h-4" />
                              <span>{file.filename}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white">Messages</h2>
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-tech-blue text-white rounded-lg hover:shadow-lg transition"
                >
                  <Send className="w-5 h-5" />
                  <span>New Message</span>
                </button>
              </div>

              <div className="space-y-4">
                {messages.map(message => (
                  <div key={message._id} className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{message.subject}</h3>
                        <p className="text-sm text-gray-400">
                          {message.sender._id === user._id ? 'To' : 'From'}: {' '}
                          {message.sender._id === user._id ? message.receiver.name : message.sender.name}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(message.sentDate).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{message.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Employee Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-tech-dark border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Add Employee</h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tech-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tech-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tech-blue"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-tech-blue to-tech-purple text-white font-semibold rounded-lg hover:shadow-lg transition"
              >
                Create Employee
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-tech-dark border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Create Task</h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tech-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tech-blue"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Assign To</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tech-blue"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Attach Files</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setNewTask({ ...newTask, files: Array.from(e.target.files) })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tech-blue file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-tech-blue file:text-white file:cursor-pointer"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-tech-blue to-tech-purple text-white font-semibold rounded-lg hover:shadow-lg transition"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-tech-dark border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Send Message</h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">To</label>
                <select
                  value={newMessage.receiver}
                  onChange={(e) => setNewMessage({ ...newMessage, receiver: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tech-blue"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tech-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Message</label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tech-blue"
                  rows="6"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-tech-blue to-tech-purple text-white font-semibold rounded-lg hover:shadow-lg transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Register User Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Register New User</h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await axios.post('http://localhost:5000/api/auth/register', newUser);
                  alert('User registered successfully!');
                  setShowRegisterModal(false);
                  setNewUser({ name: '', email: '', password: '', role: 'Employee' });
                  fetchData();
                } catch (error) {
                  alert(error.response?.data?.message || 'Error registering user');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-tech-blue hover:bg-tech-purple text-white font-semibold py-2 rounded-lg transition"
              >
                Register User
              </button>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminDashboard;