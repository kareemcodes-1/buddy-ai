"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Plus } from "lucide-react";
import { Assistant } from "../../../types/type";
import RootLayout from "../workspace/layout";
import AssistantCreationForm from "../workspace/create/assistant/page";
import { Button } from "../../components/ui/button";

const AssistantsPage = () => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selected, setSelected] = useState<Assistant[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/assistants`);
      const result = await res.json();
      setAssistants(result);
    })();
  }, []);

  const toggleSelect = (assistant: Assistant) => {
    setSelected((prev) =>
      prev.some((a) => a._id === assistant._id)
        ? prev.filter((a) => a._id !== assistant._id)
        : [...prev, assistant]
    );
  };

  const handleContinue = () => {
    if (!selected.length) return;
    navigate("/dashboard/workspace", { state: { assistants: selected } });
  };

  return (
    <RootLayout>
      <div className="min-h-screen bg-gray-50 py-12 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Choose Your AI Assistant
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Pick one or more assistants — from writing help to workouts and finance tips.
            </p>
          </div>

          <Button
             variant={'default'}
            onClick={handleContinue}
            disabled={!selected.length}
            className="px-4 py-2"
          >
            Continue
          </Button>
        </div>

        {/* Assistants grid */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* Render assistants */}
          {assistants.map((assistant) => {
            const isSelected = selected.some((a) => a._id === assistant._id);
            return (
              <Card
                key={assistant._id}
                onClick={() => toggleSelect(assistant)}
                className={`group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                  isSelected ? "ring-2 ring-purple-500" : "ring-1 ring-transparent"
                }`}
              >
                <CardHeader className="flex flex-col items-center">
                  <img
                    src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${assistant.name}`}
                    alt={assistant.name}
                    className="w-20 h-20 rounded-full border mb-3"
                  />
                  <CardTitle className="text-center text-xl font-semibold">
                    {assistant.name}
                  </CardTitle>
                  <CardDescription className="text-center text-gray-500">
                    {assistant.role}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}

          {/* “Add Assistant” card */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Card className="flex flex-col items-center justify-center p-6 border-dashed border-2 border-gray-300 cursor-pointer hover:border-purple-500 transition-all">
                <Plus className="h-10 w-10 text-gray-500 mb-2" />
                <CardTitle className="text-gray-700">Create Assistant</CardTitle>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Assistant</DialogTitle>
              </DialogHeader>
              <AssistantCreationForm onCreated={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </RootLayout>
  );
};

export default AssistantsPage;
