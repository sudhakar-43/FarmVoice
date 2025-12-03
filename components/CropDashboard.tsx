"use client";

import { useState, useEffect } from "react";
import { FaArrowLeft, FaLeaf, FaMapMarkerAlt, FaTemperatureHigh, FaTint, FaCloudRain, FaCalendarAlt, FaBug, FaChartLine, FaCheckCircle, FaExclamationTriangle, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CropDashboardProps {
  crop: any;
  onBack: () => void;
}

export default function CropDashboard({ crop, onBack }: CropDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "health" | "tasks" | "market">("overview");
  const [cropHealth, setCropHealth] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");

  const [healthData, setHealthData] = useState<any[]>([]);
  const [yieldData, setYieldData] = useState<any[]>([]);
  const [diseaseRiskData, setDiseaseRiskData] = useState<any[]>([]);

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: tasks.length + 1,
        title: newTask,
        completed: false,
        dueDate: "Tomorrow",
        priority: "medium"
      }]);
      setNewTask("");
    }
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-blue-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
                <FaLeaf className="text-white text-3xl" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{crop.original_name || crop.name}</h1>
                <p className="text-gray-600 mt-1">Crop Management Dashboard</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-emerald-600">{cropHealth}%</div>
              <p className="text-gray-600">Overall Health</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Suitability Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{crop.suitability_score || 75}%</p>
              </div>
              <div className="bg-emerald-100 p-4 rounded-lg">
                <FaCheckCircle className="text-emerald-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Days to Harvest</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">120</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <FaCalendarAlt className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Disease Risk</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">Low</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <FaBug className="text-green-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Est. Yield</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">45 tons</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg">
                <FaChartLine className="text-yellow-600 text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200 px-6">
            <div className="flex space-x-1 overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: FaLeaf },
                { id: "health", label: "Crop Health", icon: FaCheckCircle },
                { id: "tasks", label: "Daily Tasks", icon: FaCalendarAlt },
                { id: "market", label: "Market Info", icon: FaChartLine },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-6 py-4 border-b-3 font-semibold transition-all ${
                      activeTab === tab.id
                        ? "border-emerald-600 text-emerald-600 bg-emerald-50"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Location & Weather */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <FaMapMarkerAlt className="text-emerald-600" />
                      <span>Location Info</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-semibold text-gray-900">Hyderabad, Telangana</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pincode:</span>
                        <span className="font-semibold text-gray-900">522403</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Soil Type:</span>
                        <span className="font-semibold text-gray-900">Black Soil</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Climate:</span>
                        <span className="font-semibold text-gray-900">Tropical</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Current Weather</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FaTemperatureHigh className="text-red-600" />
                          <span className="text-sm text-gray-600">Temperature</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">24.1°C</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FaTint className="text-blue-600" />
                          <span className="text-sm text-gray-600">Humidity</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">78%</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FaCloudRain className="text-blue-500" />
                          <span className="text-sm text-gray-600">Rainfall</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">0mm</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FaCalendarAlt className="text-yellow-600" />
                          <span className="text-sm text-gray-600">Season</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">Kharif</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Crop Details */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Crop Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700">{crop.description || "High-value vegetable crop with good market demand. Requires careful pest and disease management."}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Key Benefits</h4>
                      <ul className="space-y-2">
                        {(crop.benefits || ["High market value", "Multiple harvests", "Good profit margin"]).map((benefit: string, i: number) => (
                          <li key={i} className="flex items-center space-x-2 text-gray-700">
                            <FaCheckCircle className="text-emerald-600 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "health" && (
              <div className="space-y-8">
                {/* Health Trend */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Crop Health Trend (7 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={healthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="health" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Disease Risk */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Disease Risk Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={diseaseRiskData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                          {diseaseRiskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Common Diseases</h3>
                    <div className="space-y-4">
                      {[
                        { name: "Early Blight", risk: "Low", color: "green" },
                        { name: "Late Blight", risk: "Medium", color: "yellow" },
                        { name: "Fusarium Wilt", risk: "Low", color: "green" },
                      ].map((disease, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="font-medium text-gray-900">{disease.name}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${disease.color}-100 text-${disease.color}-700`}>
                            {disease.risk} Risk
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-6">
                {/* Add Task */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTask()}
                    placeholder="Add a new task..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={addTask}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <FaPlus />
                    <span>Add</span>
                  </button>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4 flex-1">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${task.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                            {task.title}
                          </p>
                          <p className="text-sm text-gray-500">{task.dueDate}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          task.priority === "high" ? "bg-red-100 text-red-700" :
                          task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors ml-4"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "market" && (
              <div className="space-y-8">
                {/* Yield Forecast */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Yield Forecast (Monthly)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={yieldData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="yield" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Market Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Current Price</h4>
                    <p className="text-3xl font-bold text-green-600">₹45/kg</p>
                    <p className="text-sm text-gray-600 mt-2">Market rate today</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Avg. Price (30 days)</h4>
                    <p className="text-3xl font-bold text-blue-600">₹42/kg</p>
                    <p className="text-sm text-gray-600 mt-2">Average market rate</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Est. Revenue</h4>
                    <p className="text-3xl font-bold text-purple-600">₹2.02L</p>
                    <p className="text-sm text-gray-600 mt-2">For 45 tons yield</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
