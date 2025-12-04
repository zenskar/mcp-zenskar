// Simple response processor for Zenskar API responses
class ResponseProcessor {
  constructor() {
    // Minimal configuration
    this.maxResponseLength = 50000;
  }

  processResponse(responseData, toolName) {
    try {
      // Convert response to string if needed
      let response = typeof responseData === 'string' 
        ? responseData 
        : JSON.stringify(responseData, null, 2);

      // Simple truncation if too long
      if (response.length > this.maxResponseLength) {
        response = response.substring(0, this.maxResponseLength) + '\n\n[Response truncated due to length]';
      }

      return response;
    } catch (error) {
      console.error('Response processing error:', error);
      return 'Error processing response';
    }
  }
}

module.exports = ResponseProcessor;