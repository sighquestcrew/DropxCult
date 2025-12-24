"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Package, Palette, Wallet, Edit3, Trash2, Users, Heart, Crown, MapPin, Calendar, Link as LinkIcon, Settings, LogOut, ShoppingBag, Award, TrendingUp, Eye, MessageCircle, Share2, Camera, Upload, Sparkles, CheckCircle, XCircle, Truck } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { setCredentials, logout } from "@/redux/slices/authSlice";
import dayjs from "dayjs";
import Link from "next/link";

export default function ProfilePage() {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"designs" | "orders" | "liked">("designs");
  const searchParams = useSearchParams();

  // Read tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "orders" || tabParam === "liked" || tabParam === "designs") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFollowModal, setShowFollowModal] = useState<"followers" | "following" | null>(null);
  const [designFilter, setDesignFilter] = useState<"all" | "public" | "draft">("all");

  const filterDesigns = (list: any[]) => {
    if (!list) return [];
    if (designFilter === "all") return list;
    // Show Accepted AND Public designs in "Community" tab (Strict match with community feed)
    if (designFilter === "public") return list.filter((d) => d.status === "Accepted" && d.isPublic === true);
    // Show everything else in "Draft" tab
    if (designFilter === "draft") return list.filter((d) => !(d.status === "Accepted" && d.isPublic === true));
    return list;
  };

  useEffect(() => {
    if (!userInfo) router.push("/login");
  }, [userInfo, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/profile", {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      return data;
    },
    enabled: !!userInfo,
  });

  // Fetch followers/following list
  const { data: followData, isLoading: followLoading } = useQuery({
    queryKey: ["my-follow-list", showFollowModal],
    queryFn: async () => {
      const { data } = await axios.get(`/api/users/${userInfo?._id}/followers?type=${showFollowModal}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      return data;
    },
    enabled: !!showFollowModal && !!userInfo?._id,
  });

  // Fetch Liked Designs
  const { data: likedDesigns, isLoading: likedLoading } = useQuery({
    queryKey: ["liked-designs"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/liked", {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      return data;
    },
    enabled: !!userInfo && activeTab === "liked",
  });

  // Fetch Pre-Orders
  const { data: preOrdersData, isLoading: preOrdersLoading } = useQuery({
    queryKey: ["user-preorders"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/preorders", {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      return data;
    },
    enabled: !!userInfo && activeTab === "orders",
  });

  const profile = data?.user;
  const rawOrders = data?.orders || [];
  const preOrders = preOrdersData?.preOrders || [];
  const designs = data?.designs;

  // Merge orders and pre-orders for unified display
  const orders = [
    ...rawOrders.map((o: any) => ({ ...o, orderType: 'regular' })),
    ...preOrders.map((po: any) => ({
      id: po.id,
      orderNumber: po.orderNumber,
      totalPrice: po.totalAmount,
      createdAt: po.createdAt,
      status: po.status.charAt(0).toUpperCase() + po.status.slice(1), // Capitalize first letter
      isPaid: po.paymentStatus === 'paid',
      orderType: 'preorder',
      preOrderData: po, // Keep full pre-order data
      orderItems: po.items?.map((item: any) => ({
        name: item.product?.name || 'Product',
        qty: item.quantity,
        price: item.price,
        size: item.size,
        image: item.product?.images?.[0] || '',
        product: item.product
      })) || []
    }))
  ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const updateMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data } = await axios.put("/api/user/profile", formData, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success("Profile Updated");
      setIsEditing(false);
      dispatch(setCredentials({ ...userInfo, ...data }));
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: () => toast.error("Update Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete("/api/user/profile", {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
    },
    onSuccess: () => {
      toast.success("Account Deleted");
      dispatch(logout());
      router.push("/");
    },
  });

  const deleteDesignMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/customize/${id}`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
    },
    onSuccess: () => {
      toast.success("Design Deleted");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: () => toast.error("Failed to delete design"),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/user/design/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
    },
    onSuccess: () => {
      toast.success("Design published to community!");
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: () => toast.error("Failed to publish design"),
  });

  const handleWithdraw = () => {
    if (profile?.royaltyPoints < 500) {
      toast.error("Minimum withdrawal is 500 Points");
      return;
    }
    toast.success("Withdrawal request sent!");
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };



  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Founder": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "Elder": return "text-purple-500 bg-purple-500/10 border-purple-500/30";
      case "Zealot": return "text-red-500 bg-red-500/10 border-red-500/30";
      case "Apostle": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "Disciple": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // Extract Public ID from Cloudinary URL
  const getPublicIdFromUrl = (url: string) => {
    if (!url) return null;
    try {
      // Example: .../upload/v12345/folder/filename.jpg -> folder/filename
      const parts = url.split('/');
      const filename = parts.pop()?.split('.')[0];
      const folder = parts.pop();
      if (filename && folder && folder !== 'upload') { // Check if folder is part of public_id (not 'upload' or version)
        // Simple heuristic: if folder is 'dropxcult-products' or similar, include it
        const versionIndex = url.indexOf('/upload/');
        if (versionIndex !== -1) {
          const afterUpload = url.substring(versionIndex + 8); // Skip /upload/
          const afterVersion = afterUpload.indexOf('/') !== -1 ? afterUpload.substring(afterUpload.indexOf('/') + 1) : afterUpload;
          const pid = afterVersion.substring(0, afterVersion.lastIndexOf('.'));
          return pid;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file)); // Local preview only
    e.target.value = ""; // Reset input
  };

  const handleBannerCancel = () => {
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(null);
    setBannerPreview(null);
  };

  const handleBannerSave = async () => {
    if (!bannerFile) return;
    setSavingBanner(true);
    try {
      // 1. Upload New Banner
      const formData = new FormData();
      formData.append('file', bannerFile);

      const { data: uploadData } = await axios.post('/api/upload', formData, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });

      // 2. Update Profile
      await axios.put('/api/user/profile', { banner: uploadData.url }, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });

      // 3. Delete OLD Banner (Cleanup)
      const oldBannerUrl = profile.banner;
      if (oldBannerUrl) {
        const publicId = getPublicIdFromUrl(oldBannerUrl);
        if (publicId) {
          await axios.delete('/api/upload', {
            data: { public_id: publicId },
            headers: { Authorization: `Bearer ${userInfo?.token}` }
          });
        }
      }

      toast.success('Banner updated!');
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      handleBannerCancel(); // Reset local state
    } catch (error) {
      toast.error('Failed to update banner');
    } finally {
      setSavingBanner(false);
    }
  };

  if (isLoading || !profile) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-red-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto">

        {/* Cover/Banner - Editable */}
        <div className="h-32 sm:h-48 relative group"> {/* Removed onClick handler from parent */}

          {/* Main Display Image */}
          {(bannerPreview || profile?.banner) ? (
            <img src={bannerPreview || profile.banner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-red-900/50 via-purple-900/30 to-zinc-900">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            </div>
          )}

          {/* Action Overlay - Always visible if new banner selected, else on hover */}
          <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center ${bannerFile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>

            {/* If NO file selected: Show "Change Banner" */}
            {!bannerFile && (
              <button
                onClick={() => bannerInputRef.current?.click()}
                className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-full hover:bg-black/70 transition"
              >
                <Camera size={24} />
                <span className="font-medium">Change Banner</span>
              </button>
            )}

            {/* If File Selected: Show Save/Cancel */}
            {bannerFile && (
              <div className="flex gap-3">
                <button
                  onClick={handleBannerSave}
                  disabled={savingBanner}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2"
                >
                  {savingBanner ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                  Save
                </button>
                <button
                  onClick={handleBannerCancel}
                  disabled={savingBanner}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              </div>
            )}

          </div>

          {/* Hidden file input */}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerSelect}
          />
        </div>


        {/* Profile Header */}
        <div className="relative px-4 pb-4 border-b border-zinc-800">
          {/* Avatar */}
          <div className="absolute -top-16 sm:-top-20 left-4">
            <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br from-red-600 to-purple-600 p-1">
              <div className="h-full w-full rounded-full bg-black border-4 border-black overflow-hidden flex items-center justify-center">
                {profile.image ? (
                  <img src={profile.image} className="h-full w-full object-cover" alt={profile.name} />
                ) : (
                  <span className="text-4xl sm:text-5xl font-bold text-gray-600">
                    {profile.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 sm:pt-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-full border border-zinc-700 transition flex items-center gap-2"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Edit Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-zinc-800 hover:bg-red-600/20 hover:text-red-500 hover:border-red-500/50 text-gray-400 text-sm rounded-full border border-zinc-700 transition"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Profile Info */}
          <div className="mt-6 sm:mt-8">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">{profile.name}</h1>
              {profile.isCreator && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full border text-cyan-500 bg-cyan-500/10 border-cyan-500/30 flex items-center gap-1">
                  <Sparkles size={10} />
                  Creator
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getRankColor(profile.rank)}`}>
                <Crown size={10} className="inline mr-1" />
                {profile.rank}
              </span>
            </div>
            <p className="text-gray-500 text-sm">@{profile.name?.toLowerCase().replace(/\s/g, '')}</p>

            {profile.bio && (
              <p className="mt-3 text-gray-300 text-sm max-w-lg">{profile.bio}</p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Joined {dayjs(profile.createdAt).format("MMM YYYY")}
              </span>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4 text-sm">
              <button onClick={() => setShowFollowModal("followers")} className="hover:underline">
                <span className="font-bold text-white">{profile.followersCount || 0}</span>
                <span className="text-gray-500 ml-1">Followers</span>
              </button>
              <button onClick={() => setShowFollowModal("following")} className="hover:underline">
                <span className="font-bold text-white">{profile.followingCount || 0}</span>
                <span className="text-gray-500 ml-1">Following</span>
              </button>
              <div>
                <span className="font-bold text-white">{designs?.length || 0}</span>
                <span className="text-gray-500 ml-1">Designs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Followers/Following Modal */}
        {showFollowModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowFollowModal(null)}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-bold capitalize">{showFollowModal}</h2>
                <button onClick={() => setShowFollowModal(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                {followLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="animate-spin mx-auto text-gray-500" size={24} />
                  </div>
                ) : followData?.users?.length > 0 ? (
                  <div className="divide-y divide-zinc-800">
                    {followData.users.map((user: any) => (
                      <Link
                        key={user.id}
                        href={`/user/${user.id}`}
                        onClick={() => setShowFollowModal(null)}
                        className="flex items-center gap-3 p-4 hover:bg-zinc-800 transition"
                      >
                        <div className="h-12 w-12 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                          {user.image ? (
                            <img src={user.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              {user.name?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{user.name}</p>
                          <p className="text-sm text-gray-500">@{user.username || user.name?.toLowerCase().replace(/\s/g, '')}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getRankColor(user.rank)}`}>
                          <Crown size={10} className="inline mr-1" />
                          {user.rank}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No {showFollowModal} yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsEditing(false)}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-bold">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: any = Object.fromEntries(formData);
                if ((data.password as string) !== (data.confirmPassword as string)) {
                  toast.error("Passwords do not match");
                  return;
                }

                try {
                  // Check if new image selected
                  const fileInput = fileInputRef.current;
                  let newImageUrl = null;

                  if (fileInput && fileInput.files && fileInput.files[0]) {
                    // Upload NOW
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', fileInput.files[0]);

                    toast.loading('Uploading image...');
                    const { data: uploadData } = await axios.post('/api/upload', uploadFormData, {
                      headers: { Authorization: `Bearer ${userInfo?.token}` }
                    });
                    newImageUrl = uploadData.url;
                    data.image = newImageUrl; // Add to update payload
                    toast.dismiss();
                  }

                  // Update Profile
                  await updateMutation.mutateAsync(data);

                  // Cleanup Old Image
                  if (newImageUrl && profile.image) {
                    const publicId = getPublicIdFromUrl(profile.image);
                    if (publicId) {
                      axios.delete('/api/upload', {
                        data: { public_id: publicId },
                        headers: { Authorization: `Bearer ${userInfo?.token}` }
                      }).catch(err => console.error("Cleanup failed", err));
                    }
                  }

                } catch (err) {
                  toast.dismiss();
                  console.error(err);
                  toast.error("Profile update failed");
                }
              }} className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input name="name" defaultValue={profile.name} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input name="email" defaultValue={profile.email} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bio</label>
                  <textarea name="bio" defaultValue={profile.bio} className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-blue-500 focus:outline-none" rows={3} />
                </div>
                {/* Profile Image Upload (Deferred) */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Profile Image</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700">
                        {(imagePreview || profile.image) ? (
                          <img src={imagePreview || profile.image} className="h-full w-full object-cover" alt="Preview" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-600">
                            <Camera size={24} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-gray-400">
                        {imagePreview && imagePreview.startsWith('blob:') ? "Image selected. Save to apply." : "Current profile image."}
                      </p>

                      {/* Hidden Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        name="profileImageFile" // Not used directly by form data, handled manually
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Local Preview Only
                          if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
                          setImagePreview(URL.createObjectURL(file));
                          // Store file in a way we can access on submit (e.g. state or ref, or just re-access input)
                        }}
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg border border-zinc-700 flex items-center justify-center gap-2 transition"
                        >
                          <Upload size={16} /> Choose New
                        </button>
                        {imagePreview && imagePreview.startsWith('blob:') && (
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(imagePreview);
                              setImagePreview(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="py-2 px-3 bg-red-900/30 hover:bg-red-900/50 text-red-500 text-sm rounded-lg border border-red-900/50 flex items-center justify-center transition"
                            title="Cancel selection"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">JPG, PNG, GIF, WebP. Max 5MB</p>
                    </div>
                  </div>
                  <input type="hidden" name="image" value={imagePreview || profile.image || ''} />
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-xs text-gray-500 mb-3">Change Password (leave blank to keep current)</p>
                  <div className="space-y-3">
                    <input name="password" type="password" placeholder="New Password" className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-blue-500 focus:outline-none" />
                    <input name="confirmPassword" type="password" placeholder="Confirm Password" className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => { if (confirm("Delete your account? This cannot be undone.")) deleteMutation.mutate() }}
                    className="text-red-500 text-sm flex items-center gap-1 hover:underline"
                  >
                    <Trash2 size={14} /> Delete Account
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-zinc-800 sticky top-0 bg-black/80 backdrop-blur-md z-30">
          <div className="flex">
            {[
              { id: "designs", label: "Designs", icon: Palette },
              { id: "orders", label: "Orders", icon: ShoppingBag },
              { id: "liked", label: "Liked", icon: Heart }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 text-sm font-semibold transition-colors relative hover:bg-zinc-900 flex items-center justify-center gap-2 ${activeTab === tab.id ? "text-white" : "text-gray-500"
                  }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">

          {/* Designs Tab */}
          {activeTab === "designs" && (
            <div>
              {/* Royalty Card */}
              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="text-green-500" size={20} />
                    <span className="font-bold text-green-400">Cult Vault</span>
                  </div>
                  <span className="text-xs text-gray-500">1 Point = ₹1</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{profile.royaltyPoints || 0}</p>
                    <p className="text-xs text-gray-400">Royalty Points</p>
                  </div>
                  <button
                    onClick={handleWithdraw}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-lg transition"
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              {/* Design Filters */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {["all", "public", "draft"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDesignFilter(filter as any)}
                    className={`px-3 py-1 text-xs font-bold rounded-full capitalize transition ${designFilter === filter
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                      }`}
                  >
                    {filter === "public" ? "Community" : filter}
                  </button>
                ))}
              </div>

              {/* Designs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filterDesigns(designs)?.map((design: any) => (
                  <div key={design.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-500/50 transition">
                    <div className="aspect-square bg-black">
                      {design.previewImage || design.frontImage ? (
                        <img
                          src={design.previewImage || design.frontImage}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                          alt={design.name || "Design"}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          <Palette size={32} />
                        </div>
                      )}
                    </div>
                    {/* Status Badge */}
                    {(design.status === "Accepted" || design.isPublic) && (
                      <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Community
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold truncate">{design.name || `Design`}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(design.status)}`}>
                          {design.status}
                        </span>
                      </div>

                      {/* Publish Button for Accepted but Private Designs */}
                      {design.status === "Accepted" && !design.isPublic && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm("Post this design to the community?")) {
                              publishMutation.mutate(design.id);
                            }
                          }}
                          disabled={publishMutation.isPending}
                          className="w-full mt-2 mb-2 py-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded transition flex items-center justify-center gap-1"
                        >
                          <Share2 size={12} />
                          Post to Community
                        </button>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{dayjs(design.createdAt).format("DD MMM")}</span>
                        <button
                          onClick={() => { if (confirm("Delete?")) deleteDesignMutation.mutate(design.id) }}
                          className="text-gray-500 hover:text-red-500 transition p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Create New Design Card */}
                <Link href="/customize" className="group flex flex-col items-center justify-center aspect-square bg-zinc-900 border border-dashed border-zinc-700 rounded-xl hover:border-red-500 hover:bg-zinc-800/50 transition">
                  <div className="h-12 w-12 rounded-full bg-zinc-800 group-hover:bg-red-500/20 flex items-center justify-center mb-2 transition">
                    <Palette size={24} className="text-gray-500 group-hover:text-red-500 transition" />
                  </div>
                  <span className="text-sm text-gray-500 group-hover:text-white transition">Create New</span>
                </Link>
              </div>

              {designs?.length === 0 && (
                <div className="text-center py-12">
                  <Palette size={48} className="mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-500">No designs yet. Start creating!</p>
                  <Link href="/customize" className="inline-block mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition">
                    Create Design
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {orders?.map((order: any) => (
                <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition">
                  {/* Order Header */}
                  <div className="p-4 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <p className="font-bold text-white flex items-center gap-2">
                        <Package size={16} className="text-red-500" />
                        Order #{order.id.substring(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-white">₹{order.totalPrice}</p>
                      <div className="flex gap-2 justify-end mt-1">
                        {order.orderType === 'preorder' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            ⏰ PRE-ORDER
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.isPaid
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          }`}>
                          {order.isPaid ? "✓ Paid" : "⏳ Pending"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === "Delivered"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : order.status === "Shipped"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}>
                          {order.status === "Delivered" ? "✓ Delivered" : order.status === "Shipped" ? "🚚 Shipped" : "📦 Processing"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  {order.orderItems?.length > 0 && (
                    <div className="p-4 space-y-3">
                      {order.orderItems.map((item: any, i: number) => (
                        <div key={i} className="flex gap-3 items-center">
                          <div className="w-16 h-16 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden border border-zinc-700">
                            {item.image ? (
                              <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <Package size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{item.name}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                              <span className="bg-zinc-800 px-2 py-0.5 rounded">Size: {item.size || "M"}</span>
                              <span>Qty: {item.qty}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="font-bold text-white">₹{item.price}</p>

                            {/* Review Button Logic:
                                1. Must be Delivered
                                2. Must NOT be custom (community design) - API sets isCustom: false for shop designs
                                3. Must be either a regular product (slug) OR a shop design (designId)
                            */}
                            {order.status === "Delivered" && !item.isCustom && (
                              (item.product?.slug && item.product.name === item.name) ||
                              item.designId
                            ) && (
                                <Link
                                  href={item.designId ? `/product/design-${item.designId}#reviews` : `/product/${item.product.slug}#reviews`}
                                  className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded font-medium transition flex items-center gap-1"
                                >
                                  <Award size={12} />
                                  Review
                                </Link>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Shipping Info Hint */}
                  {order.isPaid && order.status !== "Delivered" && (
                    <div className="px-4 pb-4">
                      {order.status === "Shipped" ? (
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-xs text-purple-400">
                          <p className="font-semibold">🚚 Your order has been shipped!</p>
                          <p className="text-purple-300/70 mt-1">It's on the way. You'll receive it soon.</p>
                        </div>
                      ) : (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-400">
                          <p className="font-semibold">📦 Your order is being prepared</p>
                          <p className="text-blue-300/70 mt-1">We'll notify you when it ships.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pre-Order Campaign Info */}
                  {order.orderType === 'preorder' && order.preOrderData?.campaign && (
                    <div className="px-4 pb-4">
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-xs">
                        <p className="font-semibold text-purple-400 mb-1">⏰ Pre-Order Campaign</p>
                        <p className="text-purple-300/70">{order.preOrderData.campaign.name}</p>
                        {order.preOrderData.campaign.status === 'active' && (
                          <p className="text-purple-300/70 mt-1">
                            Expected delivery: ~{order.preOrderData.campaign.deliveryDays} days after campaign ends
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Track Order Button */}
                  <div className="px-4 pb-4">
                    <Link
                      href={`/track-order?orderId=${order.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-medium transition text-sm border border-zinc-700"
                    >
                      <Truck size={16} />
                      Track Order
                    </Link>
                  </div>
                </div>
              ))}

              {orders?.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag size={48} className="mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-500">No orders yet</p>
                  <Link href="/shop" className="inline-block mt-4 px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition">
                    Browse Shop
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Liked Tab */}
          {activeTab === "liked" && (
            <div>
              {likedLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-red-500" size={32} />
                </div>
              ) : likedDesigns?.length === 0 ? (
                <div className="text-center py-12">
                  <Heart size={48} className="mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-500">Liked designs will appear here</p>
                  <Link href="/community" className="inline-block mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition">
                    Explore Community
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {likedDesigns?.map((design: any) => (
                    <Link href={`/community?design=${design.id}`} key={design.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-500/50 transition block">
                      <div className="aspect-square bg-black">
                        {design.previewImage ? (
                          <img
                            src={design.previewImage}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                            alt={design.name || "Design"}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700">
                            <Palette size={32} />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold truncate">{design.name || `Design`}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Heart size={12} className="text-red-500 fill-red-500" />
                            {design.likesCount}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-5 w-5 rounded-full bg-zinc-800 overflow-hidden">
                            {design.user?.image ? (
                              <img src={design.user.image} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">
                                {design.user?.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 truncate">{design.user?.name}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div >
    </div >
  );
}