"use client";

import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import RootLayout from "../workspace/layout";

const AccountSettingsPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("access_token");
  const userId = localStorage.getItem("user_id");

  // Fetch user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!token || !userId) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setEmail(data.email || "");
        } else {
          toast.error("Failed to load user info");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading user info");
      }
    };

    fetchUser();
  }, [token, userId]);

  async function handleSubmit() {
    if (!token || !userId) return;
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          current_password: currentPassword || undefined,
          new_password: newPassword || undefined,
        }),
      });

      if (res.ok) {
        toast.success(newPassword ? "Password updated!" : "Profile updated!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const error = await res.json();
        toast.error(error.detail || "Failed to update account");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating account");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (!token || !userId) return;

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users.user/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Account deleted");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        navigate("/login");
      } else {
        toast.error("Failed to delete account");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <RootLayout>
       <div className="flex flex-col gap-6 p-6">
      <h1 className="text-[2.5rem] font-bold">Account Settings</h1>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label className="text-[1.1rem]">Display Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <Label className="text-[1.1rem]">Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      {/* Change Password */}
      <div className="flex flex-col gap-3 mt-6">
        <h2 className="text-xl font-semibold">Change Password</h2>

        <Label className="text-[1.1rem]">Current Password</Label>
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <Label className="text-[1.1rem]">New Password</Label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <Label className="text-[1.1rem]">Confirm New Password</Label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-40">
        {loading ? "Saving..." : "Save Changes"}
      </Button>

      {/* Delete Account */}
      <h2 className="text-2xl font-bold mt-8">Delete Account</h2>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-40">
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete {name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your account and all related data
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAccount}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </RootLayout>
  );
};

export default AccountSettingsPage;
