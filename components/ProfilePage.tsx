"use client";

import { useState, useEffect } from "react";
import { FaUser, FaMapMarkerAlt, FaPhone, FaSeedling, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { apiClient } from "@/lib/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [selectedCrops, setSelectedCrops] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location_address: "",
    acres_of_land: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileResponse = await apiClient.getFarmerProfile();
      if (profileResponse.data) {
        setProfile(profileResponse.data);
        setFormData({
          full_name: profileResponse.data.full_name || "",
          phone: profileResponse.data.phone || "",
          location_address: profileResponse.data.location_address || "",
          acres_of_land: profileResponse.data.acres_of_land?.toString() || "",
        });
      }

      const cropsResponse = await apiClient.getSelectedCrops();
      if (cropsResponse.data) {
        setSelectedCrops(cropsResponse.data);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await apiClient.updateFarmerProfile({
        ...formData,
        acres_of_land: parseFloat(formData.acres_of_land) || 0,
      });

      if (response.data) {
        setProfile(response.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-16 h-16 rounded-full flex items-center justify-center">
              <FaUser className="text-white text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Farmer Profile</h2>
              <p className="text-sm text-gray-500">Manage your profile information</p>
            </div>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <FaEdit />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="btn-primary flex items-center space-x-2"
              >
                <FaSave />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadProfile();
                }}
                className="btn-secondary flex items-center space-x-2"
              >
                <FaTimes />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input-field"
              />
            ) : (
              <p className="text-gray-900 font-medium">{profile?.full_name || "Not set"}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <FaPhone className="text-gray-400" />
              <span>Phone</span>
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
              />
            ) : (
              <p className="text-gray-900 font-medium">{profile?.phone || "Not set"}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <FaMapMarkerAlt className="text-gray-400" />
              <span>Location</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                className="input-field"
              />
            ) : (
              <p className="text-gray-900 font-medium">{profile?.location_address || "Not set"}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <FaSeedling className="text-gray-400" />
              <span>Acres of Land</span>
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.acres_of_land}
                onChange={(e) => setFormData({ ...formData, acres_of_land: e.target.value })}
                className="input-field"
                step="0.1"
                min="0"
              />
            ) : (
              <p className="text-gray-900 font-medium">{profile?.acres_of_land || 0} acres</p>
            )}
          </div>

          {profile?.pincode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <p className="text-gray-900 font-medium">{profile.pincode}</p>
            </div>
          )}

          {profile?.region && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <p className="text-gray-900 font-medium capitalize">{profile.region}</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Crops */}
      {selectedCrops.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FaSeedling className="text-emerald-600" />
            <span>Selected Crops</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCrops.map((crop) => (
              <div key={crop.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{crop.crop_name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    crop.is_suitable ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {crop.suitability_score}% Match
                  </span>
                </div>
                {crop.acres_allocated && (
                  <p className="text-sm text-gray-600">Allocated: {crop.acres_allocated} acres</p>
                )}
                {crop.planting_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Planted: {new Date(crop.planting_date).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

