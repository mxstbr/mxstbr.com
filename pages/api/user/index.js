import express from "../../../utils/express";

const app = express();

app.use((req, res) => {
  res.send(req.user || "");
});

export default app;
