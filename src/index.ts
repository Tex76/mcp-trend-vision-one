import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL = "https://api.mea.xdr.trendmicro.com";
const ACCESS_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJjaWQiOiIyZmUwNzBkYy0xZWUwLTQ4YjEtOTljZi1kZTJhYjk5MDk0NDEiLCJjcGlkIjoic3ZwIiwicHBpZCI6ImN1cyIsIml0IjoxNzQzMDY5NDY0LCJldCI6MTc0NTY2MTQ2MywiaWQiOiI5YTM0NjFhNi00MDA3LTQ1MTUtOTg1Yy02ZmViZWI1ZjI4ZjgiLCJ0b2tlblVzZSI6ImN1c3RvbWVyIn0.MC1TnvODYH3fqS0nI7ZM2QPLqmpgnO6YZSfDrfVsddCZNWLVC_mQIA_pNrjC7vpfO_PV6PuckOxu6-9XTAOCKhihs_jClsP71BdznD0hbux2Rr_vsEbMerTPoC4SjKrCH3aRmkbhzYCcJd4NM7SvYOjy9uaiNjIL7VnspwXI9j4MoRtylPbZIyHSc__RZK_eUO6f32DePu0UnNhM8SAJCy-gDa7T1LV5QRaOXNN019tQkeN77oobtoZ26jbLfH1gE9RDeZpEPNaJ8SkXoDcqG9X9NT1OWKdwVwGQDQhr0oW7Xl5RkJ65sYscr2e-VvoslmrFv_gw3RCcsEleWewKtnAXRO1b5iahX6ttA7Y6VnD6m0PaB1cy-7cXZoybBhzff_ikZ1Jtb6TjNf_SWyfpy6GQuGD17qk5zLm59Ns4LPHsWkB_QonujJG5NvTjX4-SA4KhEfCjvwe6SD2OJ8QNcQgfcFL6u4d02RfPVtWEJrsGHqgR_FwO-DI_aHd9VeL5qIJWRN6WvdkIDG8Celg4wSlqj55wrvbWHGmNGkOT9QgZSZDlBbdtYhNsACge8SZqRsmTBIXwdfykIH57PPnyiOPXvuFYE0sUiDOtHeZXIHFCo3mMw4ZK-w6mpSJNIK5diEXsw6i5CDBDMJIDCjvhBnc9jX65IhPe-cYg_ihVpwM";

// Create server instance
const server = new McpServer({
  name: "trend-vision",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// define an function type
async function makeTrendRequest<T>(url: string): Promise<T | null> {
  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// Add a function specifically for POST requests to Trend Micro API
async function postTrendRequest<T>(url: string, body: any): Promise<T | null> {
  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    // For 204 No Content responses, return an empty object
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

interface AlertsList {}

// Create an interface for alerts response
interface AlertsResponse {
  items: Array<{
    id: string;
    severity: string;
    status: string;
    createdDateTime: string;
    lastUpdatedDateTime: string;
    model?: string;
    description?: string;
    workbenchLink?: string;
  }>;
  nextLink?: string;
}

// Create an interface for system instructions
interface SystemInstructions {
  defaultDateRange: {
    startDate: string;
    endDate: string;
  };
  defaultFilters: {
    status: string;
    sortBy: string;
    sortOrder: string;
  };
}

// Create system instructions object with defaults
const systemDefaults: SystemInstructions = {
  defaultDateRange: {
    startDate: "2020-01-01T00:00:00Z",
    endDate: new Date().toISOString(),
  },
  defaultFilters: {
    status: "new",
    sortBy: "lastUpdatedDateTime",
    sortOrder: "desc",
  },
};

// Add a system instructions tool
server.tool(
  "get-system-instructions",
  "Retrieve system instructions on how to use the Trend Vision One tools effectively",
  {},
  async () => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              instructions:
                "When using the get-alerts-list tool, please apply the following defaults unless the user specifically requests different parameters:",
              defaults: systemDefaults,
              usage:
                "Example: To get in-progress alerts from 2020 until today, sorted by last updated date in descending order, just call get-alerts-list without parameters. To override defaults, explicitly specify the parameters you want to change.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Modify the main get-alerts-list tool to include instructions in the description
server.tool(
  "get-alerts-list",
  "Get alerts list from Trend Vision One API. IMPORTANT: By default, you should filter for 'new' status alerts from 2020 until today, sorted by lastUpdatedDateTime in descending order, unless the user explicitly asks for different criteria.",
  {
    startDateTime: z
      .string()
      .datetime()
      .optional()
      .describe(
        "Start of time range to filter alerts (ISO-8601 format). Default: 2020-01-01T00:00:00Z"
      ),
    endDateTime: z
      .string()
      .datetime()
      .optional()
      .describe(
        "End of time range to filter alerts (ISO-8601 format). Default: current date"
      ),
    top: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Maximum number of alerts to return"),
    dateTimeTarget: z
      .enum(["created", "lastUpdated"])
      .optional()
      .describe(
        "Indicates which date field to filter on (created or lastUpdated)"
      ),
    sortBy: z
      .enum(["createdDateTime", "lastUpdatedDateTime", "severity", "status"])
      .optional()
      .describe("Field to sort results by. Default: lastUpdatedDateTime"),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Sort order (ascending or descending). Default: desc"),
    severity: z
      .enum(["critical", "high", "medium", "low", "informational"])
      .optional()
      .describe("Filter by alert severity"),
    status: z
      .enum(["new", "in_progress", "closed", "reopened"])
      .optional()
      .describe("Filter by alert status. Default: new"),
    sourceProduct: z.string().optional().describe("Filter by source product"),
    model: z.string().optional().describe("Filter by alert model"),
    description: z
      .string()
      .optional()
      .describe("Filter by description (substring match)"),
    entityValue: z.string().optional().describe("Filter by entity value"),
    skipToken: z.string().optional().describe("Token for pagination"),
  },
  async (params) => {
    const queryParams = new URLSearchParams();

    // Add all parameters to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${API_BASE_URL}/v3.0/workbench/alerts?${queryParams.toString()}`;

    const data = await makeTrendRequest<AlertsResponse>(url);

    return {
      content: [
        {
          type: "text" as const,
          text: data ? JSON.stringify(data, null, 2) : "Failed to fetch alerts",
        },
      ],
    };
  }
);

// Create an interface for alert detail response
interface AlertDetailResponse {
  id: string;
  severity: string;
  status: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
  model?: string;
  description?: string;
  workbenchLink?: string;
  investigationStatus?: string;
  impactScope?: {
    endpoints?: number;
    servers?: number;
    accountEmails?: number;
    totalImpactedEntities?: number;
  };
  indicators?: Array<{
    type: string;
    value: string;
  }>;
  // Additional fields from the API documentation
  entityType?: string;
  entityValue?: string;
  filters?: any[];
  matchedIndicators?: any[];
  relatedEvents?: any[];
  schemaVersion?: string;
  sourceProduct?: string;
}

// Create an interface for alert notes response
interface AlertNotesResponse {
  items: Array<{
    id: string;
    content: string;
    createdDateTime: string;
    createdBy: string;
  }>;
  nextLink?: string;
}

// Create a helper function to get alert notes
async function getAlertNotes(
  alertId: string
): Promise<AlertNotesResponse | null> {
  const url = `${API_BASE_URL}/v3.0/workbench/alerts/${encodeURIComponent(
    alertId
  )}/notes`;
  return await makeTrendRequest<AlertNotesResponse>(url);
}

// Create an interface for combined alert details with notes and summary
interface EnhancedAlertResponse {
  alertDetails: AlertDetailResponse | null;
  notes: AlertNotesResponse | null;
  summary: {
    severity: string;
    status: string;
    createdDateTime: string;
    lastUpdatedDateTime: string;
    notesCount: number;
    findings: string;
    impactAssessment: string;
    recommendedActions: string;
  };
}

// Modify the get-alert-details tool to include notes and generate a summary
server.tool(
  "get-alert-details",
  "Get detailed information about a specific alert from Trend Vision One API, including related notes and an AI-generated investigation summary",
  {
    alertId: z
      .string()
      .min(1)
      .describe(
        "The unique identifier of the alert to retrieve details for specific alert and help to do investegation further"
      ),
  },
  async (params) => {
    const { alertId } = params;

    // Get alert details
    const alertDetailsUrl = `${API_BASE_URL}/v3.0/workbench/alerts/${encodeURIComponent(
      alertId
    )}`;
    const alertDetails = await makeTrendRequest<AlertDetailResponse>(
      alertDetailsUrl
    );

    // Get alert notes
    const notes = await getAlertNotes(alertId);

    // Generate summary based on alert details and notes
    const summary = {
      severity: alertDetails?.severity || "Unknown",
      status: alertDetails?.status || "Unknown",
      createdDateTime: alertDetails?.createdDateTime || "Unknown",
      lastUpdatedDateTime: alertDetails?.lastUpdatedDateTime || "Unknown",
      notesCount: notes?.items.length || 0,
      findings: generateFindings(alertDetails, notes),
      impactAssessment: generateImpactAssessment(alertDetails),
      recommendedActions: generateRecommendedActions(alertDetails),
    };

    // Create enhanced response with details, notes, and summary
    const enhancedResponse: EnhancedAlertResponse = {
      alertDetails,
      notes,
      summary,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(enhancedResponse, null, 2),
        },
      ],
    };
  }
);

// Helper function to generate findings based on alert details and notes
function generateFindings(
  alertDetails: AlertDetailResponse | null,
  notes: AlertNotesResponse | null
): string {
  if (!alertDetails) return "No alert details available for analysis.";

  let findings = `Alert model: ${alertDetails.model || "Not specified"}. `;

  if (alertDetails.description) {
    findings += `Description: ${alertDetails.description}. `;
  }

  if (alertDetails.indicators && alertDetails.indicators.length > 0) {
    findings += `Detected indicators: ${alertDetails.indicators
      .map((i) => `${i.type}:${i.value}`)
      .join(", ")}. `;
  }

  if (notes && notes.items.length > 0) {
    findings += `Investigation notes: ${notes.items
      .map((note) => note.content)
      .join(" | ")}`;
  } else {
    findings += "No investigation notes available.";
  }

  return findings;
}

// Helper function to generate impact assessment
function generateImpactAssessment(
  alertDetails: AlertDetailResponse | null
): string {
  if (!alertDetails) return "No alert details available for impact assessment.";

  let impact = `Severity: ${alertDetails.severity}. `;

  if (alertDetails.impactScope) {
    const scope = alertDetails.impactScope;
    impact += "Impact scope: ";

    if (scope.endpoints) impact += `${scope.endpoints} endpoints. `;
    if (scope.servers) impact += `${scope.servers} servers. `;
    if (scope.accountEmails)
      impact += `${scope.accountEmails} email accounts. `;
    if (scope.totalImpactedEntities)
      impact += `Total of ${scope.totalImpactedEntities} impacted entities.`;
  } else {
    impact += "No detailed impact scope information available.";
  }

  return impact;
}

// Helper function to generate recommended actions
function generateRecommendedActions(
  alertDetails: AlertDetailResponse | null
): string {
  if (!alertDetails)
    return "Cannot provide recommendations without alert details.";

  let recommendations = "";

  switch (alertDetails.severity) {
    case "critical":
      recommendations =
        "Immediate investigation required. Isolate affected systems. Escalate to security team leads.";
      break;
    case "high":
      recommendations =
        "Prioritize investigation. Consider containment measures for affected systems.";
      break;
    case "medium":
      recommendations =
        "Investigate within 24 hours. Monitor for escalation or related alerts.";
      break;
    case "low":
      recommendations =
        "Review during regular security operations. Monitor for pattern development.";
      break;
    default:
      recommendations =
        "Review alert details and determine appropriate action based on context.";
  }

  if (alertDetails.status === "new") {
    recommendations +=
      " Update alert status to reflect investigation progress.";
  }

  return recommendations;
}

// Add tool for creating notes for alerts
server.tool(
  "add-alert-note",
  "Add a new investigation note to a specific alert in Trend Vision One",
  {
    alertId: z
      .string()
      .min(1)
      .describe("The unique identifier of the alert to add a note to"),
    content: z
      .string()
      .min(1)
      .max(10000)
      .describe("The content of the note to add (max 10000 characters)"),
  },
  async (params) => {
    const { alertId, content } = params;

    // Create the URL for adding notes to this specific alert
    const url = `${API_BASE_URL}/v3.0/workbench/alerts/${encodeURIComponent(
      alertId
    )}/notes`;

    // Make the POST request with the note content
    const result = await postTrendRequest(url, { content });

    if (result !== null) {
      // If successful, get the updated notes to return them
      const notes = await getAlertNotes(alertId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: "Note added successfully",
                notes: notes?.items || [],
              },
              null,
              2
            ),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: false,
                message: "Failed to add note to the alert",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Trend Vision MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
