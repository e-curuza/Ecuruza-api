# Email Service IPv6 Connectivity Fix

## Problem
The email service was failing with `ENETUNREACH` errors when trying to send emails via Gmail's SMTP server. The error showed IPv6 addresses (`2607:f8b0:400e:c08::6d:587`), indicating that Node.js was attempting to connect via IPv6, which was unreachable in the production environment.

## Root Cause
- Node.js was attempting to connect to Gmail's SMTP server using IPv6 addresses
- The production environment (Render.com) doesn't have proper IPv6 connectivity
- Connection timeouts were occurring due to network unreachability

## Solution Implemented

### 1. **Force IPv4 DNS Resolution**
- Added custom DNS lookup function that forces IPv4 address resolution
- Set `dns.setDefaultResultOrder('ipv4first')` to prioritize IPv4
- Added fallback mechanism if IPv4 lookup fails
- Added `family: 4` option to nodemailer transport configuration

### 2. **Retry Mechanism**
- Implemented automatic retry logic for transient network errors
- Retries up to 3 times with exponential backoff
- Handles specific error codes: `ENETUNREACH`, `ETIMEDOUT`, `ECONNREFUSED`, `ENOTFOUND`
- Delays between retries: 1s, 2s, 3s

### 3. **Enhanced Timeout Configuration**
- Increased timeout values to 30 seconds for:
  - DNS timeout
  - Connection timeout
  - Greeting timeout
  - Socket timeout

### 4. **Connection Pooling**
- Enabled connection pooling for better performance
- Max 5 concurrent connections
- Rate limiting: 5 messages per second

## Files Modified
- [`src/services/email.service.ts`](src/services/email.service.ts)

## Changes Made

### DNS Lookup Function
```typescript
const dnsLookup = async (hostname: string, options: any, callback: any) => {
  try {
    // Force IPv4 lookup
    const result = await dnsLookupAsync(hostname, { family: 4, all: false });
    callback(null, result.address, 4);
  } catch (err) {
    // Fallback to default DNS resolution
    const fallbackResult = await dnsLookupAsync(hostname, { all: false });
    callback(null, fallbackResult.address, fallbackResult.family);
  }
};
```

### Retry Mechanism
```typescript
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  // Retries with exponential backoff for network errors
};
```

### Updated Email Functions
All email sending functions now use the retry mechanism:
- `sendVerificationEmail()`
- `sendPasswordResetEmail()`
- `sendPasswordChangeConfirmationEmail()`
- `sendEmail()`

## Deployment Steps

### For Local Development
1. The code has already been built successfully
2. Restart your local server:
   ```bash
   npm start
   ```

### For Production (Render.com)
1. **Commit and push the changes:**
   ```bash
   git add src/services/email.service.ts
   git commit -m "Fix: Resolve IPv6 connectivity issues for email service"
   git push origin main
   ```

2. **Render will automatically deploy** the changes (if auto-deploy is enabled)

3. **Or manually deploy:**
   - Go to your Render dashboard
   - Select your service
   - Click "Manual Deploy" → "Deploy latest commit"

4. **Monitor the deployment:**
   - Check the deployment logs for any errors
   - Test email functionality after deployment

## Testing

### Test Registration Flow
```bash
curl -X POST https://ecuruza-api-e33e.onrender.com/api/v1/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Expected Behavior
- Email should be sent successfully within 30 seconds
- If first attempt fails, it will retry up to 3 times
- Logs will show retry attempts if network issues occur
- Connection will use IPv4 addresses only

## Monitoring

### Success Indicators
- Log message: `Verification email sent to [email]`
- Log message: `DNS resolved [hostname] to [IPv4 address] (IPv4)`
- HTTP 200/201 response for registration

### Failure Indicators (with retries)
- Log message: `Attempt X/3 failed, retrying in Xms...`
- After 3 attempts, error will be thrown
- HTTP 500 response with error message

## Additional Notes

### Environment Variables
Ensure these are set in your production environment:
- `EMAIL_HOST` or `SMTP_HOST` (e.g., smtp.gmail.com)
- `EMAIL_PORT` or `SMTP_PORT` (e.g., 587)
- `EMAIL_SECURE` or `SMTP_SECURE` (true/false)
- `EMAIL_USER` or `SMTP_USER` (your Gmail address)
- `EMAIL_PASSWORD` or `SMTP_PASSWORD` (your Gmail app password)
- `EMAIL_FROM` or `SMTP_FROM` (sender email)
- `EMAIL_FROM_NAME` or `SMTP_FROM_NAME` (sender name)

### Gmail App Password
If using Gmail, ensure you're using an App Password, not your regular password:
1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords → Generate new app password
4. Use this password in your environment variables

## Rollback Plan
If issues persist after deployment:
1. Revert the commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. Or manually deploy a previous working commit from Render dashboard

## Support
If email issues continue after deployment:
1. Check Render logs for specific error messages
2. Verify environment variables are correctly set
3. Test SMTP connectivity from production environment
4. Consider using a different SMTP provider (SendGrid, Mailgun, etc.)
