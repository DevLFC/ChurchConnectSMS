import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSMSTemplateSchema, type SMSTemplate, type InsertSMSTemplate } from "@shared/schema";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Templates() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<SMSTemplate[]>({
    queryKey: ["/api/sms-templates"],
  });

  const form = useForm<InsertSMSTemplate>({
    resolver: zodResolver(insertSMSTemplateSchema),
    defaultValues: {
      name: "",
      category: "Present",
      content: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSMSTemplate) => {
      return await apiRequest("POST", "/api/sms-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertSMSTemplate }) => {
      return await apiRequest("PUT", `/api/sms-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      setSelectedTemplate(null);
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sms-templates/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
  });

  const insertPlaceholder = (placeholder: string) => {
    const currentContent = form.getValues("content") || "";
    form.setValue("content", currentContent + `{{${placeholder}}}`);
  };

  const previewTemplate = (content: string) => {
    return content
      .replace(/{{name}}/g, "John")
      .replace(/{{department}}/g, "Choir")
      .replace(/{{phone}}/g, "+234123456789");
  };

  const presentTemplates = templates.filter((t) => t.category === "Present");
  const absentTemplates = templates.filter((t) => t.category === "Absent");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground font-['Poppins']">
                SMS Templates
              </h1>
              <p className="text-muted-foreground mt-2">
                Create and manage SMS message templates
              </p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-create-template">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </motion.div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground font-['Poppins'] mb-4">
              Present Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presentTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold truncate">
                            {template.name}
                          </CardTitle>
                          <Badge className="mt-2 bg-chart-3 text-white">
                            {template.category}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              form.reset({
                                name: template.name,
                                category: template.category,
                                content: template.content,
                              });
                              setSelectedTemplate(template);
                            }}
                            data-testid={`button-edit-template-${template.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(template.id)}
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Template</p>
                          <p className="text-sm text-foreground font-mono bg-muted p-2 rounded">
                            {template.content}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Preview</p>
                          <p className="text-sm text-foreground bg-accent/30 p-2 rounded">
                            {previewTemplate(template.content)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            {presentTemplates.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-present-templates">
                  No present templates created yet
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground font-['Poppins'] mb-4">
              Absent Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {absentTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold truncate">
                            {template.name}
                          </CardTitle>
                          <Badge className="mt-2 bg-chart-4 text-white">
                            {template.category}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              form.reset({
                                name: template.name,
                                category: template.category,
                                content: template.content,
                              });
                              setSelectedTemplate(template);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(template.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Template</p>
                          <p className="text-sm text-foreground font-mono bg-muted p-2 rounded">
                            {template.content}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Preview</p>
                          <p className="text-sm text-foreground bg-accent/30 p-2 rounded">
                            {previewTemplate(template.content)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            {absentTemplates.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground" data-testid="text-no-absent-templates">
                  No absent templates created yet
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={isAddDialogOpen || selectedTemplate !== null} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setSelectedTemplate(null);
            form.reset();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-['Poppins']">
                {selectedTemplate ? "Edit Template" : "Create Template"}
              </DialogTitle>
              <DialogDescription>
                Create a customizable SMS template with placeholders
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => {
                  if (selectedTemplate) {
                    updateMutation.mutate({ id: selectedTemplate.id, data });
                  } else {
                    createMutation.mutate(data);
                  }
                })}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Welcome Message" {...field} data-testid="input-template-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-template-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Present">Present</SelectItem>
                          <SelectItem value="Absent">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dear {{name}}, thank you for attending..."
                          className="min-h-[120px] font-mono"
                          {...field}
                          data-testid="input-template-content"
                        />
                      </FormControl>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertPlaceholder("name")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Insert Name
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertPlaceholder("department")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Insert Department
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertPlaceholder("phone")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Insert Phone
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("content") && (
                  <div>
                    <p className="text-sm font-medium mb-2">Preview</p>
                    <div className="bg-accent/30 p-3 rounded text-sm">
                      {previewTemplate(form.watch("content"))}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setSelectedTemplate(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-template"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : selectedTemplate
                      ? "Update Template"
                      : "Create Template"}
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
