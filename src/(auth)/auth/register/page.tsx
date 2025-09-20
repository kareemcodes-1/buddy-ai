import React, { useState } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Bot } from "lucide-react";

type User = {
  name: string;
  email: string;
  password: string;
};

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const user: User = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (!res.ok) throw new Error("Failed to register user");
      const result = await res.json();
      navigate('/dashboard/assistants')
      localStorage.setItem("access_token", result.access_token);
      localStorage.setItem("user_id", result.id);
      console.log("Registered:", result);
      alert("User created successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
      setLoading(false)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Bot className="size-8" />
          <span className="text-2xl font-semibold">Buddy AI</span>
        </div>

         <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                  <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="flex flex-col gap-[.5rem]">
                      <Label htmlFor="name" className="font-semibold text-[1.1rem]">Name</Label>
                      <Input type="text" name="name" id="name" required />
                    </div>

                    <div className="flex flex-col gap-[.5rem]">
                      <Label htmlFor="email" className="font-semibold text-[1.1rem]">Email address</Label>
                      <Input type="email" name="email" id="email" required />
                    </div>
        
                    <div className="flex flex-col gap-[.5rem]">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="font-semibold text-[1.1rem]">Password</Label>
                        {/* <a href="#" className=" text-gray-500 font-medium text-[1.1rem]">
                          Forgot password?
                        </a> */}
                      </div>
                      <Input type="password" name="password" id="password" required />
                    </div>
        
                    <Button
                      disabled={loading}
                      type="submit"
                      className="cursor-pointer w-full"
                    >
                      {loading ? "Loading..." : "Register"}
                    </Button>
                  </form>
        
                  <p className="mt-10 text-center text-sm text-gray-500">
                    Have an account?{" "}
                    <a href="/auth/login" className="font-medium text-black underline">
                      Login
                    </a>
                  </p>
                </div>
      </div>
    </div>
  );
};

export default Register;
