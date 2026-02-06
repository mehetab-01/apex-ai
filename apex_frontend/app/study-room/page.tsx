"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Hash,
  Lock,
  Globe,
  Clock,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Send,
  LogOut,
  Copy,
  Check,
  MessageCircle,
  Timer,
  UserPlus,
  Crown,
  Mic,
  MicOff,
  Video,
  VideoOff,
  X,
  ArrowLeft,
  Sparkles,
  Zap,
  Target,
  Coffee,
  ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ============================================
// Types
// ============================================
interface Participant {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  display_picture: string | null;
  is_active: boolean;
  is_muted: boolean;
  is_camera_on: boolean;
  focus_time_minutes: number;
  focus_points_earned: number;
  joined_at: string;
}

interface RoomMessage {
  id: string;
  sender_id: string | null;
  sender_name: string;
  content: string;
  message_type: "text" | "system" | "emoji";
  created_at: string;
}

interface StudyRoom {
  id: string;
  name: string;
  description: string;
  room_code: string;
  is_private: boolean;
  max_participants: number;
  participant_count: number;
  category: string;
  category_display: string;
  host_id?: string;
  host_name: string;
  status: string;
  status_display: string;
  pomodoro_work_minutes: number;
  pomodoro_break_minutes: number;
  pomodoro_rounds: number;
  timer_running: boolean;
  timer_started_at: string | null;
  current_round: number;
  is_break: boolean;
  participants?: Participant[];
  recent_messages?: RoomMessage[];
  created_at: string;
}

interface RoomCategory {
  value: string;
  label: string;
}

// ============================================
// Category Icons / Colors
// ============================================
const categoryColors: Record<string, string> = {
  general: "from-gray-500 to-gray-600",
  web_development: "from-blue-500 to-cyan-500",
  mobile_development: "from-green-500 to-emerald-500",
  data_science: "from-purple-500 to-violet-500",
  machine_learning: "from-pink-500 to-rose-500",
  artificial_intelligence: "from-red-500 to-orange-500",
  cloud_computing: "from-sky-500 to-blue-500",
  cybersecurity: "from-red-600 to-red-500",
  devops: "from-orange-500 to-yellow-500",
  blockchain: "from-indigo-500 to-purple-500",
  programming_languages: "from-teal-500 to-cyan-500",
  database: "from-amber-500 to-yellow-500",
  dsa: "from-emerald-500 to-green-500",
  interview_prep: "from-violet-500 to-purple-500",
  competitive_programming: "from-cyan-500 to-blue-500",
  other: "from-gray-500 to-gray-600",
};

export default function StudyRoomPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // ===== State =====
  const [view, setView] = useState<"lobby" | "room">("lobby");
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<StudyRoom | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showMyRooms, setShowMyRooms] = useState(false);

  // Create room modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    is_private: false,
    max_participants: 6,
    category: "general",
    pomodoro_work_minutes: 25,
    pomodoro_break_minutes: 5,
    pomodoro_rounds: 4,
  });

  // Join by code
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Room view state
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Media toggle state
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Speech detection state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const speechFrameRef = useRef<number | null>(null);

  // Camera stream state
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ===== Auth redirect =====
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      sessionStorage.setItem("redirectAfterLogin", "/study-room");
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // ===== Load categories and rooms =====
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchRooms();
    }
  }, [isAuthenticated, selectedCategory, showMyRooms]);

  // ===== Poll room data when in a room =====
  useEffect(() => {
    if (view === "room" && currentRoom) {
      pollIntervalRef.current = setInterval(() => {
        refreshRoomData(currentRoom.id);
      }, 3000);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [view, currentRoom?.id]);

  // ===== Timer countdown =====
  useEffect(() => {
    if (currentRoom?.timer_running && currentRoom.timer_started_at) {
      const totalSeconds = currentRoom.is_break
        ? currentRoom.pomodoro_break_minutes * 60
        : currentRoom.pomodoro_work_minutes * 60;

      const updateTimer = () => {
        const started = new Date(currentRoom.timer_started_at!).getTime();
        const elapsed = Math.floor((Date.now() - started) / 1000);
        const remaining = Math.max(0, totalSeconds - elapsed);
        setTimerSeconds(remaining);

        if (remaining <= 0) {
          // Timer completed
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    } else {
      const totalSeconds = currentRoom
        ? currentRoom.is_break
          ? currentRoom.pomodoro_break_minutes * 60
          : currentRoom.pomodoro_work_minutes * 60
        : 0;
      setTimerSeconds(totalSeconds);
    }
  }, [currentRoom?.timer_running, currentRoom?.timer_started_at, currentRoom?.is_break]);

  // ===== Speech detection via Web Audio API =====
  useEffect(() => {
    let cancelled = false;

    const startSpeechDetection = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        micStreamRef.current = stream;
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const THRESHOLD = 25; // volume threshold to count as "speaking"

        const detect = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(dataArray);
          // Average volume across frequency bins
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setIsSpeaking(avg > THRESHOLD);
          speechFrameRef.current = requestAnimationFrame(detect);
        };
        detect();
      } catch (err) {
        console.warn("Mic access denied or unavailable:", err);
      }
    };

    const stopSpeechDetection = () => {
      if (speechFrameRef.current) cancelAnimationFrame(speechFrameRef.current);
      speechFrameRef.current = null;
      if (analyserRef.current) { analyserRef.current.disconnect(); analyserRef.current = null; }
      if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
      if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
      setIsSpeaking(false);
    };

    if (view === "room" && !isMuted) {
      startSpeechDetection();
    } else {
      stopSpeechDetection();
    }

    return () => {
      cancelled = true;
      stopSpeechDetection();
    };
  }, [view, isMuted]);

  // ===== Camera stream management =====
  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        cameraStreamRef.current = stream;
        // Attach to video element if it exists
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable:", err);
      }
    };

    const stopCamera = () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };

    if (view === "room" && isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [view, isCameraOn]);

  // ===== Auto-scroll chat =====
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // ===== API Functions =====
  const fetchCategories = async () => {
    try {
      const res = await api.get("/rooms/categories/");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCategory !== "all") params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      if (showMyRooms) params.mine = "true";

      const res = await api.get("/rooms/", { params });
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    try {
      const res = await api.post("/rooms/", createForm);
      if (res.data.status === "success") {
        setCurrentRoom(res.data.room);
        setMessages(res.data.room.recent_messages || []);
        setIsHost(true);
        setView("room");
        setShowCreateModal(false);
        setCreateForm({
          name: "",
          description: "",
          is_private: false,
          max_participants: 6,
          category: "general",
          pomodoro_work_minutes: 25,
          pomodoro_break_minutes: 5,
          pomodoro_rounds: 4,
        });
      }
    } catch (err: any) {
      console.error("Create room error:", err);
      alert(err?.response?.data?.message || "Failed to create room");
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const res = await api.post(`/rooms/${roomId}/join/`);
      if (res.data.status === "success") {
        setCurrentRoom(res.data.room);
        setMessages(res.data.room.recent_messages || []);
        setIsHost(res.data.room.host_id === user?.id);
        setView("room");
      }
    } catch (err: any) {
      console.error("Join room error:", err);
      alert(err?.response?.data?.message || "Failed to join room");
    }
  };

  const joinByCode = async () => {
    try {
      const res = await api.post("/rooms/join-by-code/", {
        room_code: joinCode.toUpperCase(),
      });
      if (res.data.status === "success") {
        setCurrentRoom(res.data.room);
        setMessages(res.data.room.recent_messages || []);
        setIsHost(res.data.room.host_id === user?.id);
        setView("room");
        setShowJoinModal(false);
        setJoinCode("");
      }
    } catch (err: any) {
      console.error("Join by code error:", err);
      alert(err?.response?.data?.message || "Invalid room code");
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom) return;
    try {
      await api.post(`/rooms/${currentRoom.id}/leave/`);
      setCurrentRoom(null);
      setMessages([]);
      setView("lobby");
      fetchRooms();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    } catch (err) {
      console.error("Leave room error:", err);
    }
  };

  const endRoom = async () => {
    if (!currentRoom) return;
    if (!confirm("Are you sure you want to end this room for everyone?")) return;
    try {
      await api.delete(`/rooms/${currentRoom.id}/`);
      setCurrentRoom(null);
      setMessages([]);
      setView("lobby");
      fetchRooms();
    } catch (err) {
      console.error("End room error:", err);
    }
  };

  const sendMessage = async () => {
    if (!currentRoom || !newMessage.trim()) return;
    try {
      const res = await api.post(`/rooms/${currentRoom.id}/messages/`, {
        content: newMessage.trim(),
      });
      if (res.data.status === "success") {
        setMessages((prev) => [...prev, res.data.message]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const controlTimer = async (action: string) => {
    if (!currentRoom) return;
    try {
      const res = await api.post(`/rooms/${currentRoom.id}/timer/`, { action });
      if (res.data.status === "success") {
        setCurrentRoom((prev) =>
          prev
            ? {
                ...prev,
                timer_running: res.data.timer_running,
                timer_started_at: res.data.timer_started_at,
                current_round: res.data.current_round,
                is_break: res.data.is_break,
              }
            : null
        );
      }
    } catch (err) {
      console.error("Timer control error:", err);
    }
  };

  const refreshRoomData = async (roomId: string) => {
    try {
      const [roomRes, msgRes] = await Promise.all([
        api.get(`/rooms/${roomId}/`),
        api.get(`/rooms/${roomId}/messages/?limit=50`),
      ]);

      if (roomRes.data.status === "success") {
        setCurrentRoom(roomRes.data.room);
        setIsHost(roomRes.data.is_host);

        // If room ended, go back to lobby
        if (roomRes.data.room.status === "ended") {
          setView("lobby");
          setCurrentRoom(null);
          fetchRooms();
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return;
        }
      }

      if (msgRes.data.status === "success") {
        setMessages(msgRes.data.messages || []);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  const copyRoomCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleMute = async () => {
    if (!currentRoom) return;
    try {
      const res = await api.post(`/rooms/${currentRoom.id}/toggle-status/`, { field: 'mute' });
      if (res.data.status === 'success') {
        setIsMuted(res.data.is_muted);
      }
    } catch (err) {
      console.error('Toggle mute error:', err);
    }
  };

  const toggleCamera = async () => {
    if (!currentRoom) return;
    try {
      const res = await api.post(`/rooms/${currentRoom.id}/toggle-status/`, { field: 'camera' });
      if (res.data.status === 'success') {
        setIsCameraOn(res.data.is_camera_on);
      }
    } catch (err) {
      console.error('Toggle camera error:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-apex-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ============================================
  // ROOM VIEW
  // ============================================
  if (view === "room" && currentRoom) {
    return (
      <div className="min-h-screen bg-apex-dark flex flex-col">
        {/* Room Header */}
        <div className="bg-apex-darker border-b border-white/5 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={leaveRoom}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white">{currentRoom.name}</h1>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      currentRoom.status === "active"
                        ? "bg-neon-green/20 text-neon-green"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {currentRoom.status_display}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {currentRoom.category_display} • {currentRoom.participant_count}/{currentRoom.max_participants} participants
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Room Code */}
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-neon-cyan/30 transition-colors text-sm"
              >
                <Hash className="w-3.5 h-3.5 text-neon-cyan" />
                <span className="font-mono text-white">{currentRoom.room_code}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-neon-green" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>

              {/* Mic Toggle */}
              <button
                onClick={toggleMute}
                className={`p-2 rounded-lg transition-colors ${
                  isMuted
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera Toggle */}
              <button
                onClick={toggleCamera}
                className={`p-2 rounded-lg transition-colors ${
                  !isCameraOn
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
                title={isCameraOn ? "Turn off camera" : "Turn on camera"}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Toggle Chat */}
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-lg transition-colors ${
                  showChat ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* End Room (Host) */}
              {isHost && (
                <button
                  onClick={endRoom}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm transition-colors"
                >
                  End Room
                </button>
              )}

              {/* Leave */}
              <button
                onClick={leaveRoom}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Room Content */}
        <div className="flex-1 flex max-w-7xl mx-auto w-full">
          {/* Main Area - Timer & Participants */}
          <div className={`flex-1 flex flex-col p-6 ${showChat ? "border-r border-white/5" : ""}`}>
            {/* Pomodoro Timer */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                {/* Timer Circle */}
                <div className="w-56 h-56 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                  {/* Progress ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 224 224">
                    <circle
                      cx="112"
                      cy="112"
                      r="106"
                      fill="none"
                      strokeWidth="4"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <circle
                      cx="112"
                      cy="112"
                      r="106"
                      fill="none"
                      strokeWidth="4"
                      stroke={currentRoom.is_break ? "#00ff88" : "#00f5ff"}
                      strokeDasharray={`${2 * Math.PI * 106}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 106 *
                        (1 -
                          timerSeconds /
                            ((currentRoom.is_break
                              ? currentRoom.pomodoro_break_minutes
                              : currentRoom.pomodoro_work_minutes) *
                              60))
                      }`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>

                  <div className="text-center z-10">
                    <p className="text-5xl font-mono font-bold text-white">
                      {formatTime(timerSeconds)}
                    </p>
                    <p className={`text-sm mt-1 ${currentRoom.is_break ? "text-neon-green" : "text-neon-cyan"}`}>
                      {currentRoom.is_break ? (
                        <span className="flex items-center gap-1 justify-center">
                          <Coffee className="w-3.5 h-3.5" /> Break Time
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 justify-center">
                          <Target className="w-3.5 h-3.5" /> Focus Time
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Round {currentRoom.current_round} / {currentRoom.pomodoro_rounds}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timer Controls (Host only) */}
              {isHost && (
                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => controlTimer("reset")}
                    className="p-2.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Reset"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => controlTimer("toggle")}
                    className={`p-4 rounded-full transition-all ${
                      currentRoom.timer_running
                        ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                        : "bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
                    }`}
                    title={currentRoom.timer_running ? "Pause" : "Start"}
                  >
                    {currentRoom.timer_running ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => controlTimer("next_round")}
                    className="p-2.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Next Round"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              )}

              {!isHost && (
                <p className="text-xs text-gray-500 mt-4">
                  Only the host can control the timer
                </p>
              )}
            </div>

            {/* Participants Grid */}
            <div className="mt-auto">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Participants ({currentRoom.participants?.length || 0})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {currentRoom.participants?.map((p) => {
                  const isMe = p.user_id === user?.id;
                  const showVideo = isMe && isCameraOn;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`rounded-xl border text-center relative overflow-hidden ${
                        isMe && isSpeaking && !isMuted
                          ? "border-neon-green shadow-[0_0_12px_rgba(0,255,136,0.4)]"
                          : "border-white/5"
                      } ${showVideo ? "bg-black" : "bg-apex-card p-4"}`}
                    >
                      {/* Live video mode — full card becomes the feed */}
                      {showVideo ? (
                        <>
                          <div className="aspect-[4/3] w-full relative">
                            <video
                              ref={(el) => {
                                localVideoRef.current = el;
                                if (el && cameraStreamRef.current) {
                                  el.srcObject = cameraStreamRef.current;
                                }
                              }}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover scale-x-[-1]"
                            />
                            {/* Host crown overlay */}
                            {p.user_id === currentRoom.host_id && (
                              <Crown className="w-4 h-4 text-yellow-400 absolute top-2 right-2 drop-shadow-lg" />
                            )}
                          </div>
                          {/* Name & status bar at bottom */}
                          <div className="bg-apex-darker/90 px-3 py-2 flex items-center justify-between">
                            <p className="text-xs font-medium text-white truncate">{p.user_name}</p>
                            <div className="flex items-center gap-1.5">
                              {p.is_muted ? (
                                <MicOff className="w-3 h-3 text-red-400" />
                              ) : (
                                <Mic className="w-3 h-3 text-neon-green" />
                              )}
                              <Video className="w-3 h-3 text-neon-green" />
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Normal card — avatar + info */
                        <>
                          {p.user_id === currentRoom.host_id && (
                            <Crown className="w-4 h-4 text-yellow-400 absolute top-2 right-2" />
                          )}
                          <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                              {p.display_picture ? (
                                <img
                                  src={p.display_picture}
                                  alt={p.user_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-bold text-black">
                                  {p.user_name?.charAt(0) || "?"}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white truncate">
                            {p.user_name}
                          </p>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-neon-cyan" />
                              {p.focus_points_earned}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1.5 mt-1.5">
                            {p.is_muted ? (
                              <MicOff className="w-3 h-3 text-red-400" />
                            ) : (
                              <Mic className="w-3 h-3 text-neon-green" />
                            )}
                            {p.is_camera_on ? (
                              <Video className="w-3 h-3 text-neon-green" />
                            ) : (
                              <VideoOff className="w-3 h-3 text-red-400" />
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col bg-apex-darker overflow-hidden"
              >
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-neon-cyan" />
                    Room Chat
                  </h3>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1 rounded hover:bg-white/5 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id}>
                      {msg.message_type === "system" ? (
                        <div className="text-center">
                          <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                            {msg.content}
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`flex flex-col ${
                            msg.sender_id === user?.id ? "items-end" : "items-start"
                          }`}
                        >
                          <span className="text-xs text-gray-500 mb-1">
                            {msg.sender_name}
                          </span>
                          <div
                            className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                              msg.sender_id === user?.id
                                ? "bg-neon-cyan/20 text-white rounded-br-md"
                                : "bg-white/5 text-gray-300 rounded-bl-md"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-gray-600 mt-0.5">
                            {formatTimeAgo(msg.created_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2.5 rounded-xl bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ============================================
  // LOBBY VIEW
  // ============================================
  return (
    <div className="min-h-screen bg-apex-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 border border-white/10">
                  <Users className="w-7 h-7 text-neon-cyan" />
                </div>
                Study Rooms
              </h1>
              <p className="text-gray-400 mt-2">
                Study together with peers in virtual rooms. Share timers, chat, and stay focused!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:border-neon-cyan/30 transition-all flex items-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Join by Code
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-neon-cyan text-black font-medium hover:shadow-lg hover:shadow-neon-cyan/25 transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Room
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRooms()}
              placeholder="Search rooms..."
              className="w-full bg-apex-card border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-[#111118] border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/50 cursor-pointer"
            >
              <option value="all" className="bg-[#111118] text-white">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-[#111118] text-white">
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* My Rooms Toggle */}
          <button
            onClick={() => setShowMyRooms(!showMyRooms)}
            className={`px-4 py-2.5 rounded-xl text-sm transition-all border ${
              showMyRooms
                ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                : "bg-apex-card border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            My Rooms
          </button>
        </div>

        {/* Room Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {showMyRooms ? "You haven't joined any rooms" : "No rooms found"}
            </h3>
            <p className="text-gray-500 mb-6">
              {showMyRooms
                ? "Create a room or join one to start studying with peers!"
                : "Be the first to create a study room!"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-xl bg-neon-cyan text-black font-medium hover:shadow-lg hover:shadow-neon-cyan/25 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create a Room
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-apex-card rounded-2xl border border-white/5 hover:border-white/10 transition-all overflow-hidden group"
              >
                {/* Card Header with gradient */}
                <div
                  className={`h-2 bg-gradient-to-r ${
                    categoryColors[room.category] || categoryColors.general
                  }`}
                />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {room.name}
                        </h3>
                        {room.is_private ? (
                          <Lock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-neon-green flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{room.category_display}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        room.status === "active"
                          ? "bg-neon-green/20 text-neon-green"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {room.status_display}
                    </span>
                  </div>

                  {room.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {room.participant_count}/{room.max_participants}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Timer className="w-4 h-4" />
                        {room.pomodoro_work_minutes}m
                      </span>
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" />
                        {room.host_name}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => joinRoom(room.id)}
                    disabled={room.participant_count >= room.max_participants}
                    className="w-full mt-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-neon-cyan/10 hover:border-neon-cyan/30 hover:text-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    {room.participant_count >= room.max_participants
                      ? "Room Full"
                      : "Join Room"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Create Room Modal ===== */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-apex-darker rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-neon-cyan" />
                      Create Study Room
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 rounded-lg hover:bg-white/5 text-gray-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Room Name */}
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">
                        Room Name *
                      </label>
                      <input
                        type="text"
                        value={createForm.name}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, name: e.target.value })
                        }
                        placeholder="e.g., DSA Practice Session"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                        maxLength={100}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">
                        Description
                      </label>
                      <textarea
                        value={createForm.description}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, description: e.target.value })
                        }
                        placeholder="What will you be studying?"
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 resize-none"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">
                        Category
                      </label>
                      <select
                        value={createForm.category}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, category: e.target.value })
                        }
                        className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-neon-cyan/50"
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value} className="bg-[#111118] text-white">
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Max Participants */}
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">
                        Max Participants: {createForm.max_participants}
                      </label>
                      <input
                        type="range"
                        min={2}
                        max={8}
                        value={createForm.max_participants}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            max_participants: parseInt(e.target.value),
                          })
                        }
                        className="w-full accent-neon-cyan"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>2</span>
                        <span>8</span>
                      </div>
                    </div>

                    {/* Pomodoro Settings */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-neon-cyan" />
                        Pomodoro Timer
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">
                            Work (min)
                          </label>
                          <input
                            type="number"
                            min={5}
                            max={60}
                            value={createForm.pomodoro_work_minutes}
                            onChange={(e) =>
                              setCreateForm({
                                ...createForm,
                                pomodoro_work_minutes: parseInt(e.target.value) || 25,
                              })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">
                            Break (min)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={createForm.pomodoro_break_minutes}
                            onChange={(e) =>
                              setCreateForm({
                                ...createForm,
                                pomodoro_break_minutes: parseInt(e.target.value) || 5,
                              })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">
                            Rounds
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={createForm.pomodoro_rounds}
                            onChange={(e) =>
                              setCreateForm({
                                ...createForm,
                                pomodoro_rounds: parseInt(e.target.value) || 4,
                              })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Private Toggle */}
                    <label className="flex items-center justify-between py-2 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Private Room</span>
                      </div>
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          createForm.is_private ? "bg-neon-cyan" : "bg-white/10"
                        }`}
                        onClick={() =>
                          setCreateForm({
                            ...createForm,
                            is_private: !createForm.is_private,
                          })
                        }
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                            createForm.is_private ? "translate-x-[22px]" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </label>
                  </div>

                  {/* Create Button */}
                  <button
                    onClick={createRoom}
                    disabled={!createForm.name.trim()}
                    className="w-full mt-6 py-3 rounded-xl bg-neon-cyan text-black font-medium hover:shadow-lg hover:shadow-neon-cyan/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Create Room
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Join by Code Modal ===== */}
      <AnimatePresence>
        {showJoinModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowJoinModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-apex-darker rounded-2xl border border-white/10 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Hash className="w-5 h-5 text-neon-cyan" />
                      Join by Code
                    </h2>
                    <button
                      onClick={() => setShowJoinModal(false)}
                      className="p-2 rounded-lg hover:bg-white/5 text-gray-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">
                    Enter the 6-character room code shared by the host.
                  </p>

                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) =>
                      setJoinCode(e.target.value.toUpperCase().slice(0, 6))
                    }
                    placeholder="ABCD12"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan/50 uppercase"
                    maxLength={6}
                  />

                  <button
                    onClick={joinByCode}
                    disabled={joinCode.length !== 6}
                    className="w-full mt-4 py-3 rounded-xl bg-neon-cyan text-black font-medium hover:shadow-lg hover:shadow-neon-cyan/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
