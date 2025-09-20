"use client";

import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import {
  Sheet,
  SheetContent,
} from "../../components/ui/sheet";
import { ChevronRight, LogOut, Menu, Settings } from "lucide-react";
import { Label } from "../../components/ui/label";
import toast from "react-hot-toast";
import { Assistant } from "../../../types/type";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import AssistantCreationForm from "../workspace/create/assistant/page";

interface User {
  _id: string;
  name: string;
  email: string;
}



export default function WorkspacePage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selected, setSelected] = useState<Assistant | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("gpt-4");
  const [instructions, setInstructions] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const userId = localStorage.getItem("user_id");
        if (!token || !userId) return;

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load user");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser()
  }, []);


  // Fetch all assistants
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/assistants`);
        if (!res.ok) throw new Error("Failed to fetch assistants");
        const data = await res.json();
        setAssistants(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAssistants();
  }, []);

  // When an assistant is selected, load its info
  useEffect(() => {
    if (selected) setInstructions(selected.instructions);
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const loadHistory = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/chat/history/${selected._id}`
        );
        if (!res.ok) throw new Error("Failed to load history");
        const data = await res.json();
        setMessages(data.map((d: any) => ({ role: d.role, content: d.content })));
      } catch (err) {
        console.error(err);
      }
    };
    loadHistory();
  }, [selected]);


  const handleSend = async (msg: string) => {
    if (!msg.trim() || !selected) return;

    // add the user's message to the UI immediately
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistant_id: selected._id,
          message: msg,
          model: "gemini-2.5-flash-lite", // or map to your dropdown values
        }),
      });

      if (!res.ok) throw new Error("Failed to create chat");
      const data = await res.json();

      // append assistant response
      setMessages((prev) => [
        ...prev,
        { role: data.role as "assistant", content: data.content },
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Could not send message");
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    if (!selected) return;
    try {
      setUpdateLoading(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/assistants/assistant/${selected._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selected.name,
          role: selected.role,
          instructions,
          model,
        }),
      });

      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      toast.success("Assistant updated!");
      setAssistants((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      setSelected(updated);
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || !confirm("Delete this assistant?")) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/assistants/assistant/${selected._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setAssistants((prev) => prev.filter((a) => a._id !== selected._id));
      setSelected(null);
      toast.success("Assistant deleted");
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-screen md:flex-row bg-gray-50">
      {/* Mobile Top Bar */}
      <header className="flex items-center justify-between p-4 border-b bg-white md:hidden">
        <Button variant="ghost" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
         <Link to={'/'}><h1 className="font-semibold text-lg">Personal AI Assistants</h1></Link>
        <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex md:w-64 flex-col border-r bg-white">
       <Link to={'/'}><h1 className="text-xl font-semibold p-4 border-b">Personal AI Assistants</h1></Link>
        <div className="p-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <div className="w-full rounded-md border-dashed border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer p-4 text-center">
                <span className="text-sm font-medium text-gray-700">
                  + Create Assistant
                </span>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Assistant</DialogTitle>
              </DialogHeader>
              <AssistantCreationForm onCreated={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="flex-1">
          <nav className="px-3 py-4 space-y-2">
            {assistants.map((a) => (
              <div
                key={a._id}
                onClick={() => setSelected(a)}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-3 cursor-pointer ${selected?._id === a._id ? "bg-gray-100" : ""
                  }`}
              >
                <img
                  src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${a.name}`}
                  alt={a.name}
                  className="w-10 h-10 rounded-full border"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{a.name}</span>
                  <span className="text-xs text-gray-500">{a.role}</span>
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="border-t p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
              <img
                src="https://api.dicebear.com/9.x/identicon/svg?seed=Kareem"
                alt="User avatar"
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <LogOut className="h-5 w-5 text-gray-400" />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" sideOffset={6}>
            <div className="px-3 py-2">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/account")}>
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // put your logout logic here
                console.log("logout");
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      {/* Sidebar Drawer (Mobile) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <div className="w-full rounded-md border-dashed border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer p-4 text-center">
                    <span className="text-sm font-medium text-gray-700">
                      + Create Assistant
                    </span>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Assistant</DialogTitle>
                  </DialogHeader>
                  <AssistantCreationForm onCreated={() => setOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <nav className="px-3 py-4 space-y-2">
              {assistants.map((a) => (
                <div
                  key={a._id}
                  onClick={() => {
                    setSelected(a);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-3 cursor-pointer ${selected?._id === a._id ? "bg-gray-100" : ""
                    }`}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="border-t p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                        <img
                          src="https://api.dicebear.com/9.x/identicon/svg?seed=Kareem"
                          alt="User avatar"
                          className="h-10 w-10 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{user?.name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <LogOut className="h-5 w-5 text-gray-400" />
                      </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-48">
                      <div className="px-2 py-1">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/account")}>
                        Account Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          // Handle logout here
                          console.log("Logout clicked");
                        }}
                      >
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>;
                </div>
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Chat Section */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="text-2xl font-semibold">What can I help you with today?</h2>
              <div className="flex flex-col gap-3 w-full max-w-md">
                {["Summarize this article", "Help me write an email"].map((prompt) => (
                  <Button
                    key={prompt}
                    className="justify-between p-6 text-lg"
                    variant="outline"
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 shadow-sm max-w-[75%] ${m.role === "assistant"
                      ? "bg-white text-gray-800"
                      : "bg-blue-500 text-white ml-auto"
                      }`}
                  >
                    {m.content}
                  </div>
                ))}
              </div>

              {loading && (
                <div className="rounded-lg p-3 shadow-sm max-w-[75%] bg-white text-gray-500 italic flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:0.2s]">●</span>
                  <span className="animate-bounce [animation-delay:0.4s]">●</span>
                </div>
              )}

            </>
          )}
        </div>
        <footer className="border-t bg-white p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Send a message..."
              className="flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            />
            <Button onClick={() => handleSend(input)}>Send</Button>
          </div>
        </footer>
      </main>

      {/* Settings (Desktop) */}
      <aside className="hidden lg:flex lg:w-80 flex-col border-l bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Assistant Settings</h2>
        </div>
        {selected ? (
          <ScrollArea className="flex-1 p-4 space-y-4">
            <div className="flex flex-col gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={selected.name}
                  onChange={(e) =>
                    setSelected((prev) => prev && { ...prev, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input
                  value={selected.role}
                  onChange={(e) =>
                    setSelected((prev) => prev && { ...prev, role: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>AI Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">OpenAI GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5">OpenAI GPT-3.5</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Instructions</Label>
                <Textarea
                  placeholder="Describe how this assistant should behave..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="min-h-[8rem]"
                />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={updateLoading}>
                {updateLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete Assistant"}
              </Button>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select an assistant to edit
          </div>
        )}
      </aside>

      {/* Settings Drawer (Mobile) */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-80 p-4">
          <h2 className="text-lg font-semibold mb-4">Assistant Settings</h2>
          {selected ? (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={selected.name}
                  onChange={(e) =>
                    setSelected((prev) => prev && { ...prev, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input
                  value={selected.role}
                  onChange={(e) =>
                    setSelected((prev) => prev && { ...prev, role: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>AI Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">OpenAI GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5">OpenAI GPT-3.5</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Instructions</Label>
                <Textarea
                  placeholder="Describe how this assistant should behave..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="min-h-[8rem]"
                />
              </div>
              <Button variant={'outline'} className="w-full" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Assistant"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select an assistant to edit
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
