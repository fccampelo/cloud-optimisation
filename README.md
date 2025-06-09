# TechVantage Solutions - Technical Exercise – CloudOps Control Dashboard

## Background

A junior engineer has built this prototype of a Cloud Operations Dashboard. It currently functions correctly for a small set of mock data, but it was never designed for real-world usage. Your task is to take this starter application and outline, in English, how it should be optimised, hardened and productionised to support at least **10 000 concurrent users over the next 12 months**. You will not be writing code—rather, you will produce a written document explaining the steps, decisions and trade-offs required to make this system reliable, scalable and maintainable.

---

## Business Case

This platform helps engineering teams manage cloud infrastructure with less cognitive overhead. For this exercise, imagine that engineering teams will rely on this dashboard to:

- Observe resource health across multiple accounts and regions
- Detect anomalies such as high CPU usage or misconfigurations
- Monitor cost metrics and project monthly spend
- Receive automated recommendations for optimisations

Because the volume of resources and users is expected to grow rapidly, the existing toy application must be transformed into a production-ready platform.

---

## Task

Write a document (in clear, idiomatic English) that describes how you would optimise and productionise this codebase. Your document should cover, but is not limited to, the following areas:

1. **Architecture & Scalability**
   - How would you modify or re-architect the backend (Node.js/Express) so it can handle thousands of requests per second?
   - What data storage or caching strategy would you introduce instead of the current in-memory mock data?
   - How would you design the frontend (React/Material UI) to ensure responsiveness and low latency for 10 000 users?
   - Outline a deployment strategy.

2. **Performance Optimisation**
   - Identify potential bottlenecks in the existing code (both frontend and backend).
   - Explain how you would benchmark and profile performance.
   - Describe any code-level improvements.

3. **Reliability & Resilience**
   - How would you introduce monitoring, logging and alerting so teams can detect and diagnose issues early?
   - Propose a strategy for handling errors gracefully.
   - Explain how you would ensure high availability.

4. **Security & Compliance**
   - What measures would you implement to secure the API endpoints?
   - How would you manage secrets and configuration?
   - Discuss any compliance or data-protection concerns relevant to cloud operations and suggest mitigations.

5. **Maintainability & Code Quality**
   - Describe how you would organise the codebase.
   - Recommend testing strategies (unit tests, integration tests, end-to-end tests) and tools.
   - Explain how you would enforce code quality.

6. **CI/CD & Release Management**
   - Propose a continuous integration and deployment pipeline for both frontend and backend.
   - Which tools would you use (e.g., GitHub Actions, Jenkins, CircleCI) and why?
   - Outline a process for safe deployments.

7. **Observability & Metrics**
   - Identify key performance indicators (KPIs) and metrics to track.
   - Suggest monitoring tools.
   - Explain how you would instrument the code to emit custom metrics and traces.

8. **Cost Optimisation**
   - How would you estimate and control infrastructure costs as the user base grows?
   - Recommend strategies for cost-effective hosting.
   - Describe how you would report cost metrics to end users in real time without incurring high overhead.

---

## Current Prototype

For reference, the existing repository includes:

- **Backend (Node.js/Express)**
  - Serves mock data from an in-memory array.
  - Endpoints:
    - `GET /api/resources` – returns a list of cloud resources with status and hourly rates.
    - `GET /api/alerts` – returns a list of simulated anomalies.
    - `GET /api/costs` – returns a simplified cost summary.
    - `POST /api/optimise` – returns mock optimisation recommendations.
  - No database, no authentication, no caching.

- **Frontend (React + Material UI)**
  - Displays resources, alerts and cost summary.
  - Contains a "Run Optimisation" button that calls the backend and shows an alert with recommendations.
  - Uses Axios for HTTP requests and basic Material UI components to render lists and cards.
  - No performance optimisations, no routing, no state-management beyond React's built-in hooks.

---

