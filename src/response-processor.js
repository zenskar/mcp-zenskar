class ResponseProcessor {
  constructor() {
    this.maxResponseLength = 2000000
  }

  processResponse(responseData, toolName) {
    try {
      let response =
        typeof responseData === 'string'
          ? responseData
          : JSON.stringify(responseData, null, 2)

      if (response.length > this.maxResponseLength) {
        response =
          response.substring(0, this.maxResponseLength) +
          '\n\n[Response truncated due to length]'
      }

      return response
    } catch (error) {
      console.error('Response processing error:', error)
      return 'Error processing response'
    }
  }
}

export default ResponseProcessor
