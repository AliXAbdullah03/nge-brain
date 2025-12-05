/**
 * Request/Response Logger Middleware
 * Logs all incoming requests and outgoing responses
 */

const logger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log incoming request
  console.log('\n' + '='.repeat(80));
  console.log(`[${timestamp}] 📥 INCOMING REQUEST`);
  console.log('='.repeat(80));
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl || req.url}`);
  console.log(`Path: ${req.path}`);
  console.log(`IP: ${req.ip || req.connection.remoteAddress}`);
  
  // Log headers (excluding sensitive data)
  console.log('\n📋 Headers:');
  const headersToLog = { ...req.headers };
  // Remove sensitive headers
  if (headersToLog.authorization) {
    headersToLog.authorization = headersToLog.authorization.substring(0, 20) + '...';
  }
  console.log(JSON.stringify(headersToLog, null, 2));
  
  // Log query parameters
  if (Object.keys(req.query).length > 0) {
    console.log('\n🔍 Query Parameters:');
    console.log(JSON.stringify(req.query, null, 2));
  }
  
  // Log request body (if exists)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('\n📦 Request Body:');
    // Don't log sensitive fields
    const bodyToLog = { ...req.body };
    const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
    sensitiveFields.forEach(field => {
      if (bodyToLog[field]) bodyToLog[field] = '***HIDDEN***';
    });
    console.log(JSON.stringify(bodyToLog, null, 2));
  }
  
  // Log file upload info
  if (req.file) {
    console.log('\n📎 File Upload:');
    console.log(`  Filename: ${req.file.originalname}`);
    console.log(`  Size: ${req.file.size} bytes`);
    console.log(`  MIME Type: ${req.file.mimetype}`);
  }
  
  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override res.json to log response
  res.json = function(body) {
    const duration = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log(`[${new Date().toISOString()}] 📤 OUTGOING RESPONSE`);
    console.log('='.repeat(80));
    console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`);
    console.log(`Duration: ${duration}ms`);
    
    // Log response body
    if (body) {
      console.log('\n📦 Response Body:');
      // Limit response body logging to prevent console spam
      const bodyString = JSON.stringify(body, null, 2);
      if (bodyString.length > 2000) {
        console.log(bodyString.substring(0, 2000) + '\n... (truncated)');
      } else {
        console.log(bodyString);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    
    // Call original method
    return originalJson.call(this, body);
  };
  
  // Override res.send to log response
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log(`[${new Date().toISOString()}] 📤 OUTGOING RESPONSE`);
    console.log('='.repeat(80));
    console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`);
    console.log(`Duration: ${duration}ms`);
    
    if (body) {
      console.log('\n📦 Response Body:');
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      if (bodyString.length > 2000) {
        console.log(bodyString.substring(0, 2000) + '\n... (truncated)');
      } else {
        console.log(bodyString);
      }
    }
    
    console.log('='.repeat(80) + '\n');
    
    // Call original method
    return originalSend.call(this, body);
  };
  
  // Log errors
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const duration = Date.now() - startTime;
      console.log('\n' + '⚠️'.repeat(40));
      console.log(`[${new Date().toISOString()}] ⚠️ ERROR RESPONSE`);
      console.log('⚠️'.repeat(40));
      console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`);
      console.log(`Method: ${req.method}`);
      console.log(`URL: ${req.originalUrl || req.url}`);
      console.log(`Duration: ${duration}ms`);
      console.log('⚠️'.repeat(40) + '\n');
    }
  });
  
  next();
};

/**
 * Error Logger
 * Logs all errors that occur in the application
 */
const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  console.error('\n' + '❌'.repeat(40));
  console.error(`[${timestamp}] ❌ ERROR OCCURRED`);
  console.error('❌'.repeat(40));
  console.error(`Method: ${req.method}`);
  console.error(`URL: ${req.originalUrl || req.url}`);
  console.error(`Error Name: ${err.name}`);
  console.error(`Error Message: ${err.message}`);
  console.error(`Error Code: ${err.code || 'N/A'}`);
  
  if (err.stack) {
    console.error('\n📚 Stack Trace:');
    console.error(err.stack);
  }
  
  if (err.errors) {
    console.error('\n🔍 Validation Errors:');
    console.error(JSON.stringify(err.errors, null, 2));
  }
  
  console.error('❌'.repeat(40) + '\n');
  
  next(err);
};

module.exports = {
  logger,
  errorLogger
};

