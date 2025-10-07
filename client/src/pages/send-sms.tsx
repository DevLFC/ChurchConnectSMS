import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Send, Users, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Member, SMSTemplate, SMSProvider } from "@shared/schema";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function SendSMS() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [attendanceType, setAttendanceType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: templates = [] } = useQuery<SMSTemplate[]>({
    queryKey: ["/api/sms-templates"],
  });

  const { data: providers = [] } = useQuery<SMSProvider[]>({
    queryKey: ["/api/sms-providers"],
  });

  const activeProviders = providers.filter((p) => p.isActive);
  const activeMembers = members.filter((m) => m.status === "Active");
  
  const filteredMembers = activeMembers.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.phone.toLowerCase().includes(query) ||
      member.department.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recipientIds = params.get("recipients");
    const type = params.get("type");
    
    if (recipientIds && members.length > 0) {
      const ids = recipientIds.split(",");
      setSelectedMembers(new Set(ids));
      setAttendanceType(type);
      
      if (type === "present") {
        setMessage("Thank you for joining us today! We appreciate your presence in our service. God bless you!");
      } else if (type === "absent") {
        setMessage("We missed you in service today! We hope to see you soon. Stay blessed!");
      }
      
      toast({
        title: "Recipients Auto-Selected",
        description: `${ids.length} ${type || "member"}${ids.length > 1 ? "s" : ""} have been selected from attendance`,
      });
    }
  }, [members, toast]);

  const sendSMSMutation = useMutation({
    mutationFn: async (data: { recipients: string[]; message: string; providerId: string; templateId?: string }) => {
      const response = await apiRequest("POST", "/api/send-sms", data);
      return await response.json();
    },
    onSuccess: (data) => {
      const successCount = data.results.filter((r: any) => r.success).length;
      const failCount = data.results.filter((r: any) => !r.success).length;
      
      queryClient.invalidateQueries({ queryKey: ["/api/sms-logs"] });
      setSelectedMembers(new Set());
      setMessage("");
      
      toast({
        title: "SMS Sent",
        description: `Successfully sent ${successCount} message(s). ${failCount > 0 ? `${failCount} failed.` : ""}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send SMS",
        variant: "destructive",
      });
    },
  });

  const handleTemplateChange = (templateId: string) => {
    if (templateId === "_none") {
      setSelectedTemplate("");
      setMessage("");
      return;
    }
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMessage(template.content);
    }
  };

  const toggleMember = (memberId: string) => {
    const newSet = new Set(selectedMembers);
    if (newSet.has(memberId)) {
      newSet.delete(memberId);
    } else {
      newSet.add(memberId);
    }
    setSelectedMembers(newSet);
  };

  const toggleAll = () => {
    if (selectedMembers.size === filteredMembers.length && filteredMembers.length > 0) {
      const currentFilteredIds = new Set(filteredMembers.map(m => m.id));
      const newSelected = new Set(selectedMembers);
      currentFilteredIds.forEach(id => newSelected.delete(id));
      setSelectedMembers(newSelected);
    } else {
      const newSelected = new Set(selectedMembers);
      filteredMembers.forEach(m => newSelected.add(m.id));
      setSelectedMembers(newSelected);
    }
  };

  const handleSend = () => {
    if (selectedMembers.size === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "No Message",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProvider) {
      toast({
        title: "No Provider",
        description: "Please select an SMS provider",
        variant: "destructive",
      });
      return;
    }

    sendSMSMutation.mutate({
      recipients: Array.from(selectedMembers),
      message,
      providerId: selectedProvider,
      templateId: selectedTemplate || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Send SMS
              </h1>
              <p className="text-muted-foreground mt-2">
                Send bulk SMS messages to your church members
              </p>
            </div>
            {attendanceType && (
              <Badge variant="secondary" className="text-sm">
                Auto-selected from attendance: {attendanceType === "present" ? "Present Members" : "Absent Members"}
              </Badge>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card shadow-soft">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Compose Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Template (Optional)
                  </label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger data-testid="select-template">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No template</SelectItem>
                      {templates.filter(t => t.id).map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    SMS Provider
                  </label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger data-testid="select-provider">
                      <SelectValue placeholder="Select a provider..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProviders.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          No active providers
                        </SelectItem>
                      ) : (
                        activeProviders.filter(p => p.id).map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Message
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message here... Use {{name}} (first name), {{department}}, {{phone}} for personalization"
                    className="min-h-[200px]"
                    data-testid="textarea-message"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Characters: {message.length} | Estimated SMS: {Math.ceil(message.length / 160)}
                  </p>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={sendSMSMutation.isPending || selectedMembers.size === 0}
                  className="w-full"
                  data-testid="button-send-sms"
                >
                  {sendSMSMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to {selectedMembers.size} Recipient(s)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">
                    Recipients ({selectedMembers.size})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAll}
                    data-testid="button-toggle-all"
                  >
                    {filteredMembers.every(m => selectedMembers.has(m.id)) && filteredMembers.length > 0 ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, phone, or department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-recipients"
                    />
                  </div>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {activeMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-active-members">
                      No active members available
                    </p>
                  ) : filteredMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-results">
                      No members found matching "{searchQuery}"
                    </p>
                  ) : (
                    filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3 p-3 rounded-md hover-elevate active-elevate-2 cursor-pointer"
                        onClick={() => toggleMember(member.id)}
                        data-testid={`member-checkbox-${member.id}`}
                      >
                        <Checkbox
                          checked={selectedMembers.has(member.id)}
                          onCheckedChange={() => toggleMember(member.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.phone} • {member.department}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
