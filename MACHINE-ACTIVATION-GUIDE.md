# 💻 MACHINE ACTIVATION SYSTEM - Complete Guide

## Phase B: Machine Activation & Transfer System

**Status**: Built and ready to deploy ✅

---

## 🎯 SYSTEM OVERVIEW

### Core Principle:
**One License = One Active Machine at a Time**

### Key Features:
1. ✅ License activates on first machine automatically
2. ✅ Transfer requires email approval from license owner
3. ✅ 24-hour cooldown between transfers
4. ✅ Denied machines are permanently blocked
5. ✅ Admin dashboard to monitor all machines

---

## 🔄 USER FLOW

### Scenario 1: First Activation
```
User opens Caseline on Machine A
→ Enters license key
→ Calls /api/desktop/activate
→ License activates on Machine A ✅
→ User can use Caseline
```

### Scenario 2: Transfer to New Machine
```
User opens Caseline on Machine B
→ Enters same license key
→ Calls /api/desktop/activate
→ System detects license is active on Machine A
→ Email sent to user with Approve/Deny buttons
→ User clicks "Approve"
→ Machine A deactivated
→ Machine B activated ✅
→ 24-hour transfer cooldown starts
```

### Scenario 3: Unauthorized Access Attempt
```
Someone tries to use license on Machine C
→ Enters license key
→ Email sent to license owner
→ Owner clicks "Deny & Block"
→ Machine C permanently blocked 🚫
→ Machine A remains active
```

### Scenario 4: Transfer Cooldown
```
User tries to transfer again within 24 hours
→ Calls /api/desktop/activate
→ System checks cooldown
→ Returns error: "Transfer cooldown active"
→ Shows cooldown end time
→ Transfer blocked until cooldown expires
```

---

## 🛠️ DESKTOP APP INTEGRATION

### API Endpoints for Caseline

#### 1. Activate License
**Endpoint**: `POST https://advoverse.com/api/desktop/activate`

**Request**:
```json
{
  "licenseKey": "ADV-1A2B-3C4D-5E6F-7G8H",
  "machineId": "UNIQUE-MACHINE-ID",
  "machineName": "John's Laptop",
  "ipAddress": "192.168.1.100"
}
```

**Response (Success - First Activation)**:
```json
{
  "success": true,
  "message": "License activated successfully",
  "activation": {
    "activatedAt": "2026-05-25T10:30:00.000Z",
    "machineName": "John's Laptop",
    "expiresAt": "2026-06-25T00:00:00.000Z",
    "planName": "Chamber (monthly)"
  }
}
```

**Response (Transfer Required)**:
```json
{
  "success": false,
  "error": "License is active on another machine. Transfer approval required.",
  "code": "TRANSFER_REQUIRED",
  "currentMachine": "John's Desktop",
  "message": "An email has been sent to the license owner for approval.",
  "transferRequestId": "uuid-here"
}
```

**Response (Machine Blocked)**:
```json
{
  "success": false,
  "error": "This machine has been permanently blocked by the license owner",
  "code": "MACHINE_BLOCKED",
  "blockedAt": "2026-05-20T10:00:00.000Z",
  "reason": "Transfer request denied by license owner"
}
```

**Response (Transfer Cooldown)**:
```json
{
  "success": false,
  "error": "Transfer cooldown active. You can only transfer once every 24 hours.",
  "code": "TRANSFER_COOLDOWN",
  "cooldownUntil": "2026-05-26T10:30:00.000Z",
  "currentMachine": "John's Laptop"
}
```

#### 2. Validate License
**Endpoint**: `POST https://advoverse.com/api/desktop/validate`

**Request**:
```json
{
  "licenseKey": "ADV-1A2B-3C4D-5E6F-7G8H",
  "machineId": "UNIQUE-MACHINE-ID"
}
```

**Response (Valid)**:
```json
{
  "valid": true,
  "license": {
    "key": "ADV-1A2B-3C4D-5E6F-7G8H",
    "planName": "Chamber (monthly)",
    "isActive": true,
    "expiresAt": "2026-06-25T00:00:00.000Z",
    "daysRemaining": 30,
    "autoRenewalEnabled": false
  },
  "machine": {
    "machineId": "UNIQUE-MACHINE-ID",
    "machineName": "John's Laptop",
    "activatedAt": "2026-05-25T10:30:00.000Z",
    "lastValidated": "2026-05-25T14:00:00.000Z"
  },
  "warning": {
    "level": "none",
    "message": "",
    "showBanner": false,
    "showPopup": false
  },
  "actions": {
    "renewUrl": "https://advoverse.com/my-licenses",
    "enableAutoRenewalUrl": "https://advoverse.com/my-licenses",
    "deactivateUrl": "https://advoverse.com/my-licenses"
  }
}
```

**Response (Invalid)**:
```json
{
  "valid": false,
  "error": "License is active on another machine",
  "code": "ACTIVE_ON_OTHER_MACHINE",
  "activeMachine": "John's Desktop"
}
```

#### 3. Deactivate License
**Endpoint**: `POST https://advoverse.com/api/desktop/deactivate`

**Request**:
```json
{
  "licenseKey": "ADV-1A2B-3C4D-5E6F-7G8H",
  "machineId": "UNIQUE-MACHINE-ID"
}
```

**Response**:
```json
{
  "success": true,
  "message": "License deactivated successfully",
  "deactivation": {
    "machineName": "John's Laptop",
    "deactivatedAt": "2026-05-25T15:00:00.000Z"
  }
}
```

---

## 💻 CASELINE IMPLEMENTATION

### C# Example Code

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class LicenseManager
{
    private const string API_BASE = "https://advoverse.com/api/desktop";
    private readonly HttpClient _httpClient;
    
    public LicenseManager()
    {
        _httpClient = new HttpClient();
    }
    
    // Get unique machine ID
    private string GetMachineId()
    {
        // Use Windows Machine GUID or generate unique ID
        return Environment.MachineName + "-" + 
               Environment.UserName + "-" + 
               GetHardwareId();
    }
    
    private string GetHardwareId()
    {
        // Get CPU ID, Motherboard Serial, or other hardware identifier
        // This should be consistent across reboots
        // Example: Use WMI to get processor ID
        return "HARDWARE-ID-HERE";
    }
    
    // Activate license
    public async Task<ActivationResult> ActivateLicense(string licenseKey)
    {
        var request = new
        {
            licenseKey = licenseKey,
            machineId = GetMachineId(),
            machineName = Environment.MachineName,
            ipAddress = GetLocalIPAddress()
        };
        
        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync($"{API_BASE}/activate", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        
        return JsonSerializer.Deserialize<ActivationResult>(responseJson);
    }
    
    // Validate license on startup
    public async Task<ValidationResult> ValidateLicense(string licenseKey)
    {
        var request = new
        {
            licenseKey = licenseKey,
            machineId = GetMachineId()
        };
        
        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync($"{API_BASE}/validate", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        
        return JsonSerializer.Deserialize<ValidationResult>(responseJson);
    }
    
    // Deactivate license
    public async Task<DeactivationResult> DeactivateLicense(string licenseKey)
    {
        var request = new
        {
            licenseKey = licenseKey,
            machineId = GetMachineId()
        };
        
        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync($"{API_BASE}/deactivate", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        
        return JsonSerializer.Deserialize<DeactivationResult>(responseJson);
    }
    
    private string GetLocalIPAddress()
    {
        // Get local IP address
        return "192.168.1.100"; // Implement actual IP detection
    }
}

// Result classes
public class ActivationResult
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public string Error { get; set; }
    public string Code { get; set; }
    public string CurrentMachine { get; set; }
    public string TransferRequestId { get; set; }
}

public class ValidationResult
{
    public bool Valid { get; set; }
    public string Error { get; set; }
    public string Code { get; set; }
    public LicenseInfo License { get; set; }
    public MachineInfo Machine { get; set; }
    public WarningInfo Warning { get; set; }
}

public class LicenseInfo
{
    public string Key { get; set; }
    public string PlanName { get; set; }
    public bool IsActive { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? DaysRemaining { get; set; }
}

public class MachineInfo
{
    public string MachineId { get; set; }
    public string MachineName { get; set; }
    public DateTime ActivatedAt { get; set; }
}

public class WarningInfo
{
    public string Level { get; set; }
    public string Message { get; set; }
    public bool ShowBanner { get; set; }
    public bool ShowPopup { get; set; }
}
```

### Usage in Caseline

```csharp
// On app startup
var licenseManager = new LicenseManager();
var storedLicenseKey = GetStoredLicenseKey();

if (!string.IsNullOrEmpty(storedLicenseKey))
{
    var validation = await licenseManager.ValidateLicense(storedLicenseKey);
    
    if (validation.Valid)
    {
        // License is valid, allow app to run
        StartApplication();
        
        // Show warning if expiring soon
        if (validation.Warning.ShowBanner)
        {
            ShowExpiryBanner(validation.Warning.Message);
        }
    }
    else
    {
        // License invalid
        ShowLicenseError(validation.Error, validation.Code);
        
        if (validation.Code == "ACTIVE_ON_OTHER_MACHINE")
        {
            ShowMessage("This license is active on another machine. " +
                       "A transfer request has been sent to the license owner.");
        }
    }
}
else
{
    // No license key stored, show activation dialog
    ShowActivationDialog();
}

// When user enters license key
private async void ActivateButton_Click(object sender, EventArgs e)
{
    var licenseKey = LicenseKeyTextBox.Text.Trim();
    var result = await licenseManager.ActivateLicense(licenseKey);
    
    if (result.Success)
    {
        // Activation successful
        StoreLicenseKey(licenseKey);
        ShowMessage("License activated successfully!");
        StartApplication();
    }
    else
    {
        // Activation failed
        if (result.Code == "TRANSFER_REQUIRED")
        {
            ShowMessage($"This license is active on {result.CurrentMachine}. " +
                       "An email has been sent to the license owner for approval.");
        }
        else if (result.Code == "MACHINE_BLOCKED")
        {
            ShowError("This machine has been permanently blocked from using this license.");
        }
        else if (result.Code == "TRANSFER_COOLDOWN")
        {
            ShowError("Transfer cooldown active. Please wait 24 hours between transfers.");
        }
        else
        {
            ShowError(result.Error);
        }
    }
}
```

---

## 📧 EMAIL NOTIFICATIONS

### Transfer Approval Email

Sent when someone tries to use license on a different machine.

**Subject**: 🔐 New Machine Detected - Approve Transfer?

**Content**:
- Current machine name
- New machine name and IP
- Approve button (green)
- Deny & Block button (red)
- Warning about deactivation

**Actions**:
- **Approve**: Deactivates old machine, activates new machine, starts 24-hour cooldown
- **Deny**: Permanently blocks new machine, keeps old machine active

---

## 🎛️ ADMIN DASHBOARD

### Machine Management Page

**URL**: https://advoverse.com/admin/machines

**Tabs**:

1. **Active Machines**
   - Shows all currently active machine activations
   - Machine name, IP address
   - License key, plan name
   - User name and email
   - Activation date
   - Last validated timestamp

2. **Transfer Requests**
   - Shows all transfer requests (pending, approved, denied)
   - Old machine → New machine
   - License key and user
   - Request date
   - Status badge

3. **Blocked Machines**
   - Shows all permanently blocked machines
   - Machine name and IP
   - License key and user
   - Block reason
   - Block date

**Features**:
- Search by machine name, license key, or email
- Real-time status updates
- Filter by status

---

## 🔒 SECURITY FEATURES

### Machine ID Generation
- Use hardware-based unique identifier
- Should be consistent across reboots
- Combine multiple hardware IDs for uniqueness
- Examples: CPU ID, Motherboard Serial, MAC Address

### IP Address Tracking
- Store IP address for security monitoring
- Helps identify suspicious activity
- Shown in admin dashboard

### Transfer Cooldown
- 24-hour cooldown between transfers
- Prevents rapid machine switching
- Stored in `transfer_cooldowns` table

### Permanent Blocking
- Denied machines are permanently blocked
- Cannot be unblocked (requires manual database edit)
- Stored in `blocked_machines` table

---

## 🧪 TESTING

### Test Scenario 1: First Activation
1. Open Caseline on Machine A
2. Enter license key
3. Verify activation success
4. Check database: `license_activations` table should have entry

### Test Scenario 2: Transfer Request
1. Open Caseline on Machine B with same license
2. Verify email sent to user
3. Click "Approve" in email
4. Verify Machine A deactivated, Machine B activated
5. Check database: old activation `is_active = false`, new activation `is_active = true`

### Test Scenario 3: Transfer Denial
1. Open Caseline on Machine C with same license
2. Verify email sent
3. Click "Deny & Block" in email
4. Try to activate on Machine C again
5. Verify error: "Machine blocked"
6. Check database: `blocked_machines` table has entry

### Test Scenario 4: Cooldown
1. Transfer from Machine A to Machine B
2. Immediately try to transfer from Machine B to Machine C
3. Verify error: "Transfer cooldown active"
4. Wait 24 hours
5. Try transfer again - should work

---

## 📊 DATABASE TABLES

### license_activations
- Tracks all machine activations
- `is_active` = true for current machine
- `deactivated_at` set when transferred

### transfer_requests
- Tracks all transfer requests
- Status: pending, approved, denied
- Stores old and new machine info

### blocked_machines
- Permanently blocked machines
- Cannot be removed without database access

### transfer_cooldowns
- Enforces 24-hour cooldown
- `cooldown_until` timestamp

---

## 🚀 DEPLOYMENT

All Phase B files are ready to commit and deploy:

```
✅ app/api/desktop/activate/route.ts
✅ app/api/desktop/validate/route.ts
✅ app/api/desktop/deactivate/route.ts
✅ app/api/transfer/approve/route.ts
✅ app/api/transfer/deny/route.ts
✅ app/my-licenses/page.tsx (updated)
✅ app/admin/machines/page.tsx
✅ MACHINE-ACTIVATION-GUIDE.md
```

**Next Step**: Commit and push to deploy!

---

**Status**: Phase B Complete ✅  
**Ready**: For Caseline desktop app integration

