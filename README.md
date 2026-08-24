# Background Job Report API

This project is a runnable Node.js API that accepts report requests quickly and processes them in the background with Inngest. It uses Express for HTTP routes and an in-memory JavaScript `Map` instead of an external database.

## Requirements

- Node.js 18 or newer
- npm
- Inngest CLI for the local Dev Server

## Install and Run

From this project directory, install dependencies:

```bash
npm install
```

Start the API:

```bash
npm start
```

In a second terminal, start the Inngest Dev Server:

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

The API runs at `http://localhost:3000`. The Inngest dashboard runs at the URL printed by the CLI, typically `http://localhost:8288`.

## API and Inngest Functions

| Type | Name or route | Description |
| --- | --- | --- |
| GET | `/health` | Returns the API health status. |
| POST | `/reports` | Validates a topic, creates a pending report, sends `report/requested`, and returns `202 Accepted`. |
| GET | `/reports/:id` | Returns the current report, or `404 Not Found`. |
| Inngest event | `report/requested` | Starts background processing for a newly accepted report. |
| Inngest function | `make-report` | Sleeps for 8 seconds, builds the report, and retries failures exactly twice. |
| Inngest function | `heartbeat` | Runs every minute and logs pending, done, and failed report counts. |
| Inngest endpoint | `/api/inngest` | Hosts the Inngest function and webhook handlers. |

## Try It

Create a report:

```bash
curl -i -X POST http://localhost:3000/reports -H "Content-Type: application/json" -d "{\"topic\":\"cats\"}"
```

The response is immediate and has status `202`:

```json
{"id":"your-report-id","status":"pending"}
```

Check the report by replacing `your-report-id` with the returned ID:

```bash
curl http://localhost:3000/reports/your-report-id
```

Use `{"topic":"fail"}` to make the background step throw `The report oven is broken!` and observe Inngest retry it twice.

## Stage 3: Validation and Retries

A missing `topic` is a client input error, so the API returns `400 Bad Request` immediately and does not trigger an Inngest event. A network failure during background processing is a temporary infrastructure error, so Inngest can retry the failed function attempt without asking the client to submit the report again.

## Stage 4: Cron Expressions

- Every day at 08:00: `0 8 * * *`
- Every Sunday at 22:00: `0 22 * * 0`

The heartbeat function in this project uses `* * * * *`, which runs every minute.

## Evidence

### Inngest Dashboard

![Inngest dashboard showing completed heartbeat and report runs](Screenshot%202026-08-24%20174517.png)

### Retry and Failure Evidence

![Inngest dashboard showing the failed report and retry error](Screenshot%202026-08-24%20174816.png)

### `curl` Proof of `202 Accepted`

Paste your terminal screenshot or copied `curl` output showing the `202 Accepted` response here:

```text
[Paste curl 202 response here]
```
