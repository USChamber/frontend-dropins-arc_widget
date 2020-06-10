/**
 *
 * @param {string} requestType - The HTTP verb to use (GET, POST)
 * @param {string} url - The URL to use for the request
 * @param {object} options - Object to modify. Currently only accepts a `json` param which will parse response to JSON
 * @returns a promise
 */
const request = (requestType, url, options = {}) => {
  return new Promise((resolve, reject) => {
    if (options.params) {
      for (const param in options.params) {
        if (url.includes("?")) {
          url += `&${param}=${options.params[param]}`;
        } else {
          url += `?${param}=${options.params[param]}`;
        }
      }
    }
    const xhr = new XMLHttpRequest();
    xhr.open(requestType, url);
    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          if (options.json) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            resolve(xhr.responseText);
          }
        } catch (e) {
          reject(e);
        }
      } else {
        reject(xhr.status);
      }
    };
    if (requestType == "POST" && options.body) {
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.send(JSON.stringify(options.body));
    } else {
      xhr.send();
    }
  });
};

export { request };
