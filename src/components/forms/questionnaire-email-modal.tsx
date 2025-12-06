// @ts-nocheck
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface ContactQuestionnaire {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  questions: Array<{
    id: string;
    title: string;
    question: string;
    description?: string;
  }>;
}

interface QuestionnaireEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  opportunityTitle: string;
  companyName: string;
  contacts: ContactQuestionnaire[];
  onEmailsSent?: () => void;
}

export function QuestionnaireEmailModal({
  open,
  onOpenChange,
  leadId,
  opportunityTitle,
  companyName,
  contacts,
  onEmailsSent,
}: QuestionnaireEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [emailContent, setEmailContent] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      // Select all contacts by default
      setSelectedContacts(new Set(contacts.map((c) => c.id)));
      // Initialize email content with default template
      const defaultContent: Record<string, string> = {};
      contacts.forEach((contact) => {
        const questionsHtml = contact.questions
          .map(
            (q, index) => `
${index + 1}. ${q.title}
   ${q.question}
   ${q.description ? `   (${q.description})` : ""}
`
          )
          .join("\n");

        defaultContent[contact.id] = `Καλησπέρα ${contact.name}${contact.lastName ? ` ${contact.lastName}` : ""},

Σας ενημερώνουμε ότι για την ευκαιρία "${opportunityTitle}" της εταιρείας "${companyName}", χρειαζόμαστε τις απαντήσεις σας στις παρακάτω ερωτήσεις:

${questionsHtml}

Παρακαλούμε απαντήστε σε όλες τις ερωτήσεις με λεπτομέρεια. Οι απαντήσεις σας θα μας βοηθήσουν να προετοιμάσουμε μια πλήρη και ακριβή πρόταση για την ευκαιρία.

Ευχαριστούμε για τον χρόνο σας.

Με εκτίμηση,
Η Ομάδα`;
      });
      setEmailContent(defaultContent);
      setIsEditing({});
    }
  }, [open, contacts, opportunityTitle, companyName]);

  const handleToggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleEditContent = (contactId: string) => {
    setIsEditing((prev) => ({ ...prev, [contactId]: true }));
  };

  const handleSaveContent = (contactId: string) => {
    setIsEditing((prev) => ({ ...prev, [contactId]: false }));
  };

  const handleSendEmails = async () => {
    if (selectedContacts.size === 0) {
      toast.error("Please select at least one contact");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/questionnaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds: Array.from(selectedContacts),
          emailContent: emailContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send emails");
      }

      const result = await response.json();
      toast.success(`Sent ${result.sent} email(s) successfully`);
      onEmailsSent?.();
      onOpenChange(false);
      // Reset state
      setSelectedContacts(new Set());
      setEmailContent({});
      setIsEditing({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send emails");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Questionnaire Emails
          </DialogTitle>
          <DialogDescription>
            Review and edit the email content for each contact before sending. Each contact will receive all their assigned questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {contacts.map((contact) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                selectedContacts.has(contact.id)
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <Checkbox
                  checked={selectedContacts.has(contact.id)}
                  onCheckedChange={() => handleToggleContact(contact.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium">
                        {contact.name} {contact.lastName || ""}
                      </h4>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {contact.questions.length} question(s) assigned
                      </p>
                    </div>
                    {selectedContacts.has(contact.id) && !isEditing[contact.id] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditContent(contact.id)}
                        className="h-7 text-xs"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {selectedContacts.has(contact.id) && (
                    <div className="mt-3">
                      {isEditing[contact.id] ? (
                        <div className="space-y-2">
                          <Label className="text-xs">Email Content</Label>
                          <Textarea
                            value={emailContent[contact.id] || ""}
                            onChange={(e) =>
                              setEmailContent((prev) => ({
                                ...prev,
                                [contact.id]: e.target.value,
                              }))
                            }
                            className="min-h-[200px] text-xs font-mono"
                            placeholder="Email content..."
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveContent(contact.id)}
                            className="h-7 text-xs"
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-muted/30 p-3 rounded-md">
                          <pre className="text-xs whitespace-pre-wrap font-sans text-foreground">
                            {emailContent[contact.id] || "No content"}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmails}
            disabled={loading || selectedContacts.size === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send {selectedContacts.size} Email(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}






