# httprequest
create a simple http request client

```
const { sendHttpRequest } = require('http-requests-proxy');

async function createPost() {
  try {
    const response = await sendHttpRequest({
      targetUrl: 'http://127.0.0.1:8080/api/posts',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_AUTH_TOKEN'
      },
      body: {
        title: 'New Article',
        content: 'This is a sample post body.'
      },
      timeout: 3000
    });

    console.log('Status Code:', response.statusCode);
    console.log('Response Headers:', response.headers);
    console.log('Response Body:', response.body);
  } catch (err) {
    console.error('Failed to create post:', err.message);
  }
}

createPost();
```