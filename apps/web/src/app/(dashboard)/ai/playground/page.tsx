"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send } from "lucide-react";

export default function AIPlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setMessages((prev) => [...prev, { role: "assistant", content: `Simulated response to: "${prompt}"` }]);
    setPrompt("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Playground</h1>
        <p className="text-sm text-muted-foreground">Test AI models and prompts</p>
      </div>

      <Card className="flex flex-col h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4" /> Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              Send a message to test the AI model
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-lg px-4 py-2 max-w-[80%] text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
        </CardContent>
        <div className="border-t p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your prompt..."
              className="flex-1"
            />
            <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
