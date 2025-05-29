import React, { useState, useContext, createContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Upload, 
  Scissors, 
  Wand2, 
  Users, 
  Globe, 
  ChevronDown,
  Star,
  Sparkles,
  Video,
  Mic,
  Image,
  Download,
  Share2,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Eye,
  Clock,
  Zap,
  Brain,
  Camera,
  FileVideo,
  Youtube,
  ArrowRight,
  Check
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// Context for authentication and language
const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Translations
  const translations = {
    en: {
      // Header
      pricing: "Pricing",
      tools: "Tools", 
      help: "Help",
      signIn: "Sign In",
      createAccount: "Create Account",
      
      // Hero
      heroTitle: "Reassemble a long video into",
      heroSubtitle: "Engaging Shorts",
      heroDescription: "Turn your long videos into viral short form clips and get millions of views",
      makeShorts: "Make Shorts",
      
      // Features
      keyFeatures: "Key features for Clippers",
      featuresSubtitle: "Transform your content into viral-ready clips with our AI-powered tools",
      
      autoClipping: "Auto Clipping",
      autoClippingDesc: "AI automatically detects viral-worthy moments in your videos and turns them into perfect clips",
      
      autoFaceTracking: "Auto Face Tracking", 
      autoFaceTrackingDesc: "AI detects faces in your video and keeps them centered as it converts to vertical formats",
      
      autoCaptioning: "Auto Captioning",
      autoCaptioningDesc: "AI listens to your video and automatically adds captions",
      
      captionTranslation: "Caption Translation",
      captionTranslationDesc: "Translate your captions into 37+ languages instantly",
      
      // Auth
      login: "Login",
      register: "Register", 
      email: "Email",
      password: "Password",
      username: "Username",
      confirmPassword: "Confirm Password",
      
      // Dashboard
      dashboard: "Dashboard",
      myClips: "My Clips",
      createNew: "Create New Clip",
      youtubeUrl: "YouTube URL",
      pasteUrl: "Paste YouTube video URL here...",
      getVideoInfo: "Get Video Info",
      
      // Admin
      adminPanel: "Admin Panel",
      userManagement: "User Management",
      totalUsers: "Total Users",
      totalClips: "Total Clips",
      
      // Common
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      loading: "Loading...",
      error: "Error",
      success: "Success",
    },
    sq: {
      // Header  
      pricing: "Çmimi",
      tools: "Mjete",
      help: "Ndihmë", 
      signIn: "Hyr",
      createAccount: "Krijo Llogari",
      
      // Hero
      heroTitle: "Riorganizo një video të gjatë në",
      heroSubtitle: "Klipe Tërheqëse",
      heroDescription: "Ktheni videot tuaja të gjata në klipe të shkurtra virale dhe merrni miliona shikime",
      makeShorts: "Bëj Klipe",
      
      // Features
      keyFeatures: "Karakteristika kryesore për Kliper",
      featuresSubtitle: "Transformoni përmbajtjen tuaj në klipe gati për viralitet me mjetet tona të fuqizuara nga AI",
      
      autoClipping: "Klipim Automatik",
      autoClippingDesc: "AI zbuloi automatikisht momentet e vlefshme virale në videot tuaja dhe i kthen ato në klipe të përsosura",
      
      autoFaceTracking: "Gjurmim Automatik i Fytyrës",
      autoFaceTrackingDesc: "AI zbuloi fytyrat në videon tuaj dhe i mban ato të centruara ndërsa konverton në formate vertikale",
      
      autoCaptioning: "Titrim Automatik", 
      autoCaptioningDesc: "AI dëgjon videon tuaj dhe shton automatikisht titrat",
      
      captionTranslation: "Përkthim Titrash",
      captionTranslationDesc: "Përktheni titrat tuaja në 37+ gjuhë menjëherë",
      
      // Auth
      login: "Hyrje",
      register: "Regjistrohu",
      email: "Email-i",
      password: "Fjalëkalimi", 
      username: "Emri i përdoruesit",
      confirmPassword: "Konfirmo Fjalëkalimin",
      
      // Dashboard
      dashboard: "Paneli",
      myClips: "Klipet e Mia",
      createNew: "Krijo Klip të Ri",
      youtubeUrl: "YouTube URL",
      pasteUrl: "Ngjit URL-në e videos së YouTube këtu...",
      getVideoInfo: "Merr Informacion Video",
      
      // Admin
      adminPanel: "Paneli i Administratorit",
      userManagement: "Menaxhimi i Përdoruesve",
      totalUsers: "Përdorues Gjithsej",
      totalClips: "Klipe Gjithsej",
      
      // Common
      cancel: "Anulo",
      save: "Ruaj", 
      delete: "Fshi",
      edit: "Ndrysho",
      loading: "Duke u ngarkuar...",
      error: "Gabim",
      success: "Sukses",
    }
  };

  const t = (key) => translations[language][key] || key;

  // Auth functions
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { access_token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(userData);
      setShowAuthModal(false);
      toast.success('Successfully logged in!');
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        username,
        email,
        password,
        language_preference: language
      });
      
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(userData);
      setShowAuthModal(false);
      toast.success('Account created successfully!');
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully!');
  };

  // Initialize user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const value = {
    user,
    setUser,
    language,
    setLanguage,
    loading,
    setLoading,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    login,
    register,
    logout,
    t,
    API_BASE_URL
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <Toaster position="top-right" />
    </AppContext.Provider>
  );
};

// Header Component
export const Header = () => {
  const { user, language, setLanguage, t, setShowAuthModal, setAuthMode, logout } = useAppContext();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navItems = [
    { key: 'pricing', label: t('pricing') },
    { key: 'tools', label: t('tools') },
    { key: 'help', label: t('help') }
  ];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Pjesëza</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={`#${item.key}`}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <div className="relative">
              <button
                onClick={() => setLanguage(language === 'en' ? 'sq' : 'en')}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{language.toUpperCase()}</span>
              </button>
            </div>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="hidden md:block text-sm font-medium">{user.username}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <a href="#dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="w-4 h-4 mr-2" />
                      {t('dashboard')}
                    </a>
                    {user.role === 'admin' && (
                      <a href="#admin" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings className="w-4 h-4 mr-2" />
                        {t('adminPanel')}
                      </a>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {t('signIn')}
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {t('createAccount')}
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={`#${item.key}`}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

// Hero Section Component
export const HeroSection = () => {
  const { t, user, setShowAuthModal, setAuthMode } = useAppContext();

  const testimonials = [
    { name: "Alex M.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face", rating: 5 },
    { name: "Sarah K.", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1e0?w=50&h=50&fit=crop&crop=face", rating: 5 },
    { name: "Mike R.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face", rating: 5 },
    { name: "Lisa T.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face", rating: 5 }
  ];

  const handleGetStarted = () => {
    if (user) {
      // Scroll to dashboard or features section
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setAuthMode('register');
      setShowAuthModal(true);
    }
  };

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
            {t('heroTitle')}<br />
            <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              {t('heroSubtitle')}
            </span>
          </h1>
          
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            {t('heroDescription')}
          </p>

          {/* User Testimonials */}
          <div className="flex items-center justify-center mt-8 space-x-2">
            <div className="flex -space-x-2">
              {testimonials.map((testimonial, index) => (
                <img
                  key={index}
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
              ))}
            </div>
            <div className="flex ml-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">Loved by 10,000+ creators</span>
          </div>

          <motion.button
            onClick={handleGetStarted}
            className="mt-10 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center space-x-2 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{t('makeShorts')}</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

// Features Section Component
export const FeaturesSection = () => {
  const { t } = useAppContext();

  const features = [
    {
      title: t('autoClipping'),
      description: t('autoClippingDesc'),
      icon: Scissors,
      image: 'https://images.pexels.com/photos/7818237/pexels-photo-7818237.jpeg',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: t('autoFaceTracking'),
      description: t('autoFaceTrackingDesc'),
      icon: Camera,
      image: 'https://images.unsplash.com/photo-1511903979581-3f1d3afb4372',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: t('autoCaptioning'),
      description: t('autoCaptioningDesc'),
      icon: Mic,
      image: 'https://images.pexels.com/photos/11158021/pexels-photo-11158021.jpeg',
      gradient: 'from-green-500 to-teal-500'
    },
    {
      title: t('captionTranslation'),
      description: t('captionTranslationDesc'),
      icon: Globe,
      image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section id="features" className="bg-gray-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('keyFeatures')}
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            {t('featuresSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
              
              <div className="flex-1">
                <div className="relative group">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-64 object-cover rounded-xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-white text-sm font-medium">AI Processing</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// AI Tools Section
export const AIToolsSection = () => {
  const { t } = useAppContext();

  const tools = [
    {
      title: "Auto Hook Generator",
      description: "Generate compelling hooks that grab attention in the first 3 seconds",
      icon: Zap,
      color: "text-yellow-500"
    },
    {
      title: "Smart B-Roll Integration", 
      description: "Automatically add relevant B-roll footage to enhance your storytelling",
      icon: FileVideo,
      color: "text-blue-500"
    },
    {
      title: "Voice Creator",
      description: "Convert text to natural-sounding voiceovers with AI voices",
      icon: Mic,
      color: "text-green-500"
    },
    {
      title: "Background Remover",
      description: "Remove or replace video backgrounds with AI precision",
      icon: Image,
      color: "text-purple-500"
    },
    {
      title: "YouTube Analytics",
      description: "Analyze top-performing creators and optimize your content strategy", 
      icon: Brain,
      color: "text-red-500"
    },
    {
      title: "Auto Scheduler",
      description: "Schedule posts across TikTok, YouTube, and Instagram automatically",
      icon: Clock,
      color: "text-cyan-500"
    }
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Tools & Integrations
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete ecosystem of AI tools to streamline your content creation workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <motion.div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <tool.icon className={`w-8 h-8 ${tool.color}`} />
                <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
              </div>
              <p className="text-gray-600">{tool.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// YouTube Integration Section
export const YouTubeSection = ({ onCreateClip }) => {
  const { t, user, setShowAuthModal, setAuthMode } = useAppContext();
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetVideoInfo = async () => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    if (!url) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/video/info`, {
        url: url
      });

      setVideoInfo(response.data.video_info);
      toast.success('Video information retrieved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to get video info');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClip = () => {
    if (onCreateClip && videoInfo) {
      onCreateClip({ url, videoInfo });
    }
  };

  return (
    <section className="bg-gradient-to-br from-red-50 to-pink-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Youtube className="w-12 h-12 text-red-500" />
            <h2 className="text-4xl font-bold text-gray-900">YouTube Integration</h2>
          </div>
          
          <p className="text-xl text-gray-600 mb-8">
            Paste any YouTube video URL and let our AI create viral clips automatically
          </p>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('pasteUrl')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleGetVideoInfo}
                disabled={loading}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? t('loading') : t('getVideoInfo')}
              </button>
            </div>

            {videoInfo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-50 rounded-lg p-6 text-left"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-32 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{videoInfo.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {videoInfo.view_count?.toLocaleString()} views
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2 line-clamp-2">{videoInfo.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleCreateClip}
                  className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Scissors className="w-5 h-5" />
                  <span>Create AI Clips</span>
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Pricing Section
export const PricingSection = () => {
  const { t } = useAppContext();

  const plans = [
    {
      name: "Free",
      price: "0",
      description: "Perfect for getting started",
      features: [
        "5 clips per month",
        "720p export quality", 
        "Basic AI features",
        "Community support"
      ],
      buttonText: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "19",
      description: "For serious content creators",
      features: [
        "Unlimited clips",
        "4K export quality",
        "All AI features",
        "Priority support",
        "Custom branding",
        "Team collaboration"
      ],
      buttonText: "Start Pro Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "99",
      description: "For teams and agencies",
      features: [
        "Everything in Pro",
        "White-label solution",
        "API access",
        "Dedicated support",
        "Custom integrations",
        "Analytics dashboard"
      ],
      buttonText: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your content creation needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-8 relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  ${plan.price}
                  <span className="text-lg text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 rounded-lg font-medium transition-colors ${
                plan.popular 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}>
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
