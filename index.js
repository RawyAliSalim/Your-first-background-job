const express = require("express");
const crypto = require("node:crypto");
const { serve } = require("inngest/express");
const { inngest, reports, makeReport, heartbeat } = require("./inngest");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/reports", async (req, res, next) => {
  try {
    const { topic } = req.body || {};

    if (!topic) {
      return res.status(400).json({ error: "topic is required" });
    }

    const id = crypto.randomUUID();
    reports.set(id, { id, topic, status: "pending" });

    await inngest.send({
      name: "report/requested",
      data: { id, topic },
    });

    return res.status(202).json({ id, status: "pending" });
  } catch (error) {
    return next(error);
  }
});

app.get("/reports/:id", (req, res) => {
  const report = reports.get(req.params.id);

  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  return res.status(200).json(report);
});

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [makeReport, heartbeat],
  }),
);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Report API listening on http://localhost:${port}`);
});
