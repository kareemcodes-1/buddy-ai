

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { IconUser, IconSettings, IconLogout } from "@tabler/icons-react";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Link } from "react-router";
import { Bot } from "lucide-react";

interface User {
  name: string;
  email: string;
}

export function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  // Fetch user info
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) return;

    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser({ name: data.name, email: data.email });
        }
      } catch (e) {
        console.error("Failed to fetch user:", e);
      }
    })();
  }, []);

  // Check assistants and redirect
  const handleAssistantsRedirect = async () => {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      navigate("/auth/login");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/assistants?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          navigate("/dashboard/assistants");
        } else {
          navigate("/dashboard/workspace/create/assistant");
        }
      } else {
        console.error("Error fetching assistants");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    navigate("/auth/login");
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-[1rem]">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center justify-center gap-[.3rem]">
          <Bot className="size-7" />
          <span className="text-[1.2rem] font-semibold">Buddy AI</span>
        </Link>

        <div className="hidden md:flex items-center justify-center gap-[3rem]">
          <Link
            to="/"
            className="text-[1rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/about"
            className="text-[1rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Enterprises
          </Link>
          <Link
            to="/contact"
            className="text-[1rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button
                variant="link"
                className="text-[1rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleAssistantsRedirect}
              >
                AI Assistants
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full hover:bg-muted px-2 py-1">
                    <IconUser className="h-5 w-5 text-muted-foreground" />
                    <span className="hidden sm:inline text-sm font-medium">
                      {user.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard/account")}>
                    <IconSettings className="mr-2 h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <IconLogout className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="link" size="sm" asChild>
                <Link to="/auth/login" className="!text-[1rem]">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth/register" className="!text-[1rem]">Try for free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
