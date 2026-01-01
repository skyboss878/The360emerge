import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';
import toast from 'react-hot-toast';
import Camera360Capture from '../components/Camera360Capture';

const Record360Tour = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [recordedRooms, setRecordedRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('');

  const rooms = [
    { id: 'entrance', name: 'Entrance/Foyer', icon: '🚪' },
    { id: 'living_room', name: 'Living Room', icon: '🛋️' },
    { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
    { id: 'dining_room', name: 'Dining Room', icon: '🍽️' },
    { id: 'master_bedroom', name: 'Master Bedroom', icon: '🛏️' },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿' },
    { id: 'backyard', name: 'Backyard/Outdoor', icon: '🌳' },
    { id: 'garage', name: 'Garage', icon: '🚗' }
  ];

  useEffect(() => {
    fetchListing();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${listingId}`);
      setListing(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load listing');
      navigate('/dashboard');
    }
  };

  const handleStartRecording = (room) => {
    setCurrentRoom(room.name);
    setShowCamera(true);
  };

  const handleCaptureComplete = async (file) => {
    try {
      // Add room to recorded list
      const newRecordedRooms = [...recordedRooms, { room: currentRoom, file }];
      setRecordedRooms(newRecordedRooms);
      setShowCamera(false);
      
      toast.success(`${currentRoom} captured successfully!`);
      
    } catch (error) {
      toast.error('Failed to save room capture');
    }
  };

  const handleCompleteTour = async () => {
    if (recordedRooms.length === 0) {
      toast.error('Please record at least one room');
      return;
    }

    try {
      toast.loading('Processing your 360° tour...', { id: 'processing' });

      // Send to backend for processing
      const response = await api.post(`/360tour/process/${listingId}`, {
        rooms_count: recordedRooms.length,
        enable_narration: true,
        property_type: listing?.property_type || 'single_family'
      });

      if (response.data.success) {
        toast.success('✅ 360° Tour created successfully!', { id: 'processing' });
        navigate(`/listing/${listingId}`);
      }
    } catch (error) {
      toast.error('Failed to process tour', { id: 'processing' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-xl">Loading listing...</p>
        </div>
      </div>
    );
  }

  // Show Camera360Capture component when recording
  if (showCamera) {
    return (
      <Camera360Capture
        onCapture={handleCaptureComplete}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  // Main UI - Room selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(`/listing/${listingId}`)}
            className="text-white hover:text-purple-300 transition-colors"
          >
            ← Back
          </button>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold">🎥 Record 360° Tour</h1>
            <p className="text-purple-200 text-sm">{listing?.address}</p>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{recordedRooms.length} / {rooms.length} rooms</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${(recordedRooms.length / rooms.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {rooms.map((room) => {
              const isRecorded = recordedRooms.some(r => r.room === room.name);
              
              return (
                <button
                  key={room.id}
                  onClick={() => handleStartRecording(room)}
                  className={`p-6 rounded-xl transition-all ${
                    isRecorded
                      ? 'bg-green-600/50 border-2 border-green-400'
                      : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="text-4xl mb-2">{room.icon}</div>
                  <div className="text-sm font-medium">{room.name}</div>
                  {isRecorded && (
                    <div className="mt-2 text-green-300 text-xs">✓ Recorded</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Complete Button */}
          <button
            onClick={handleCompleteTour}
            disabled={recordedRooms.length === 0}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recordedRooms.length === 0
              ? 'Record at least one room to continue'
              : `✅ Complete Tour (${recordedRooms.length} rooms recorded)`}
          </button>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-purple-600/20 rounded-lg border border-purple-400/30">
            <p className="text-sm text-purple-100">
              <strong>💡 Tips:</strong>
              <br />• Tap a room to start recording with professional camera
              <br />• Hold phone steady in landscape mode
              <br />• Rotate 360° slowly for best results
              <br />• Record at least 3-4 rooms for a complete tour
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Record360Tour;
