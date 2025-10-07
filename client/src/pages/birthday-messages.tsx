import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBirthdayMessageSchema, type BirthdayMessage, type InsertBirthdayMessage } from "@shared/schema";
import { Plus, Pencil, Trash2, Send, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function BirthdayMessages() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<BirthdayMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { data: user } = useQuery<{ id: string; username: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: messages = [] } = useQuery<BirthdayMessage[]>({
    queryKey: ["/api/birthday-messages"],
  });

  const form = useForm<InsertBirthdayMessage>({
    resolver: zodResolver(insertBirthdayMessageSchema),
    defaultValues: {
      message: "",
      isActive: false,
    },
  });

  const messageContent = form.watch("message");
  const messageLength = messageContent?.length || 0;

  const isAdmin = user?.role === "Admin";

  const createMutation = useMutation({
    mutationFn: async (data: InsertBirthdayMessage) => {
      return await apiRequest("POST", "/api/birthday-messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/birthday-messages"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Birthday message created successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertBirthdayMessage }) => {
      return await apiRequest("PATCH", `/api/birthday-messages/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/birthday-messages"] });
      setSelectedMessage(null);
      toast({
        title: "Success",
        description: "Birthday message updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/birthday-messages/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/birthday-messages"] });
      toast({
        title: "Success",
        description: "Birthday message deleted successfully",
      });
    },
  });

  const handleSendBirthdayMessages = async () => {
    setIsSending(true);
    try {
      const result: any = await apiRequest("POST", "/api/birthday-check", undefined);
      toast({
        title: "Birthday Messages Sent",
        description: `Sent: ${result.sent || 0}, Skipped: ${result.skipped || 0}, Failed: ${result.failed || 0}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send birthday messages",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const previewMessage = (content: string) => {
    return content.replace(/{{name}}/g, "John");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Birthday Messages
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage automated birthday message templates for church members
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button
                    onClick={handleSendBirthdayMessages}
                    disabled={isSending}
                    data-testid="button-send-birthday-messages"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? "Sending..." : "Send Birthday Messages"}
                  </Button>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    variant="outline"
                    data-testid="button-add-message"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Message
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full glass-card shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                      {message.isActive && (
                        <Badge className="bg-chart-3 text-white">
                          Active
                        </Badge>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            form.reset({
                              message: message.message,
                              isActive: message.isActive,
                            });
                            setSelectedMessage(message);
                          }}
                          data-testid={`button-edit-message-${message.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(message.id)}
                          data-testid={`button-delete-message-${message.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Template</p>
                      <p className="text-sm text-foreground font-mono bg-muted p-2 rounded">
                        {message.message}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Preview</p>
                      <p className="text-sm text-foreground bg-accent/30 p-2 rounded">
                        {previewMessage(message.message)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Character count</span>
                      <Badge variant={message.message.length > 160 ? "destructive" : "outline"}>
                        {message.message.length} chars
                      </Badge>
                    </div>
                    {message.message.length > 160 && (
                      <p className="text-xs text-destructive">
                        Messages over 160 characters may be split into multiple SMS
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {messages.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Birthday Messages
              </h3>
              <p className="text-muted-foreground mb-4">
                {isAdmin
                  ? "Create your first birthday message template to get started"
                  : "No birthday messages have been configured yet"}
              </p>
              {isAdmin && (
                <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-message-empty">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Message
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog
          open={isAddDialogOpen || selectedMessage !== null}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setSelectedMessage(null);
              form.reset();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedMessage ? "Edit Birthday Message" : "Add Birthday Message"}
              </DialogTitle>
              <DialogDescription>
                Create a birthday message template. Use {'{{name}}'} as a placeholder for the member's first name.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => {
                  if (selectedMessage) {
                    updateMutation.mutate({ id: selectedMessage.id, data });
                  } else {
                    createMutation.mutate(data);
                  }
                })}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Happy Birthday {{name}}! May God bless you abundantly on your special day."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="input-birthday-message"
                        />
                      </FormControl>
                      <div className="flex items-center justify-between">
                        <FormDescription>
                          Use {'{{name}}'} to insert the member's first name
                        </FormDescription>
                        <Badge variant={messageLength > 160 ? "destructive" : "outline"}>
                          {messageLength} / 160 chars
                        </Badge>
                      </div>
                      {messageLength > 160 && (
                        <p className="text-xs text-destructive">
                          Warning: Messages over 160 characters may be split into multiple SMS
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-message-active"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Set as Active Message</FormLabel>
                        <FormDescription>
                          Only one message can be active at a time. Setting this as active will deactivate other messages.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div>
                  <p className="text-sm font-medium mb-2">Preview</p>
                  <div className="bg-accent/30 p-3 rounded">
                    <p className="text-sm text-foreground">
                      {previewMessage(messageContent || "Your message preview will appear here...")}
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setSelectedMessage(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-birthday-message"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-birthday-message"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : selectedMessage
                      ? "Update Message"
                      : "Create Message"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
