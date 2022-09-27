onmessage = (e) => {
  console.log("Message received from main script", e);

  const { data = {} } = e;
  const { method, ...args } = data;

  console.log("Message received from main script", method, args);
};

export {};
