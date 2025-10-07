import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSMSProviderSchema, type SMSProvider, type InsertSMSProvider } from "@shared/schema";
import { Plus, Trash2, Server, CheckCircle, RefreshCw, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const googleSheetSyncSchema = z.object({
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  range: z.string().optional(),
});

export default function Settings() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGoogleSheetDialogOpen, setIsGoogleSheetDialogOpen] = useState(false);
  const { toast } = useToast();

  const googleSheetForm = useForm({
    resolver: zodResolver(googleSheetSyncSchema),
    defaultValues: {
      spreadsheetId: "",
      range: "Sheet1!A2:F",
    },
  });

  const { data: providers = [] } = useQuery<SMSProvider[]>({
    queryKey: ["/api/sms-providers"],
  });

  const form = useForm<InsertSMSProvider>({
    resolver: zodResolver(insertSMSProviderSchema),
    defaultValues: {
      name: "",
      apiEndpoint: "",
      authMethod: "api_key",
      requestMethod: "POST",
      apiKey: "",
      username: "",
      password: "",
      sender: "",
      isActive: false,
    },
  });

  const authMethod = form.watch("authMethod");

  const createMutation = useMutation({
    mutationFn: async (data: InsertSMSProvider) => {
      return await apiRequest("POST", "/api/sms-providers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-providers"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Provider added successfully",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/sms-providers/${id}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-providers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sms-providers/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-providers"] });
      toast({
        title: "Success",
        description: "Provider deleted successfully",
      });
    },
  });

  const refreshBalanceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/sms-providers/${id}/refresh-balance`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-providers"] });
      toast({
        title: "Success",
        description: "Balance refreshed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh balance",
        variant: "destructive",
      });
    },
  });

  const syncGoogleSheetMutation = useMutation({
    mutationFn: async (data: { spreadsheetId: string; range?: string }) => {
      return await apiRequest("POST", "/api/members/sync-google-sheet", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setIsGoogleSheetDialogOpen(false);
      googleSheetForm.reset();
      toast({
        title: "Success",
        description: `Synced ${data.count} members from Google Sheets`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync with Google Sheets",
        variant: "destructive",
      });
    },
  });

  const addPresetProvider = (preset: "bulksms" | "nigeriabulksms") => {
    if (preset === "bulksms") {
      form.reset({
        name: "BulkSMSNigeria",
        apiEndpoint: "https://www.bulksmsnigeria.com/api/v1/sms/create",
        authMethod: "api_key",
        requestMethod: "POST",
        apiKey: "",
        username: "",
        password: "",
        sender: "YourChurch",
        isActive: false,
      });
    } else {
      form.reset({
        name: "NigeriaBulkSMS",
        apiEndpoint: "https://www.nigeriabulksms.com/api/",
        authMethod: "username_password",
        requestMethod: "GET",
        apiKey: "",
        username: "",
        password: "",
        sender: "YourChurch",
        isActive: false,
      });
    }
    setIsAddDialogOpen(true);
  };

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
                Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Configure SMS providers and application settings
              </p>
            </div>
            <Button onClick={() => setIsGoogleSheetDialogOpen(true)} data-testid="button-sync-google-sheet">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Sync Google Sheets
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover-elevate" onClick={() => addPresetProvider("bulksms")}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">BulkSMSNigeria (Preset)</CardTitle>
              <CardDescription>POST method with API token authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge className="bg-chart-3 text-white">POST</Badge>
                <Badge variant="outline">API Key</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover-elevate" onClick={() => addPresetProvider("nigeriabulksms")}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">NigeriaBulkSMS (Preset)</CardTitle>
              <CardDescription>GET method with username/password authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge className="bg-chart-2 text-white">GET</Badge>
                <Badge variant="outline">Username/Password</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold font-['Poppins']">
                Configured Providers
              </CardTitle>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-provider">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Provider
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {providers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-providers">
                No providers configured yet. Add a preset or custom provider to get started.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {providers.map((provider) => (
                  <AccordionItem key={provider.id} value={provider.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <Server className="h-5 w-5 text-chart-1" />
                        <div className="text-left flex-1">
                          <p className="font-semibold">{provider.name}</p>
                          <p className="text-sm text-muted-foreground">{provider.apiEndpoint}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {provider.isActive && (
                            <Badge className="bg-chart-3 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          <Badge className={provider.requestMethod === "POST" ? "bg-chart-3 text-white" : "bg-chart-2 text-white"}>
                            {provider.requestMethod}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Authentication Method</p>
                            <Badge variant="outline">
                              {provider.authMethod === "api_key" ? "API Key" : "Username/Password"}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Request Method</p>
                            <Badge variant="outline">{provider.requestMethod}</Badge>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Current Balance</p>
                              <p className="font-semibold text-chart-3" data-testid={`text-balance-${provider.id}`}>
                                {provider.balance || 'Not checked yet'}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Last Checked</p>
                              <p className="text-sm" data-testid={`text-last-checked-${provider.id}`}>
                                {provider.lastBalanceCheck 
                                  ? new Date(provider.lastBalanceCheck).toLocaleString() 
                                  : 'Never'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refreshBalanceMutation.mutate(provider.id)}
                            disabled={refreshBalanceMutation.isPending}
                            data-testid={`button-refresh-balance-${provider.id}`}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshBalanceMutation.isPending ? 'animate-spin' : ''}`} />
                            {provider.balance ? 'Refresh Balance' : 'Check Balance'}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={provider.isActive}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: provider.id, isActive: checked })
                              }
                              data-testid={`switch-provider-${provider.id}`}
                            />
                            <span className="text-sm">Active</span>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(provider.id)}
                            data-testid={`button-delete-provider-${provider.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-['Poppins']">Add SMS Provider</DialogTitle>
              <DialogDescription>
                Configure a new SMS provider with your credentials
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My SMS Provider" {...field} data-testid="input-provider-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiEndpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Endpoint</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.example.com/sms" {...field} data-testid="input-api-endpoint" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requestMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-request-method">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="GET">GET</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="authMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authentication</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-auth-method">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="api_key">API Key</SelectItem>
                            <SelectItem value="username_password">Username/Password</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {authMethod === "api_key" ? (
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="your-api-key" {...field} value={field.value || ""} data-testid="input-api-key" />
                        </FormControl>
                        <FormDescription>Your API key will be stored securely</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} value={field.value || ""} data-testid="input-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="password" {...field} value={field.value || ""} data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="sender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sender Name/ID</FormLabel>
                      <FormControl>
                        <Input placeholder="YourChurch" {...field} value={field.value || ""} data-testid="input-sender" />
                      </FormControl>
                      <FormDescription>
                        The name or ID that will appear as the sender of your SMS messages
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Set as Active Provider</FormLabel>
                        <FormDescription>
                          This provider will be used for sending SMS messages
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-provider">
                    {createMutation.isPending ? "Adding..." : "Add Provider"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isGoogleSheetDialogOpen} onOpenChange={setIsGoogleSheetDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Sync Members from Google Sheets</DialogTitle>
              <DialogDescription>
                Import members from your Google Sheet. Make sure the sheet has columns: Name, Phone, Department, Gender, Status, Birthday.
              </DialogDescription>
            </DialogHeader>
            <Form {...googleSheetForm}>
              <form onSubmit={googleSheetForm.handleSubmit((data) => syncGoogleSheetMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={googleSheetForm.control}
                  name="spreadsheetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spreadsheet ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1a2b3c4d5e6f..." 
                          {...field} 
                          data-testid="input-spreadsheet-id" 
                        />
                      </FormControl>
                      <FormDescription>
                        Found in the URL: docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={googleSheetForm.control}
                  name="range"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sheet Range (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Sheet1!A2:F" 
                          {...field} 
                          data-testid="input-sheet-range" 
                        />
                      </FormControl>
                      <FormDescription>
                        Default: Sheet1!A2:F (starts from row 2 to skip headers)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsGoogleSheetDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={syncGoogleSheetMutation.isPending} data-testid="button-confirm-sync">
                    {syncGoogleSheetMutation.isPending ? "Syncing..." : "Sync Members"}
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
