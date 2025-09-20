"use client";

import React, { useState } from "react";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [pending, setPending] = useState(false);
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast.error("Email and password are required.");
      setPending(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user_id", data.user_id);
        toast.success("Logged in successfully!");
        navigate("/dashboard/assistants");
      } else if (res.status === 401) {
        toast.error("Invalid email or password");
      } else {
        const msg = await res.text();
        toast.error(msg || "Server error");
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex flex-col justify-center w-full px-6 py-12 lg:px-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Bot className="size-8" />
          <span className="text-2xl font-semibold">Buddy AI</span>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-[.5rem]">
              <Label htmlFor="email" className="font-semibold text-[1.1rem]">Email address</Label>
              <Input type="email" name="email" id="email" required />
            </div>

            <div className="flex flex-col gap-[.5rem]">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-semibold text-[1.1rem]">Password</Label>
                <a href="#" className=" text-gray-500 font-medium text-[1.1rem]">
                  Forgot password?
                </a>
              </div>
              <Input type="password" name="password" id="password" required />
            </div>

            <Button
              disabled={pending}
              type="submit"
              className="cursor-pointer w-full"
            >
              {pending ? "Loading..." : "Login"}
            </Button>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <a href="/auth/register" className="font-medium text-black underline">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
