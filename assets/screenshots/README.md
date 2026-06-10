# Screenshots Directory

This directory contains UI screenshots of AgentForge. Since actual screenshots require running the application, below are detailed descriptions of each screenshot that should be captured. Screenshots should be PNG format at 1920x1080 resolution.

---

## landing.png

**Hero section of the AgentForge landing page.**

- **Layout:** Full-screen hero with a centered content block. Navigation bar at top with logo, nav links (Features, Marketplace, Docs, Pricing), and "Sign In" / "Get Started" buttons.
- **Headline:** "Build Intelligent AI Agents" in bold white text (48px Inter font). Sub-headline: "Design, deploy, and scale autonomous AI agents with visual workflows, memory systems, and seamless tool integrations."
- **CTAs:** Two primary buttons — "Get Started" (indigo gradient, white text) and "View Demo" (outlined, white border, transparent bg).
- **Background:** Dark gradient (#0f0f1a to #1a1a2e) with animated grid pattern overlay. Subtle floating glow orbs in indigo/cyan.
- **Visual:** Right side shows a mockup of the agent builder UI inside a browser frame or floating card.
- **Footer section:** Brief stats row — "10K+ Agents Deployed", "5K+ Developers", "Open Source MIT License" with icons.

---

## dashboard.png

**Main dashboard after user signs in.**

- **Layout:** Sidebar on left (collapsible) with nav icons (Dashboard, Agents, Workflows, Marketplace, Analytics, Teams, Settings). Main content area with header bar showing breadcrumb and user avatar dropdown.
- **Stats Cards:** Row of 4 cards — Active Agents (42), Total Executions (12,847), Team Members (8), API Calls Today (3,241). Each card has an icon, count number, label, and micro trend chart (green up arrow for positive trend).
- **Recent Activity:** Panel below stats with a table/list showing latest agent executions — Agent Name, Status (success/failure/running), Duration, Timestamp. Status has colored badges (green/red/yellow).
- **Usage Chart:** Area chart showing API calls over the last 7/30 days, with gradient fill under the line and time range selector tabs.
- **Color scheme:** White/light gray background (#f8f9fa), indigo (#6366f1) accent, dark text (#1e293b).

---

## agent-builder.png

**Multi-step agent creation wizard.**

- **Layout:** Stepped wizard header at top (Step 1/4: Basics, Step 2/4: Model, Step 3/4: Tools, Step 4/4: Memory). Current step highlighted in indigo, completed steps have checkmarks.
- **Step 1 - Basics:** Form fields — Agent Name (text input with placeholder "My Assistant"), Description (textarea), Team selection (dropdown). Card-style layout with clean spacing.
- **Step 2 - Model:** Radio card selector for model providers — OpenAI (GPT-4, GPT-3.5), Anthropic (Claude 3 Opus, Sonnet), Ollama (local models). Selected card has indigo border highlight. Temperature slider below.
- **Step 3 - Tools:** Toggle switches for built-in tools — Web Search, Calculator, Code Interpreter, File Storage, Email, Slack. Each tool has an icon, name, and brief description.
- **Step 4 - Memory:** Configuration for memory type — Short-term (conversation buffer), Long-term (vector store), Entity Memory (knowledge graph). Slider for memory window size (token count).
- **Footer:** "Back" (ghost button) and "Create Agent" (indigo primary button) navigation.

---

## agent-detail.png

**Detail view for a single agent.**

- **Layout:** Header with agent avatar/icon, name, model badge ("GPT-4"), status badge ("Active" in green), and action buttons (Run, Edit, Delete).
- **Tabs:** Four horizontal tabs — Overview, Configuration, Executions, Memory. Active tab underlined in indigo.
- **Overview tab content:** Agent description card, performance metrics (success rate 94.7%, avg response time 1.2s, total executions 1,847), and connected tools list with icons.
- **Executions tab (shown):** Timeline list of recent runs — each entry shows timestamp, input preview, status badge, duration, and a "View Details" expand button. Entries are striped alternating colors.
- **Side panel:** Quick actions card (Run Agent, Edit Agent, Clone Agent, Export Config).

---

## marketplace.png

**Agent marketplace for discovering and sharing agents.**

- **Layout:** Top search bar with filters row below — Categories dropdown (All, Assistant, Code, Writing, Data), Sort by (Popular, Newest, Top Rated), Price filter (Free, Paid, All).
- **Grid:** 3-column card grid showing agent listings. Each card has a gradient banner at top, agent avatar, agent name, short description (2 lines truncated), rating stars (4.8), price badge ("Free" / "$9.99/mo"), and download/install count.
- **Featured banner:** Full-width hero card at top for a featured agent with larger layout, CTA button "Install Now".
- **Sidebar (optional):** Category tree with agent count badges. Tags cloud.
- **Color scheme:** Light theme with white cards, subtle shadow on hover, indigo accent for interactive elements.

---

## analytics.png

**Analytics dashboard with data visualizations.**

- **Layout:** Header with title "Analytics" and period selector dropdown (Last 7 Days, Last 30 Days, Last Quarter, Custom Range).
- **Area Chart (top-left):** Total executions over time. X-axis: dates, Y-axis: count. Gradient fill (indigo to transparent). Smooth curved line.
- **Bar Chart (top-right):** Successful vs failed executions per day. Stacked bars in green and red.
- **Pie Chart (bottom-left):** Usage by model provider — GPT-4 (45%), Claude 3 (30%), GPT-3.5 (15%), Ollama (10%). Color-coded slices with legend.
- **Summary Cards (bottom-right):** Key metrics — Total Cost ($247.32), Avg Cost/Execution ($0.013), Tokens Used (14.2M), Active Agents (12).
- **Export button** in top-right corner for PDF/CSV export.
- **Download:** Download buttons for each chart (PNG/SVG).

---

## workflow-builder.png

**Visual workflow builder canvas.**

- **Layout:** Three-panel layout — left palette, center canvas, right properties panel.
- **Left Palette:** Collapsible node categories — Triggers (Webhook, Schedule, Event), Actions (API Call, Send Email, Transform Data), Logic (Condition, Loop, Delay), AI (LLM Call, Embed, Classify). Each node type has a distinct color and icon.
- **Center Canvas:** Infinite canvas with grid dots background. Connected nodes with curved arrows showing the workflow path. Selected node has blue glow border. Zoom controls (+/- buttons and percentage indicator) in bottom-right.
- **Right Properties Panel:** Shows configuration form for the selected node. Fields depend on node type. Example: LLM Call node shows Model selector, Prompt template, Temperature slider, Output variable name.
- **Minimap:** Small overview in bottom-left corner showing the entire workflow graph.
- **Toolbar:** Top bar with undo/redo, save, validate, run workflow buttons.

---

## teams.png

**Teams management page.**

- **Layout:** Header with title "Teams" and "Create Team" button (indigo). Grid or list view toggle.
- **Team Cards:** 3-column grid of team cards. Each card shows:
  - Team name and description
  - Row of member avatar circles (with +N overflow count)
  - Agent count badge
  - Team color/theme
  - "Manage" button on hover
- **Member Avatars:** Circular avatars with tooltip showing name on hover. Colorful initials fallback for users without profile images.
- **Create Team Modal:** Overlay dialog with name field, description, color picker, member email invite input.
- **Empty state:** Illustration + "Create your first team" CTA when no teams exist.

---

## settings.png

**Settings page with tabbed navigation.**

- **Layout:** Sidebar within the settings page with vertical tabs — Profile, API Keys, Notifications, Appearance, Billing, Members.
- **Profile tab (active):** Form fields — Full Name, Email (verified badge), Bio textarea, Profile picture upload with crop preview. "Save Changes" button.
- **API Keys tab preview:** List of generated API keys with masked tokens (sk-...abc123), creation date, last used, copy and revoke buttons. "Generate New Key" button.
- **Notifications tab preview:** Toggle switches for email notifications — Agent execution complete, Error alerts, Weekly summary, Product updates, Marketing emails. Each with brief description.
- **Appearance tab preview:** Theme selector cards — Light, Dark, System (follow OS). Preview thumbnails for each theme. Font size slider.
- **Color scheme:** Clean white form cards on light gray background. Consistent spacing and typography throughout.

---

## sign-in.png

**Authentication page using Clerk.**

- **Layout:** Centered card on gradient background (matching landing page). Two-tone split — left side has brand illustration/graphic, right side has the auth form.
- **Clerk UI:** Sign-in form with email/username field and password field. "Continue with Google", "Continue with GitHub" social login buttons below. "Sign in" primary button.
- **Branding:** AgentForge logo at top of the form side. Tagline: "Welcome back to AgentForge" above form.
- **Illustration:** Abstract graphic showing connected agent nodes/network on the left side, matching the brand indigo/cyan color palette.
- **Footer links:** "Don't have an account? Sign up" and "Forgot password?" link.
- **Error states:** Red border on invalid fields, error message below field. Loading spinner on button during submission.
