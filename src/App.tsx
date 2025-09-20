

import RootLayout from "./dashboard/workspace/layout";

import { Button } from "./components/ui/button"
import { Card, CardContent } from "./components/ui/card"
import { ArrowRight, Sparkles, Zap, Target } from "lucide-react"

export default function Home() {
  return (
    <RootLayout>
      <div className="min-h-screen">
      <main className="relative">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-400 to-pink-500 blur-3xl opacity-20" /> */}
          <div className="relative container mx-auto px-4 py-24 text-center">
             <div className="inline-flex items-center px-6 py-2 mb-6 text-sm font-semibold text-gray-700 bg-white rounded-full shadow-sm shadow-purple-300 border">
                 ✨ Introducing Buddy AI
            </div>

            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance">
              Your AI Buddy for Everyday{" "}
              <span className="bg-gradient-to-r from-purple-500 to-accent bg-clip-text text-transparent">Tasks</span>
            </h1>

            <p className="mt-8 max-w-2xl mx-auto text-xl text-muted-foreground leading-relaxed text-pretty">
              Whether it's planning, learning, or creating, this assistant is ready to help you turn ideas into action.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg font-semibold">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg bg-transparent">
                Watch Demo
              </Button>
            </div>

            <div className="relative mt-20">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-[10rem] opacity-30" />
              <div className="relative rounded-2xl border shadow-2xl overflow-hidden max-w-5xl mx-auto backdrop-blur-sm">
                <video src="/BuddyAI.mp4" className="w-full h-auto object-contain" autoPlay loop muted playsInline />
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
          <div className="relative container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Build and launch your AI-powered solutions in just three simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  step: "1",
                  icon: <Target className="h-8 w-8" />,
                  title: "Create a Workspace",
                  desc: "Set up a workspace to organize and manage all your campaigns in one place.",
                  gradient: "from-primary/20 to-primary/5",
                },
                {
                  step: "2",
                  icon: <Zap className="h-8 w-8" />,
                  title: "Customize Your Ads",
                  desc: "Upload images, videos, and copy — then watch AI craft high-performing banners.",
                  gradient: "from-accent/20 to-accent/5",
                },
                {
                  step: "3",
                  icon: <ArrowRight className="h-8 w-8" />,
                  title: "Launch & Download",
                  desc: "Publish or download your creatives instantly and start driving conversions.",
                  gradient: "from-primary/15 to-accent/15",
                },
              ].map(({ step, icon, title, desc, gradient }) => (
                <Card
                  key={step}
                  className="relative group hover:border-[2px] transition-all duration-300 border bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
                >
                  <CardContent className="relative p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-primary-foreground text-2xl font-bold mb-6 shadow-lg">
                      {icon}
                    </div>
                    <h3 className="text-xl font-semibold text-card-foreground mb-4">{title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 relative">
          <div className="relative container mx-auto px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Join thousands of users who are already boosting their productivity with AI assistance.
              </p>
              <Button size="lg" className="px-12 py-6 text-lg font-semibold">
                Start Your Journey
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
    </RootLayout>
  )
}

