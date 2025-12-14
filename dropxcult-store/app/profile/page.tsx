"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Package, Palette, Wallet, Edit3, Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { setCredentials, logout } from "@/redux/slices/authSlice";
import dayjs from "dayjs";

export default function ProfilePage() {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

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

  const profile = data?.user;
  const orders = data?.orders;
  const designs = data?.designs;

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

  // Delete Design Mutation
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

  const handleWithdraw = () => {
    if (profile?.royaltyPoints < 500) {
      toast.error("Minimum withdrawal is 500 Points");
      return;
    }
    toast.success("Withdrawal request sent!");
  };

  if (isLoading || !profile) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-red-600" /></div>;

  // Rank Colors
  const getRankColor = (rank: string) => {
    switch (rank) {
      case "Founder": return "text-yellow-500 border-yellow-500 bg-yellow-900/30 shadow-[0_0_15px_rgba(234,179,8,0.5)]"; // Added Founder style
      case "Elder": return "text-purple-500 border-purple-500 bg-purple-900/30 shadow-[0_0_15px_rgba(168,85,247,0.5)]";
      case "Zealot": return "text-red-500 border-red-500 bg-red-900/30 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
      case "Apostle": return "text-orange-500 border-orange-500 bg-orange-900/30";
      case "Disciple": return "text-blue-500 border-blue-500 bg-blue-900/30";
      default: return "text-gray-400 border-gray-600 bg-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center relative overflow-hidden">
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRankColor(profile.rank)}`}>
              {profile.rank}
            </div>

            <div className="h-28 w-28 rounded-full bg-zinc-800 mx-auto mb-4 border-4 border-zinc-800 flex items-center justify-center overflow-hidden relative group">
              {profile.image ? (
                <img src={profile.image} className="h-full w-full object-cover" />
              ) : (
                // FIX: Added safe access (?.) and fallback for charAt
                <span className="text-4xl font-bold text-gray-600">{profile.name?.charAt(0) || "U"}</span>
              )}
            </div>

            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-gray-400 text-sm mb-4">{profile.email}</p>
            <p className="text-gray-300 italic text-sm px-4 border-l-2 border-red-900 mx-auto max-w-[80%]">
              "{profile.bio}"
            </p>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="mt-6 w-full bg-zinc-800 hover:bg-zinc-700 py-2 rounded text-sm font-bold flex items-center justify-center gap-2 transition"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wallet className="text-green-500" /> Cult Vault
            </h3>
            <div className="flex justify-between items-end mb-2">
              <span className="text-gray-400">Royalty Points</span>
              <span className="text-3xl font-bold text-white">{profile.royaltyPoints}</span>
            </div>
            <p className="text-xs text-gray-500 mb-6">1 Point = ₹1.00</p>

            <button
              onClick={handleWithdraw}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition"
            >
              Withdraw Funds
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Dashboard */}
        <div className="md:col-span-2 space-y-8">

          {/* 1. Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 p-6 rounded border border-zinc-800 flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500">
                <Package size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.ordersCount}</p>
                <p className="text-xs text-gray-400 uppercase">Orders</p>
              </div>
            </div>
            <div className="bg-zinc-900 p-6 rounded border border-zinc-800 flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-900/30 rounded-full flex items-center justify-center text-purple-500">
                <Palette size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.designsApproved}</p>
                <p className="text-xs text-gray-400 uppercase">Designs Approved</p>
              </div>
            </div>
          </div>

          {/* 2. Edit Form */}
          {isEditing && (
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold mb-4 text-red-500">Update Identity</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData);
                if ((data.password as string) !== (data.confirmPassword as string)) {
                  toast.error("Passwords do not match");
                  return;
                }
                updateMutation.mutate(data);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input name="name" defaultValue={profile.name} className="w-full bg-black border border-zinc-700 p-2 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input name="email" defaultValue={profile.email} className="w-full bg-black border border-zinc-700 p-2 rounded text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bio</label>
                  <textarea name="bio" defaultValue={profile.bio} className="w-full bg-black border border-zinc-700 p-2 rounded text-white" rows={2} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Profile Image URL</label>
                  <input name="image" defaultValue={profile.image} className="w-full bg-black border border-zinc-700 p-2 rounded text-white" placeholder="https://..." />
                </div>

                <div className="border-t border-zinc-800 pt-4 mt-4">
                  <p className="text-xs text-gray-500 mb-2">Change Password (Leave blank to keep current)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="password" type="password" placeholder="New Password" className="w-full bg-black border border-zinc-700 p-2 rounded text-white" />
                    <input name="confirmPassword" type="password" placeholder="Confirm New Password" className="w-full bg-black border border-zinc-700 p-2 rounded text-white" />
                  </div>
                </div>

                <div className="flex justify-between gap-2 mt-4">
                  <button type="button" onClick={() => { if (confirm("Are you sure? This cannot be undone.")) deleteMutation.mutate() }} className="text-red-600 text-xs flex items-center gap-1 hover:underline"><Trash2 size={12} /> Delete Account</button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-white text-black font-bold rounded text-sm hover:bg-gray-200">Save Changes</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* 3. Order History */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded">
            <h3 className="font-bold mb-4 text-gray-300">Recent Orders</h3>
            <div className="space-y-2">
              {orders?.map((order: any) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-black/50 rounded border border-zinc-800">
                  <div>
                    <p className="text-sm font-bold text-white">Order #{order.id.substring(0, 6)}</p>
                    <p className="text-xs text-gray-500">{dayjs(order.createdAt).format("DD MMM YYYY")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹{order.totalPrice}</p>
                    <span className={`text-[10px] uppercase font-bold ${order.isPaid ? "text-green-500" : "text-red-500"}`}>
                      {order.isPaid ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
              {orders?.length === 0 && <p className="text-sm text-gray-600 italic">No orders yet.</p>}
            </div>
          </div>

          {/* 4. My Designs */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded">
            <h3 className="font-bold mb-4 text-gray-300">My Artifacts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {designs?.map((design: any) => (
                <div key={design.id} className="aspect-square bg-black rounded border border-zinc-800 overflow-hidden relative group">
                  {Array.isArray(design.layers) && design.layers.find((l: any) => l.type === 'image') ? (
                    <img src={design.layers.find((l: any) => l.type === 'image').content} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">
                      {design.frontImage ? (
                        <img src={design.frontImage} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                      ) : "Text Only"}
                    </div>
                  )}
                  <div className="absolute bottom-0 w-full bg-black/80 p-1 text-[10px] text-center text-gray-400 flex justify-between items-center px-2">
                    <span>{design.status}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this design?")) deleteDesignMutation.mutate(design.id);
                      }}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {designs?.length === 0 && <p className="text-sm text-gray-600 italic col-span-4">No designs created.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}