# **App Name**: Local Model Interceptor

## Core Features:

- Request Interception: Intercept network requests to specific URLs used for downloading models (e.g., the ollama download endpoint).
- Request Redirection: Redirect intercepted requests to a local endpoint serving the pre-downloaded model files.
- Local File Serving: Serve model files from a designated local directory, responding to the redirected requests.
- Configuration Interface: Provide a configuration interface to specify the target URL patterns to intercept, and the local directory containing the model files. Input can be provided manually in a dedicated page, or, using generative AI, using data from a log file showing previously intercepted URL requests. A generative AI "tool" can analyze the file to attempt to learn an appropriate interception rule. (MVP: manual input).

## Style Guidelines:

- Primary color: Soft blue (#64B5F6) to reflect a sense of calm and reliability.
- Background color: Light gray (#F0F2F5), providing a neutral backdrop.
- Accent color: Teal (#26A69A) to highlight important controls and status indicators.
- Font pairing: 'Inter' for both headings and body text (sans-serif).
- Code font: 'Source Code Pro' for displaying configuration and intercepted requests (monospace).
- Clear, organized layout with a primary configuration section and a log display area.
- Subtle animations for connection status and file serving feedback.