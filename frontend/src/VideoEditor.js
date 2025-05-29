import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Youtube, 
  Scissors, 
  Camera, 
  Mic, 
  Globe, 
  Sparkles,
  Download,
  Play,
  Clock,
  Eye,
  Users,
  Zap,
  FileVideo,
  Image,
  Volume2,
  Settings,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { useAppContext } from './Components';
import axios from 'axios';
import toast from 'react-hot-toast';

const VideoEditor = ({ videoData, onBack }) => {
  const { t, API_BASE_URL } = useAppContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [clipCount, setClipCount] = useState(1);
  const [clips, setClips] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [completedClips, setCompletedClips] = useState([]);

  // Initialize clips array when clip count changes
  React.useEffect(() => {
    const newClips = Array.from({ length: clipCount }, (_, i) => ({
      id: i + 1,
      name: `Clip ${i + 1}`,
      startTime: i * 30,
      endTime: (i + 1) * 30,
      selectedFeatures: []
    }));
    setClips(newClips);
  }, [clipCount]);

  const aiFeatures = [
    {
      id: 'auto_clipping',
      name: 'Auto Clipping',
      description: 'AI automatically detects viral-worthy moments',
      icon: Scissors,
      image: 'https://images.pexels.com/photos/7818237/pexels-photo-7818237.jpeg',
      color: 'from-blue-500 to-cyan-500',
      premium: false
    },
    {
      id: 'face_tracking',
      name: 'Auto Face Tracking',
      description: 'Keep faces centered when converting to vertical',
      icon: Camera,
      image: 'https://images.unsplash.com/photo-1511903979581-3f1d3afb4372',
      color: 'from-purple-500 to-pink-500',
      premium: false
    },
    {
      id: 'auto_captions',
      name: 'Auto Captioning',
      description: 'AI listens and automatically adds captions',
      icon: Mic,
      image: 'https://images.pexels.com/photos/11158021/pexels-photo-11158021.jpeg',
      color: 'from-green-500 to-teal-500',
      premium: false
    },
    {
      id: 'translation',
      name: 'Caption Translation',
      description: 'Translate captions into 37+ languages',
      icon: Globe,
      image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
      color: 'from-orange-500 to-red-500',
      premium: false
    },
    {
      id: 'hook_titles',
      name: 'Auto Hook Titles',
      description: 'Generate compelling titles and CTAs',
      icon: Zap,
      image: 'https://images.unsplash.com/photo-1601132359864-c974e79890ac',
      color: 'from-yellow-500 to-orange-500',
      premium: true
    },
    {
      id: 'b_roll',
      name: 'Auto B-roll',
      description: 'Add relevant background footage',
      icon: FileVideo,
      image: 'https://images.pexels.com/photos/7562106/pexels-photo-7562106.jpeg',
      color: 'from-indigo-500 to-purple-500',
      premium: true
    },
    {
      id: 'background_removal',
      name: 'Background Remover',
      description: 'Remove or replace video backgrounds',
      icon: Image,
      image: 'https://images.unsplash.com/photo-1530825894095-9c184b068fcb',
      color: 'from-pink-500 to-rose-500',
      premium: true
    },
    {
      id: 'voice_enhancement',
      name: 'Voice Enhancement',
      description: 'Improve audio quality and add voiceovers',
      icon: Volume2,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
      color: 'from-cyan-500 to-blue-500',
      premium: true
    }
  ];

  const toggleFeature = (clipId, featureId) => {
    setClips(prevClips => 
      prevClips.map(clip => {
        if (clip.id === clipId) {
          const hasFeature = clip.selectedFeatures.includes(featureId);
          return {
            ...clip,
            selectedFeatures: hasFeature 
              ? clip.selectedFeatures.filter(f => f !== featureId)
              : [...clip.selectedFeatures, featureId]
          };
        }
        return clip;
      })
    );
  };

  const updateClipTime = (clipId, field, value) => {
    setClips(prevClips =>
      prevClips.map(clip => {
        if (clip.id === clipId) {
          return { ...clip, [field]: Math.max(0, Math.min(videoData.videoInfo.duration, value)) };
        }
        return clip;
      })
    );
  };

  const generateClips = async () => {
    setProcessing(true);
    setCurrentStep(3);
    const results = [];

    try {
      for (const clip of clips) {
        const clipData = {
          youtube_url: videoData.url,
          start_time: clip.startTime,
          end_time: clip.endTime,
          clip_name: clip.name,
          features: clip.selectedFeatures
        };

        const response = await axios.post(`${API_BASE_URL}/video/clip`, clipData);
        results.push(response.data);
      }

      setCompletedClips(results);
      toast.success(`Successfully created ${results.length} clips!`);
    } catch (error) {
      toast.error('Failed to create clips: ' + (error.response?.data?.detail || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const downloadClip = async (clipId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/video/download/${clipId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clip_${clipId}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started!');
    } catch (error) {
      toast.error('Download failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step, index) => (
        <React.Fragment key={step}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
            currentStep >= step 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {currentStep > step ? <Check className="w-5 h-5" /> : step}
          </div>
          {index < 2 && (
            <div className={`w-20 h-1 mx-2 ${
              currentStep > step + 1 ? 'bg-blue-500' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Configure Your Clips</h2>
        <p className="text-gray-600">How many clips would you like to create from this video?</p>
      </div>

      {/* Video Preview */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-start space-x-6">
          <img
            src={videoData.videoInfo.thumbnail}
            alt={videoData.videoInfo.title}
            className="w-64 h-36 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {videoData.videoInfo.title}
            </h3>
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {Math.floor(videoData.videoInfo.duration / 60)}:{(videoData.videoInfo.duration % 60).toString().padStart(2, '0')}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {videoData.videoInfo.view_count?.toLocaleString()} views
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {videoData.videoInfo.uploader}
              </span>
            </div>
            <p className="text-gray-600 line-clamp-3">{videoData.videoInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Clip Count Selector */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Number of Clips</h3>
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={() => setClipCount(Math.max(1, clipCount - 1))}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              disabled={clipCount <= 1}
            >
              <Minus className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold mb-2">
                {clipCount}
              </div>
              <p className="text-sm text-gray-600">clips</p>
            </div>
            
            <button
              onClick={() => setClipCount(Math.min(3, clipCount + 1))}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              disabled={clipCount >= 3}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-4">Maximum 3 clips at a time</p>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <button
          onClick={() => setCurrentStep(2)}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <span>Configure Features</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Select AI Features</h2>
        <p className="text-gray-600">Choose which AI features to apply to each clip</p>
      </div>

      {/* Clips Configuration */}
      <div className="space-y-8">
        {clips.map((clip, index) => (
          <div key={clip.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Clip {index + 1}</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Start:</span>
                  <input
                    type="number"
                    min="0"
                    max={videoData.videoInfo.duration}
                    value={clip.startTime}
                    onChange={(e) => updateClipTime(clip.id, 'startTime', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">End:</span>
                  <input
                    type="number"
                    min={clip.startTime + 1}
                    max={videoData.videoInfo.duration}
                    value={clip.endTime}
                    onChange={(e) => updateClipTime(clip.id, 'endTime', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">s</span>
                </div>
              </div>
            </div>

            {/* Feature Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiFeatures.map((feature) => {
                const isSelected = clip.selectedFeatures.includes(feature.id);
                const IconComponent = feature.icon;
                
                return (
                  <motion.div
                    key={feature.id}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'ring-4 ring-blue-500 scale-105' 
                        : 'hover:scale-102 hover:shadow-lg'
                    }`}
                    onClick={() => toggleFeature(clip.id, feature.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative h-32">
                      <img
                        src={feature.image}
                        alt={feature.name}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${feature.color} opacity-80`} />
                      
                      {/* Feature Icon */}
                      <div className="absolute top-3 left-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      {/* Premium Badge */}
                      {feature.premium && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            PRO
                          </div>
                        </div>
                      )}

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Feature Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h4 className="text-white font-medium text-sm mb-1">{feature.name}</h4>
                        <p className="text-white/80 text-xs line-clamp-2">{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Features Summary */}
            {clip.selectedFeatures.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  Selected Features ({clip.selectedFeatures.length}):
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {clip.selectedFeatures.map(featureId => {
                    const feature = aiFeatures.find(f => f.id === featureId);
                    return (
                      <span key={featureId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {feature?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <button
          onClick={generateClips}
          className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          <span>Generate Clips</span>
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto text-center"
    >
      {processing ? (
        <div>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Generating Your Clips</h2>
          <p className="text-gray-600">AI is working its magic on your video clips...</p>
        </div>
      ) : (
        <div>
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Clips Generated Successfully!</h2>
          <p className="text-gray-600 mb-8">Your clips are ready for download</p>

          {/* Completed Clips */}
          <div className="space-y-4">
            {completedClips.map((clip, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{clip.clip?.name || `Clip ${index + 1}`}</h3>
                    <p className="text-sm text-gray-600">
                      Duration: {clip.clip?.start_time}s - {clip.clip?.end_time}s
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {clip.clip?.status || 'Completed'}
                    </span>
                    <button
                      onClick={() => downloadClip(clip.clip_id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={() => {
                setCurrentStep(1);
                setCompletedClips([]);
              }}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Create More Clips</span>
            </button>
            
            <button
              onClick={onBack}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderStepIndicator()}
        
        <AnimatePresence mode="wait">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoEditor;
