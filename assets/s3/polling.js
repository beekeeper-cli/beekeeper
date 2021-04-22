setInterval(async () => {
    const URL = "https://nxwjy26q46.execute-api.us-east-2.amazonaws.com/sealbuzz-production/polling";
    let response = await fetch(URL, {
      credentials: "include",
    });
    let json = await response.json();
    if (json.allow) {
      let origin = json.origin;
      window.location.href = origin;
    }
  }, 5000)