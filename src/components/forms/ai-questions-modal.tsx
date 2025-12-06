"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Question {
  title: string;
  question: string;
  description?: string;
}

interface Contact {
  id: string;
  name: string;
  lastName?: string;
  email?: string;
}

interface AIQuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  contacts: Contact[];
  currentUserId?: string;
  currentUserName?: string;
  onQuestionsCreated?: () => void;
}

export function AIQuestionsModal({
  open,
  onOpenChange,
  leadId,
  contacts,
  currentUserId,
  currentUserName,
  onQuestionsCreated,
}: AIQuestionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [assignments, setAssignments] = useState<Record<number, string>>({});

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuestions([]);
      setSelectedQuestions(new Set());
      setAssignments({});
    }
  }, [open]);

  const generateQuestions = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/generate-questions`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate questions");
      }

      const data = await response.json();
      setQuestions(data.questions || []);
      // Start with no questions selected - user must manually select
      setSelectedQuestions(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleQuestion = (index: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
      // Remove assignment if question is deselected
      const newAssignments = { ...assignments };
      delete newAssignments[index];
      setAssignments(newAssignments);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  const handleAssignChange = (index: number, contactId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [index]: contactId,
    }));
  };

  const handleSubmit = async () => {
    if (selectedQuestions.size === 0) {
      toast.error("Please select at least one question");
      return;
    }

    // Check if all selected questions have assignments
    const unassigned = Array.from(selectedQuestions).filter(
      (index) => !assignments[index]
    );
    if (unassigned.length > 0) {
      toast.error("Please assign all selected questions to a contact or yourself");
      return;
    }

    setLoading(true);
    try {
    const tasksToCreate = Array.from(selectedQuestions).map((index) => {
      const assignment = assignments[index];
      return {
        title: questions[index].title,
        question: questions[index].question,
        description: questions[index].description || null,
        assignedToContactId: assignment === "self" || !assignment ? null : assignment,
      };
    });

      const response = await fetch(`/api/leads/${leadId}/tasks/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: tasksToCreate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tasks");
      }

      const result = await response.json();
      
      toast.success(`Created ${result.count || tasksToCreate.length} task(s) successfully`);
      
      // Reset state first
      setQuestions([]);
      setSelectedQuestions(new Set());
      setAssignments({});
      
      // Close modal immediately
      onOpenChange(false);
      
      // Call callback to refresh data
      if (onQuestionsCreated) {
        onQuestionsCreated();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Generated Questions
          </DialogTitle>
          <DialogDescription>
            Review and select questions to create as tasks. Assign each question to a contact or yourself.
          </DialogDescription>
        </DialogHeader>

        {generating ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating questions with AI...</p>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No questions generated yet.</p>
            <Button onClick={generateQuestions} className="mt-4" variant="outline">
              Generate Questions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border ${
                  selectedQuestions.has(index)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedQuestions.has(index)}
                    onCheckedChange={() => handleToggleQuestion(index)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="text-sm font-medium">{question.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {question.question}
                      </p>
                      {question.description && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {question.description}
                        </p>
                      )}
                    </div>
                    {selectedQuestions.has(index) && (
                      <div className="pt-2 border-t">
                        <label className="text-xs font-medium mb-1.5 block">
                          Assign to:
                        </label>
                        <Select
                          value={assignments[index] || ""}
                          onValueChange={(value) => handleAssignChange(index, value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select contact or yourself" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentUserId && currentUserName && (
                              <SelectItem value="self">
                                {currentUserName} (Myself)
                              </SelectItem>
                            )}
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.name} {contact.lastName || ""}
                                {contact.email && ` (${contact.email})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || generating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || generating || selectedQuestions.size === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Tasks...
              </>
            ) : (
              `Create ${selectedQuestions.size} Task(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

