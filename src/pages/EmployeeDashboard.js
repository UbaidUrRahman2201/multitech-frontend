// src/pages/EmployeeDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import {
  CheckSquare,
  MessageSquare,
  LogOut,
  Zap,
  Upload,
  Send,
  CheckCircle2,
  Clock,
  Download,
  X,
  FileText,
  AlertCircle,
  User,
  Calendar,
  Inbox,
  Mail,
} from 'lucide-react';

let socket;

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionFiles, setCompletionFiles] = useState([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState({ subject: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Socket.io connection
    socket = io('https://multitech-backend.vercel.app');
    socket.emit('join', user._id);

    socket.on('newTask', (task) => {
      setTasks(prev => [task, ...prev]);
      // Show notification
      showNotification('New Task Assigned', task.title);
    });

    socket.on('newMessage', (message) => {
      if (message.receiver._id === user._id) {
        setMessages(prev => [message, ...prev]);
        showNotification('New Message', message.subject);
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user._id]);

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, messagesRes] = await Promise.all([
        axios.get('https://multitech-backend.vercel.app/api/tasks'),
        axios.get('https://multitech-backend.vercel.app/api/messages'),
      ]);

      setTasks(tasksRes.data);
      setMessages(messagesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    
    if (!selectedTask) return;

    try {
      const formData = new FormData();
      for (let file of completionFiles) {
        formData.append('files', file);
      }

      await axios.post(
        `https://multitech-backend.vercel.app/api/tasks/${selectedTask._id}/complete`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      alert('Task completed successfully!');
      setShowCompleteModal(false);
      setSelectedTask(null);
      setCompletionFiles([]);
      fetchData();
    } catch (error) {
      console.error('Error completing task:', error);
      alert(error.response?.data?.message || 'Error completing task');
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await axios.patch(`https://multitech-backend.vercel.app/api/tasks/${taskId}/status`, { status });
      fetchData();
      alert(`Task status updated to ${status}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(error.response?.data?.message || 'Error updating task status');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    
    if (!selectedTask) return;

    try {
      await axios.post('https://multitech-backend.vercel.app/api/messages', {
        receiver: selectedTask.sender._id,
        subject: `Re: ${replyMessage.subject}`,
        content: replyMessage.content,
      });

      alert('Reply sent successfully!');
      setShowMessageModal(false);
      setReplyMessage({ subject: '', content: '' });
      setSelectedTask(null);
      fetchData();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert(error.response?.data?.message || 'Error sending message');
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await axios.patch(`https://multitech-backend.vercel.app/api/messages/${messageId}/read`);
      fetchData();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'in-progress': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      default: return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const unreadMessages = messages.filter(m => !m.read && m.receiver._id === user._id);
  const receivedMessages = messages.filter(m => m.receiver._id === user._id);
  const sentMessages = messages.filter(m => m.sender._id === user._id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tech-darker via-tech-dark to-tech-darker">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-tech-blue mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tech-darker via-tech-dark to-tech-darker">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-tech-blue to-tech-purple rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MultiTechWorld</h1>
                <p className="text-xs text-gray-400">Employee Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-tech-blue to-tech-purple rounded-full flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Logout"
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
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                activeTab === 'tasks'
                  ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CheckSquare className="w-5 h-5" />
                <span className="font-medium">My Tasks</span>
              </div>
              {tasks.length > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  activeTab === 'tasks' ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {tasks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                activeTab === 'messages'
                  ? 'bg-gradient-to-r from-tech-blue to-tech-purple text-white shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">Messages</span>
              </div>
              {unreadMessages.length > 0 && (
                <span className="px-2 py-1 bg-red-500 rounded-full text-xs text-white font-semibold animate-pulse">
                  {unreadMessages.length}
                </span>
              )}
            </button>
          </nav>

          {/* Stats Summary */}
          <div className="p-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 px-2">Task Statistics</h3>
            <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-sm text-gray-300">Pending</span>
                </div>
                <span className="text-lg font-bold text-blue-400">{pendingTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-sm text-gray-300">In Progress</span>
                </div>
                <span className="text-lg font-bold text-yellow-400">{inProgressTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm text-gray-300">Completed</span>
                </div>
                <span className="text-lg font-bold text-green-400">{completedTasks.length}</span>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="mt-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-500/30">
              <p className="text-xs text-gray-400 mb-2">Completion Rate</p>
              <p className="text-2xl font-bold text-white">
                {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
              </p>
              <div className="mt-2 bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-tech-blue to-tech-purple h-full rounded-full transition-all duration-500"
                  style={{ width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-73px)]">
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">My Tasks</h2>
                  <p className="text-gray-400 text-sm">Manage and complete your assigned tasks</p>
                </div>
                <div className="text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                  Total: <span className="text-white font-semibold">{tasks.length}</span> tasks
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-16 border border-white/10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-tech-blue/20 to-tech-purple/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckSquare className="w-10 h-10 text-tech-blue" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No Tasks Yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    You don't have any tasks assigned at the moment. New tasks will appear here when they're assigned to you.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {tasks.map((task, index) => (
                    <div
                      key={task._id}
                      className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-tech-blue/50 transition-all duration-300 hover:shadow-xl hover:shadow-tech-blue/10"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{task.title}</h3>
                            <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                              {getStatusIcon(task.status)}
                              <span className="capitalize">{task.status.replace('-', ' ')}</span>
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-4 leading-relaxed">{task.description}</p>
                          <div className="flex items-center space-x-6 text-sm text-gray-400">
                            <span className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>Assigned: {new Date(task.assignedDate).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </span>
                            {task.completedAt && (
                              <span className="flex items-center space-x-2 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Completed: {new Date(task.completedAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>From: {task.assignedBy?.name || 'Admin'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Task Files */}
                      {task.files && task.files.length > 0 && (
                        <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                          <p className="text-sm text-gray-400 mb-3 flex items-center space-x-2 font-medium">
                            <FileText className="w-4 h-4 text-tech-blue" />
                            <span>Attached Files ({task.files.length}):</span>
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {task.files.map((file, idx) => (
                              <a
                                key={idx}
                                href={`https://multitech-backend.vercel.app/${file.path}`}
                                download
                                className="flex items-center space-x-3 px-4 py-3 bg-tech-blue/10 border border-tech-blue/30 rounded-lg text-sm text-tech-blue hover:bg-tech-blue/20 transition-all group"
                              >
                                <Download className="w-4 h-4 group-hover:animate-bounce" />
                                <span className="flex-1 truncate">{file.filename}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(file.uploadDate).toLocaleDateString()}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completion Files */}
                      {task.completionFiles && task.completionFiles.length > 0 && (
                        <div className="mb-4 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                          <p className="text-sm text-green-400 mb-3 flex items-center space-x-2 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Your Submission ({task.completionFiles.length} files):</span>
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {task.completionFiles.map((file, idx) => (
                              <a
                                key={idx}
                                href={`https://multitech-backend.vercel.app/${file.path}`}
                                download
                                className="flex items-center space-x-3 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 hover:bg-green-500/30 transition-all group"
                              >
                                <Download className="w-4 h-4 group-hover:animate-bounce" />
                                <span className="flex-1 truncate">{file.filename}</span>
                                <span className="text-xs text-green-500/70">
                                  {new Date(file.uploadDate).toLocaleDateString()}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(task._id, 'in-progress')}
                            className="flex items-center space-x-2 px-4 py-2.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all font-medium"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Start Working</span>
                          </button>
                        )}
                        
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowCompleteModal(true);
                            }}
                            className="flex items-center space-x-2 px-4 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-all font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark as Complete</span>
                          </button>
                        )}

                        {task.status === 'completed' && (
                          <div className="flex items-center space-x-2 px-4 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-medium">Task Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">Messages</h2>
                  <p className="text-gray-400 text-sm">Communication with your admin</p>
                </div>
                <div className="flex items-center space-x-3">
                  {unreadMessages.length > 0 && (
                    <div className="text-sm bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/30">
                      <span className="font-semibold">{unreadMessages.length}</span> unread
                    </div>
                  )}
                  <div className="text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    Total: <span className="text-white font-semibold">{messages.length}</span>
                  </div>
                </div>
              </div>

              {messages.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-16 border border-white/10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-tech-blue/20 to-tech-purple/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-10 h-10 text-tech-blue" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No Messages Yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    You don't have any messages at the moment. New messages will appear here when you receive them.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Message Filter Tabs */}
                  <div className="flex space-x-2 mb-6">
                    <button className="px-4 py-2 bg-tech-blue text-white rounded-lg font-medium">
                      All Messages ({messages.length})
                    </button>
                    <button className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition">
                      Received ({receivedMessages.length})
                    </button>
                    <button className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition">
                      Sent ({sentMessages.length})
                    </button>
                  </div>

                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isReceived = message.receiver._id === user._id;
                      const isUnread = isReceived && !message.read;

                      return (
                        <div
                          key={message._id}
                          className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl ${
                            isUnread
                              ? 'border-tech-blue/50 bg-tech-blue/5 hover:shadow-tech-blue/10'
                              : 'border-white/10 hover:border-tech-blue/30'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Mail className={`w-5 h-5 ${isUnread ? 'text-tech-blue' : 'text-gray-400'}`} />
                                <h3 className="text-lg font-semibold text-white">{message.subject}</h3>
                                {isUnread && (
                                  <span className="px-3 py-1 bg-tech-blue/30 text-tech-blue rounded-full text-xs font-semibold animate-pulse">
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                                <span className="flex items-center space-x-2">
                                  <User className="w-4 h-4" />
                                  <span>
                                    {isReceived ? 'From' : 'To'}: {' '}
                                    <span className="text-white font-medium">
                                      {isReceived ? message.sender.name : message.receiver.name}
                                    </span>
                                  </span>
                                </span>
                                <span className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(message.sentDate).toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>

                          {isReceived && (
                            <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                              <button
                                onClick={() => {
                                  setSelectedTask({ ...message, sender: message.sender });
                                  setReplyMessage({ subject: message.subject, content: '' });
                                  setShowMessageModal(true);
                                  
                                  // Mark as read
                                  if (!message.read) {
                                    handleMarkAsRead(message._id);
                                  }
                                }}
                                className="flex items-center space-x-2 px-4 py-2.5 bg-tech-blue/20 border border-tech-blue/30 text-tech-blue rounded-lg hover:bg-tech-blue/30 transition-all font-medium"
                              >
                                <Send className="w-4 h-4" />
                                <span>Reply</span>
                              </button>
                              {isUnread && (
                                <button
                                  onClick={() => handleMarkAsRead(message._id)}
                                  className="flex items-center space-x-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/10 transition-all"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Mark as Read</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Complete Task Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-tech-dark border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
                <span>Complete Task</span>
              </h3>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedTask(null);
                  setCompletionFiles([]);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedTask && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-white font-semibold mb-2">{selectedTask.title}</h4>
                <p className="text-sm text-gray-400">{selectedTask.description}</p>
              </div>
            )}

            <form onSubmit={handleCompleteTask} className="space-y-5">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Upload Completion Files (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setCompletionFiles(Array.from(e.target.files))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-tech-blue file:to-tech-purple file:text-white file:cursor-pointer file:font-medium hover:file:shadow-lg"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                  <Upload className="w-3 h-3" />
                  <span>You can attach documents, images, PDFs, or any files related to the completed task</span>
                </p>
              </div>

              {completionFiles.length > 0 && (
                <div className="bg-tech-blue/10 border border-tech-blue/30 rounded-xl p-4">
                  <p className="text-sm text-tech-blue font-medium mb-3 flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Selected files ({completionFiles.length}):</span>
                  </p>
                  <ul className="space-y-2">
                    {Array.from(completionFiles).map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between text-sm text-white bg-white/5 px-3 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-tech-blue" />
                          <span className="truncate max-w-xs">{file.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-300 font-medium mb-1">Important Notice</p>
                    <p className="text-xs text-yellow-300/80">
                      Once you mark this task as complete, it will be sent to the admin for review. Make sure you've completed all requirements before submitting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedTask(null);
                    setCompletionFiles([]);
                  }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
                >
                  Mark as Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reply Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-tech-dark border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Send className="w-7 h-7 text-tech-blue" />
                <span>Reply to Message</span>
              </h3>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setReplyMessage({ subject: '', content: '' });
                  setSelectedTask(null);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedTask && (
              <div className="mb-5 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Replying to:</p>
                <p className="text-white font-medium">{selectedTask.sender?.name || 'Admin'}</p>
              </div>
            )}

            <form onSubmit={handleSendReply} className="space-y-5">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={`Re: ${replyMessage.subject}`}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Your Reply</label>
                <textarea
                  value={replyMessage.content}
                  onChange={(e) => setReplyMessage({ ...replyMessage, content: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tech-blue focus:border-transparent transition resize-none"
                  rows="8"
                  placeholder="Type your reply here..."
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  {replyMessage.content.length} characters
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageModal(false);
                    setReplyMessage({ subject: '', content: '' });
                    setSelectedTask(null);
                  }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-tech-blue to-tech-purple text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-tech-blue/30 transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;