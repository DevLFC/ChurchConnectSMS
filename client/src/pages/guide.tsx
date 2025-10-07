import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Guide() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const nodejsPostExample = `// Node.js - BulkSMSNigeria (POST with API Key)
const axios = require('axios');

async function sendSMS(recipient, message) {
  const config = {
    method: 'post',
    url: 'https://www.bulksmsnigeria.com/api/v1/sms/create',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY_HERE'
    },
    data: {
      from: 'YourChurch',
      to: recipient,
      body: message,
      dnd: '2'
    }
  };

  try {
    const response = await axios(config);
    console.log('SMS sent successfully:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Failed to send SMS:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Usage example
sendSMS('+2348012345678', 'Thank you for attending our service today!');`;

  const nodejsGetExample = `// Node.js - NigeriaBulkSMS (GET with Username/Password)
const axios = require('axios');

async function sendSMS(recipient, message) {
  const params = {
    username: 'YOUR_USERNAME',
    password: 'YOUR_PASSWORD',
    sender: 'YourChurch',
    message: message,
    mobiles: recipient
  };

  const config = {
    method: 'get',
    url: 'https://www.nigeriabulksms.com/api/',
    params: params
  };

  try {
    const response = await axios(config);
    console.log('SMS sent successfully:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Failed to send SMS:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Usage example
sendSMS('+2348012345678', 'We missed you at our service today!');`;

  const djangoPostExample = `# Django - BulkSMSNigeria (POST with API Key)
import requests
import json
from django.conf import settings

def send_sms(recipient, message):
    """
    Send SMS using BulkSMSNigeria API
    """
    url = "https://www.bulksmsnigeria.com/api/v1/sms/create"
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {settings.BULKSMS_API_KEY}'
    }
    
    payload = {
        'from': 'YourChurch',
        'to': recipient,
        'body': message,
        'dnd': '2'
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print(f'SMS sent successfully: {response.json()}')
        return {'success': True, 'data': response.json()}
    except requests.exceptions.RequestException as e:
        print(f'Failed to send SMS: {str(e)}')
        return {'success': False, 'error': str(e)}

# Usage in views.py
from .sms_utils import send_sms

def send_attendance_sms(request):
    # Example usage
    result = send_sms(
        recipient='+2348012345678',
        message='Thank you for attending our service today!'
    )
    return JsonResponse(result)`;

  const djangoGetExample = `# Django - NigeriaBulkSMS (GET with Username/Password)
import requests
from django.conf import settings
from urllib.parse import urlencode

def send_sms(recipient, message):
    """
    Send SMS using NigeriaBulkSMS API
    """
    base_url = "https://www.nigeriabulksms.com/api/"
    
    params = {
        'username': settings.NIGERIABULKSMS_USERNAME,
        'password': settings.NIGERIABULKSMS_PASSWORD,
        'sender': 'YourChurch',
        'message': message,
        'mobiles': recipient
    }
    
    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        print(f'SMS sent successfully: {response.text}')
        return {'success': True, 'data': response.text}
    except requests.exceptions.RequestException as e:
        print(f'Failed to send SMS: {str(e)}')
        return {'success': False, 'error': str(e)}

# Usage in views.py
from .sms_utils import send_sms

def send_followup_sms(request):
    # Example usage
    result = send_sms(
        recipient='+2348012345678',
        message='We missed you at our service today!'
    )
    return JsonResponse(result)`;

  const expressExample = `// Express.js Backend Integration
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Send SMS endpoint
router.post('/api/send-sms', async (req, res) => {
  const { recipients, message, providerId } = req.body;
  
  // Fetch provider config from database
  const provider = await getProviderById(providerId);
  
  const results = [];
  
  for (const recipient of recipients) {
    try {
      let response;
      
      if (provider.requestMethod === 'POST') {
        // POST method (BulkSMSNigeria)
        response = await axios.post(
          provider.apiEndpoint,
          {
            from: 'YourChurch',
            to: recipient.phone,
            body: message,
            dnd: '2'
          },
          {
            headers: {
              'Authorization': \`Bearer \${provider.apiKey}\`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // GET method (NigeriaBulkSMS)
        response = await axios.get(provider.apiEndpoint, {
          params: {
            username: provider.username,
            password: provider.password,
            sender: 'YourChurch',
            message: message,
            mobiles: recipient.phone
          }
        });
      }
      
      // Log success
      await logSMS({
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        message: message,
        providerId: providerId,
        status: 'Sent',
        deliveryStatus: 'Delivered'
      });
      
      results.push({ success: true, recipient: recipient.name });
    } catch (error) {
      // Log failure
      await logSMS({
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        message: message,
        providerId: providerId,
        status: 'Failed',
        deliveryStatus: error.message
      });
      
      results.push({ success: false, recipient: recipient.name, error: error.message });
    }
  }
  
  res.json({ results });
});

module.exports = router;`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-foreground">
            Implementation Guide
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete backend code examples for integrating SMS APIs
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Overview
            </CardTitle>
            <CardDescription className="text-base">
              This guide provides production-ready code examples for integrating SMS providers
              into your backend. SMS sending requires server-side implementation for security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-chart-1 mt-2" />
                <div>
                  <p className="font-medium">Server-side only</p>
                  <p className="text-sm text-muted-foreground">
                    Never expose API keys in frontend code. All SMS sending must happen on your backend.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-chart-2 mt-2" />
                <div>
                  <p className="font-medium">Multiple authentication methods</p>
                  <p className="text-sm text-muted-foreground">
                    Support for both API key authentication (POST) and username/password (GET).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-chart-3 mt-2" />
                <div>
                  <p className="font-medium">Error handling and logging</p>
                  <p className="text-sm text-muted-foreground">
                    Track delivery status and handle failures gracefully.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Provider Examples
            </CardTitle>
            <CardDescription>
              Choose your backend framework and provider type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="nodejs" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nodejs">Node.js / Express</TabsTrigger>
                <TabsTrigger value="django">Django / Python</TabsTrigger>
              </TabsList>

              <TabsContent value="nodejs" className="space-y-6 mt-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        BulkSMSNigeria - POST Method
                      </h3>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-chart-3 text-white">POST</Badge>
                        <Badge variant="outline">API Key Auth</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(nodejsPostExample, "nodejs-post")}
                    >
                      {copiedCode === "nodejs-post" ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copiedCode === "nodejs-post" ? "Copied!" : "Copy Code"}
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{nodejsPostExample}</code>
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        NigeriaBulkSMS - GET Method
                      </h3>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-chart-2 text-white">GET</Badge>
                        <Badge variant="outline">Username/Password</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(nodejsGetExample, "nodejs-get")}
                    >
                      {copiedCode === "nodejs-get" ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copiedCode === "nodejs-get" ? "Copied!" : "Copy Code"}
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{nodejsGetExample}</code>
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Express Backend Integration
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(expressExample, "express")}
                    >
                      {copiedCode === "express" ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copiedCode === "express" ? "Copied!" : "Copy Code"}
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{expressExample}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="django" className="space-y-6 mt-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        BulkSMSNigeria - POST Method
                      </h3>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-chart-3 text-white">POST</Badge>
                        <Badge variant="outline">API Key Auth</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(djangoPostExample, "django-post")}
                    >
                      {copiedCode === "django-post" ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copiedCode === "django-post" ? "Copied!" : "Copy Code"}
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{djangoPostExample}</code>
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        NigeriaBulkSMS - GET Method
                      </h3>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-chart-2 text-white">GET</Badge>
                        <Badge variant="outline">Username/Password</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(djangoGetExample, "django-get")}
                    >
                      {copiedCode === "django-get" ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {copiedCode === "django-get" ? "Copied!" : "Copy Code"}
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{djangoGetExample}</code>
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Environment Variables
            </CardTitle>
            <CardDescription>
              Store your API credentials securely in environment variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm">
{`# .env file
BULKSMS_API_KEY=your_api_key_here
NIGERIABULKSMS_USERNAME=your_username
NIGERIABULKSMS_PASSWORD=your_password`}
              </pre>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Never commit your .env file to version control. Add it to .gitignore.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-1 text-white text-sm font-semibold">
                  1
                </span>
                <div>
                  <p className="font-medium">Get API credentials</p>
                  <p className="text-sm text-muted-foreground">
                    Sign up for an account with your chosen SMS provider
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-2 text-white text-sm font-semibold">
                  2
                </span>
                <div>
                  <p className="font-medium">Implement backend endpoint</p>
                  <p className="text-sm text-muted-foreground">
                    Copy the appropriate code example and adapt to your backend
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-3 text-white text-sm font-semibold">
                  3
                </span>
                <div>
                  <p className="font-medium">Test with small batches</p>
                  <p className="text-sm text-muted-foreground">
                    Start with a few test numbers before sending to your full congregation
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-4 text-white text-sm font-semibold">
                  4
                </span>
                <div>
                  <p className="font-medium">Monitor delivery status</p>
                  <p className="text-sm text-muted-foreground">
                    Use the SMS History page to track successful and failed deliveries
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
