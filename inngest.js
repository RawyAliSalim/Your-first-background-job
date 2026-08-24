const { Inngest } = require("inngest");

const inngest = new Inngest({ id: "report-api" });
const reports = new Map();

const makeReport = inngest.createFunction(
  {
    id: "make-report",
    name: "Make Report",
    retries: 2,
    onFailure: async ({ event }) => {
      const report = reports.get(event.data.id);

      if (report) {
        report.status = "failed";
      }
    },
  },
  { event: "report/requested" },
  async ({ event, step }) => {
    const { id, topic } = event.data;

    await step.sleep("do-the-slow-work", "8s");

    return step.run("build-report", async () => {
      if (topic === "fail") {
        throw new Error("The report oven is broken!");
      }

      const result = `Report on ${topic} is ready!`;
      const report = reports.get(id);

      if (report) {
        report.status = "done";
        report.result = result;
      }

      return result;
    });
  },
);

const heartbeat = inngest.createFunction(
  {
    id: "heartbeat",
    name: "Report Heartbeat",
  },
  { cron: "* * * * *" },
  async () => {
    const counts = { pending: 0, done: 0, failed: 0 };

    for (const report of reports.values()) {
      if (report.status in counts) {
        counts[report.status] += 1;
      }
    }

    console.log(
      `[heartbeat] pending=${counts.pending} done=${counts.done} failed=${counts.failed}`,
    );
  },
);

module.exports = { inngest, reports, makeReport, heartbeat };
