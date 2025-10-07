import type { SMSProvider, Member } from "@shared/schema";

export interface SMSResult {
  success: boolean;
  processedMessage: string;
  error?: string;
  externalId?: string;
}

export class SMSService {
  private replaceTemplatePlaceholders(template: string, member: Member): string {
    const firstName = (member.name ?? "").trim().split(/\s+/)[0] || "";
    return template
      .replace(/\{\{name\}\}/g, firstName)
      .replace(/\{\{phone\}\}/g, member.phone || "")
      .replace(/\{\{department\}\}/g, member.department || "")
      .replace(/\{\{gender\}\}/g, member.gender || "")
      .replace(/\{\{status\}\}/g, member.status || "");
  }

  async sendSMS(
    provider: SMSProvider,
    recipient: Member,
    message: string
  ): Promise<SMSResult> {
    const processedMessage = this.replaceTemplatePlaceholders(message, recipient);

    try {
      if (provider.requestMethod === "POST") {
        const result = await this.sendPOST(provider, recipient.phone, processedMessage);
        return { ...result, processedMessage };
      } else {
        const result = await this.sendGET(provider, recipient.phone, processedMessage);
        return { ...result, processedMessage };
      }
    } catch (error) {
      return {
        success: false,
        processedMessage,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private async sendPOST(
    provider: SMSProvider,
    phone: string,
    message: string
  ): Promise<SMSResult> {
    const body: Record<string, any> = {
      to: phone,
      body: message,
    };

    if (provider.sender) {
      body.from = provider.sender;
    }

    if (provider.authMethod === "api_key" && provider.apiKey) {
      body.api_key = provider.apiKey;
    } else if (provider.authMethod === "username_password") {
      body.username = provider.username;
      body.password = provider.password;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (provider.authMethod === "api_key" && provider.apiKey) {
      headers["Authorization"] = `Bearer ${provider.apiKey}`;
    }

    const response = await fetch(provider.apiEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    let data: any;
    const contentType = response.headers.get("content-type");
    
    try {
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { rawResponse: text };
      }
    } catch (parseError) {
      const text = await response.text();
      data = { rawResponse: text };
    }

    if (!response.ok) {
      return {
        success: false,
        processedMessage: message,
        error: data.message || data.error || data.rawResponse || `HTTP ${response.status}: Failed to send SMS`,
      };
    }

    const responseText = data.rawResponse || JSON.stringify(data);
    
    const isSuccess = this.checkResponseSuccess(responseText, data);
    
    if (isSuccess) {
      let parsedData = data;
      if (data.rawResponse && typeof data.rawResponse === 'string') {
        try {
          parsedData = JSON.parse(data.rawResponse);
        } catch {
          parsedData = data;
        }
      }
      
      return {
        success: true,
        processedMessage: message,
        externalId: parsedData.message_id || parsedData.id || parsedData.messageId || this.extractMessageId(responseText) || "sent",
      };
    } else {
      return {
        success: false,
        processedMessage: message,
        error: this.extractErrorMessage(responseText, data),
      };
    }
  }

  private async sendGET(
    provider: SMSProvider,
    phone: string,
    message: string
  ): Promise<SMSResult> {
    const params = new URLSearchParams({
      mobiles: phone,
      message: message,
    });

    if (provider.sender) {
      params.append("sender", provider.sender);
    }

    if (provider.authMethod === "api_key" && provider.apiKey) {
      params.append("api_key", provider.apiKey);
    } else if (provider.authMethod === "username_password") {
      if (provider.username) params.append("username", provider.username);
      if (provider.password) params.append("password", provider.password);
    }

    const url = `${provider.apiEndpoint}?${params.toString()}`;
    console.log('\n========== SMS API REQUEST ==========');
    console.log('URL:', url.replace(/password=[^&]+/, 'password=***'));
    
    const response = await fetch(url);

    let data: any;
    const contentType = response.headers.get("content-type");
    
    try {
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { rawResponse: text };
      }
    } catch (parseError) {
      const text = await response.text();
      data = { rawResponse: text };
    }

    console.log('HTTP Status:', response.status, response.ok ? 'OK' : 'NOT OK');
    console.log('Content-Type:', contentType);
    console.log('Response Data:', data);
    console.log('Raw Response:', data.rawResponse || 'N/A');

    if (!response.ok) {
      console.log('❌ FAILURE: HTTP status not OK');
      console.log('========================================\n');
      return {
        success: false,
        processedMessage: message,
        error: data.message || data.error || data.rawResponse || `HTTP ${response.status}: Failed to send SMS`,
      };
    }

    const responseText = data.rawResponse || JSON.stringify(data);
    console.log('Response Text for Checking:', responseText);
    
    const isSuccess = this.checkResponseSuccess(responseText, data);
    console.log('Is Success?:', isSuccess);
    
    if (isSuccess) {
      let parsedData = data;
      if (data.rawResponse && typeof data.rawResponse === 'string') {
        try {
          parsedData = JSON.parse(data.rawResponse);
        } catch {
          parsedData = data;
        }
      }
      
      const messageId = parsedData.message_id || parsedData.id || parsedData.messageId || this.extractMessageId(responseText) || "sent";
      console.log('✅ SUCCESS - Message ID:', messageId);
      console.log('========================================\n');
      return {
        success: true,
        processedMessage: message,
        externalId: messageId,
      };
    } else {
      const error = this.extractErrorMessage(responseText, data);
      console.log('❌ FAILURE - Error:', error);
      console.log('========================================\n');
      return {
        success: false,
        processedMessage: message,
        error: error,
      };
    }
  }

  private checkResponseSuccess(responseText: string, data: any): boolean {
    const upperResponse = responseText.toUpperCase();
    
    if (upperResponse.includes("<!DOCTYPE") || upperResponse.includes("<HTML")) {
      return false;
    }
    
    let parsedData = data;
    if (data.rawResponse && typeof data.rawResponse === 'string') {
      try {
        parsedData = JSON.parse(data.rawResponse);
      } catch (e) {
        parsedData = data;
      }
    }
    
    if (parsedData.status === "OK" || parsedData.status === "success" || parsedData.success === true) {
      return true;
    }
    
    if (upperResponse.includes("INSUFFICIENT CREDIT") || 
        upperResponse.includes("INSUFFICIENT BALANCE") ||
        upperResponse.includes("LOW BALANCE") ||
        upperResponse.includes("NO CREDIT")) {
      return false;
    }
    
    if (upperResponse.includes("INVALID USERNAME") || 
        upperResponse.includes("INVALID PASSWORD") ||
        upperResponse.includes("AUTHENTICATION FAILED") ||
        upperResponse.includes("UNAUTHORIZED")) {
      return false;
    }
    
    if (upperResponse.includes("INVALID NUMBER") || 
        upperResponse.includes("INVALID PHONE") ||
        upperResponse.includes("INVALID RECIPIENT")) {
      return false;
    }
    
    if (upperResponse.startsWith("OK") || upperResponse.includes("SUCCESS")) {
      return true;
    }
    
    if (upperResponse.includes("ERROR") || upperResponse.includes("FAILED")) {
      return false;
    }
    
    return false;
  }

  private extractMessageId(responseText: string): string | null {
    if (responseText.includes("|")) {
      const parts = responseText.split("|");
      if (parts.length > 1 && parts[0].toUpperCase().includes("OK")) {
        return parts[1].trim();
      }
    }
    return null;
  }

  private extractErrorMessage(responseText: string, data: any): string {
    let parsedData = data;
    if (data.rawResponse && typeof data.rawResponse === 'string') {
      try {
        parsedData = JSON.parse(data.rawResponse);
      } catch {
        parsedData = data;
      }
    }
    
    if (parsedData.message) return parsedData.message;
    if (parsedData.error) return parsedData.error;
    
    const upperResponse = responseText.toUpperCase();
    
    if (upperResponse.includes("<!DOCTYPE") || upperResponse.includes("<HTML")) {
      return "API configuration error: Received HTML response instead of API data. Please check your API endpoint, username, and password in Settings.";
    }
    
    if (upperResponse.includes("INSUFFICIENT CREDIT") || 
        upperResponse.includes("INSUFFICIENT BALANCE") ||
        upperResponse.includes("LOW BALANCE") ||
        upperResponse.includes("NO CREDIT")) {
      return "Insufficient SMS credits. Please recharge your account.";
    }
    
    if (upperResponse.includes("INVALID USERNAME") || 
        upperResponse.includes("INVALID PASSWORD") ||
        upperResponse.includes("AUTHENTICATION FAILED")) {
      return "Invalid authentication credentials.";
    }
    
    if (upperResponse.includes("INVALID NUMBER") || 
        upperResponse.includes("INVALID PHONE")) {
      return "Invalid phone number.";
    }
    
    if (responseText.length > 200) {
      return "Invalid API response (too long). Please verify your API configuration.";
    }
    
    return responseText || "Failed to send SMS";
  }
}

export const smsService = new SMSService();
