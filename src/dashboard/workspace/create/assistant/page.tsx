"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Button } from "../../../../components/ui/button";

export default function AssistantCreationForm({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("user_id") : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const body = {
      user_id: userId,
      name: fd.get("name"),
      role: fd.get("role"),
      description: fd.get("description"),
      instructions: fd.get("instructions"),
    };

    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/assistants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Assistant created!");
        e.currentTarget.reset();
        onCreated?.();
      } else {
        toast.error("Failed to create assistant");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Label>
        <span>Name</span>
        <Input name="name" placeholder="e.g. Grammar Helper" required />
      </Label>

      <Label>
        <span>Role</span>
        <Input name="role" placeholder="e.g. editor, tutor, coach" required />
      </Label>

      <Label>
        <span>Description</span>
        <Input name="description" placeholder="Short description" />
      </Label>

      <Label>
        <span>Instructions</span>
        <Textarea
          name="instructions"
          placeholder="How should the assistant behave?"
          required
        />
      </Label>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Assistant"}
      </Button>
    </form>
  );
}
