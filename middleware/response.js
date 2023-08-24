function responseWithData(code, data, message) {
    const responseObject = {
      code: code,
    };
  
    if (data !== undefined) {
      responseObject.data = data;
    }
  
    if (message !== undefined) {
      responseObject.message = message;
    }
  
    return responseObject;
  }
  
  function response(code, message) {
    const responseObject = {
      code: code,
    };
  
    if (message !== undefined) {
      responseObject.message = message;
    }
  
    return responseObject;
  }
  

module.exports= {responseWithData, response};