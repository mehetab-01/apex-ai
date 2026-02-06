"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  Heart,
  Save,
  X,
  Check,
  Loader2,
  Award,
  Clock,
  Trophy,
  Edit3,
  Plus,
  Search,
  Settings,
  ArrowLeft,
  Camera,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import Link from "next/link";
import { uploadDisplayPicture, removeDisplayPicture } from "@/lib/api";

interface UserProfile {
  id: string;
  email: string;
  phone_number?: string;
  full_name: string;
  display_name: string;
  profile_picture_url?: string;
  display_picture_url?: string;
  college?: string;
  branch?: string;
  interests: string[];
  bio?: string;
  focus_points: number;
  total_focus_time_minutes: number;
  courses_completed: number;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Autocomplete states
  const [collegeOptions, setCollegeOptions] = useState<string[]>([]);
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [interestOptions, setInterestOptions] = useState<string[]>([]);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);

  const collegeRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const interestRef = useRef<HTMLDivElement>(null);

  // Fetch profile on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (collegeRef.current && !collegeRef.current.contains(e.target as Node)) {
        setShowCollegeDropdown(false);
      }
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setShowBranchDropdown(false);
      }
      if (interestRef.current && !interestRef.current.contains(e.target as Node)) {
        setShowInterestDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/auth/profile/");
      const data = response.data.user;
      setProfile(data);
      setFullName(data.full_name || "");
      setCollege(data.college || "");
      setBranch(data.branch || "");
      setBio(data.bio || "");
      setInterests(data.interests || []);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchColleges = async (query: string) => {
    try {
      const response = await api.get(`/auth/colleges/?q=${encodeURIComponent(query)}`);
      setCollegeOptions(response.data.colleges || []);
    } catch (err) {
      console.error("Failed to fetch colleges:", err);
    }
  };

  const fetchBranches = async (query: string) => {
    try {
      const response = await api.get(`/auth/branches/?q=${encodeURIComponent(query)}`);
      setBranchOptions(response.data.branches || []);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  };

  const fetchInterests = async (query: string) => {
    try {
      const response = await api.get(`/auth/interests/?q=${encodeURIComponent(query)}`);
      setInterestOptions(response.data.interests || []);
    } catch (err) {
      console.error("Failed to fetch interests:", err);
    }
  };

  const handleCollegeChange = (value: string) => {
    setCollege(value);
    fetchColleges(value);
    setShowCollegeDropdown(true);
  };

  const handleBranchChange = (value: string) => {
    setBranch(value);
    fetchBranches(value);
    setShowBranchDropdown(true);
  };

  const handleInterestInputChange = (value: string) => {
    setNewInterest(value);
    fetchInterests(value);
    setShowInterestDropdown(true);
  };

  const addInterest = (interest: string) => {
    if (interest && !interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
    setNewInterest("");
    setShowInterestDropdown(false);
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put("/auth/profile/", {
        full_name: fullName,
        college,
        branch,
        bio,
        interests,
      });

      setProfile(response.data.user);
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
      
      // Update auth context
      updateUser({ full_name: fullName });
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setIsUploadingPicture(true);
    setError(null);

    try {
      const response = await uploadDisplayPicture(file);
      setProfile(prev => prev ? { ...prev, display_picture_url: response.display_picture_url } : prev);
      updateUser({ display_picture: response.display_picture_url });
      setSuccess("Profile picture updated!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to upload picture:", err);
      setError(err.response?.data?.message || "Failed to upload picture");
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePicture = async () => {
    setIsUploadingPicture(true);
    setError(null);

    try {
      await removeDisplayPicture();
      setProfile(prev => prev ? { ...prev, display_picture_url: undefined } : prev);
      updateUser({ display_picture: undefined });
      setSuccess("Profile picture removed!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to remove picture:", err);
      setError(err.response?.data?.message || "Failed to remove picture");
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const cancelEdit = () => {
    if (profile) {
      setFullName(profile.full_name || "");
      setCollege(profile.college || "");
      setBranch(profile.branch || "");
      setBio(profile.bio || "");
      setInterests(profile.interests || []);
    }
    setIsEditing(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
              <p className="text-gray-400">Manage your profile and preferences</p>
            </div>
          </div>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg text-neon-green flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Profile Picture */}
            <div className="glass-card p-6 text-center">
              <div className="relative inline-block mb-4 group">
                {(profile?.display_picture_url || profile?.profile_picture_url) ? (
                  <img
                    src={profile.display_picture_url || profile.profile_picture_url}
                    alt={profile.full_name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-neon-cyan/30"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center border-4 border-neon-cyan/30">
                    <span className="text-4xl font-bold text-black">
                      {profile?.full_name?.charAt(0) || user?.full_name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                {/* Upload overlay */}
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePictureUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPicture}
                    className="p-2 rounded-full bg-neon-cyan/20 hover:bg-neon-cyan/40 transition-colors"
                    title="Upload new picture"
                  >
                    {isUploadingPicture ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </button>
                  {profile?.display_picture_url && (
                    <button
                      onClick={handleRemovePicture}
                      disabled={isUploadingPicture}
                      className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"
                      title="Remove picture"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">Hover to change picture</p>
              <h2 className="text-xl font-bold text-white mb-1">
                {profile?.full_name || user?.full_name || "User"}
              </h2>
              <p className="text-gray-400 text-sm mb-2">{profile?.email || user?.email}</p>
              {profile?.college && (
                <p className="text-neon-cyan text-sm">{profile.college}</p>
              )}
            </div>

            {/* Stats */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Your Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Award className="w-4 h-4 text-neon-cyan" />
                    Focus Points
                  </div>
                  <span className="text-neon-cyan font-bold">{profile?.focus_points || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4 text-neon-green" />
                    Focus Time
                  </div>
                  <span className="text-neon-green font-bold">
                    {Math.round((profile?.total_focus_time_minutes || 0) / 60)}h {(profile?.total_focus_time_minutes || 0) % 60}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <GraduationCap className="w-4 h-4 text-neon-purple" />
                    Courses Done
                  </div>
                  <span className="text-neon-purple font-bold">{profile?.courses_completed || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Profile Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-neon-cyan" />
                  Profile Details
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 text-gray-400 rounded-lg hover:bg-gray-500/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-neon-green/10 text-neon-green rounded-lg hover:bg-neon-green/20 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white focus:outline-none focus:border-neon-cyan/50 transition-colors"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-white py-2">{profile?.full_name || "Not set"}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <p className="text-white py-2">{profile?.email || "Not set"}</p>
                </div>

                {/* College with Autocomplete */}
                <div ref={collegeRef} className="relative">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    College / University
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => handleCollegeChange(e.target.value)}
                        onFocus={() => {
                          fetchColleges(college);
                          setShowCollegeDropdown(true);
                        }}
                        className="w-full px-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white focus:outline-none focus:border-neon-cyan/50 pr-10 transition-colors"
                        placeholder="Start typing college name (e.g., VJTI, IIT Bombay)..."
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <AnimatePresence>
                        {showCollegeDropdown && collegeOptions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-apex-card border border-apex-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
                          >
                            {collegeOptions.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setCollege(option);
                                  setShowCollegeDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left text-gray-300 hover:bg-apex-darker hover:text-white transition-colors border-b border-apex-border last:border-b-0 text-sm"
                              >
                                {option}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="text-white py-2">{profile?.college || "Not set"}</p>
                  )}
                </div>

                {/* Branch with Autocomplete */}
                <div ref={branchRef} className="relative">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Branch / Department
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => handleBranchChange(e.target.value)}
                        onFocus={() => {
                          fetchBranches(branch);
                          setShowBranchDropdown(true);
                        }}
                        className="w-full px-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white focus:outline-none focus:border-neon-cyan/50 pr-10 transition-colors"
                        placeholder="Start typing branch name (e.g., Computer, IT)..."
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <AnimatePresence>
                        {showBranchDropdown && branchOptions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-apex-card border border-apex-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
                          >
                            {branchOptions.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setBranch(option);
                                  setShowBranchDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left text-gray-300 hover:bg-apex-darker hover:text-white transition-colors border-b border-apex-border last:border-b-0 text-sm"
                              >
                                {option}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="text-white py-2">{profile?.branch || "Not set"}</p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    About Me
                  </label>
                  {isEditing ? (
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white focus:outline-none focus:border-neon-cyan/50 resize-none transition-colors"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-white py-2">{profile?.bio || "Not set"}</p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
                  )}
                </div>

                {/* Interests */}
                <div ref={interestRef} className="relative">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Heart className="w-4 h-4 inline mr-2" />
                    Learning Interests
                  </label>
                  
                  {/* Current Interests */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {interests.length > 0 ? (
                      interests.map((interest, index) => (
                        <motion.span
                          key={interest}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm flex items-center gap-2",
                            "bg-neon-purple/10 text-neon-purple border border-neon-purple/30"
                          )}
                        >
                          {interest}
                          {isEditing && (
                            <button
                              onClick={() => removeInterest(interest)}
                              className="hover:text-red-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </motion.span>
                      ))
                    ) : (
                      <span className="text-gray-500 py-2">No interests added yet</span>
                    )}
                  </div>

                  {/* Add Interest Input */}
                  {isEditing && (
                    <div className="relative">
                      <input
                        type="text"
                        value={newInterest}
                        onChange={(e) => handleInterestInputChange(e.target.value)}
                        onFocus={() => {
                          fetchInterests(newInterest);
                          setShowInterestDropdown(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newInterest.trim()) {
                            e.preventDefault();
                            addInterest(newInterest.trim());
                          }
                        }}
                        className="w-full px-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white focus:outline-none focus:border-neon-cyan/50 pr-10 transition-colors"
                        placeholder="Type to add interests (e.g., Python, Machine Learning)..."
                      />
                      <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <AnimatePresence>
                        {showInterestDropdown && interestOptions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-apex-card border border-apex-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
                          >
                            {interestOptions
                              .filter((opt) => !interests.includes(opt))
                              .slice(0, 10)
                              .map((option, index) => (
                                <button
                                  key={index}
                                  onClick={() => addInterest(option)}
                                  className="w-full px-4 py-3 text-left text-gray-300 hover:bg-apex-darker hover:text-white transition-colors border-b border-apex-border last:border-b-0 text-sm"
                                >
                                  {option}
                                </button>
                              ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <p className="text-xs text-gray-500 mt-2">
                        Press Enter or select from suggestions to add an interest
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
