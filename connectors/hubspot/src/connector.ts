import type { ConnectorDefinition } from "@autoflow/connector-runtime";
import { connectorRegistry } from "@autoflow/connector-runtime";
import { createContact, createCompany, createDeal } from "./actions";
import { contactUpdated, dealUpdated } from "./triggers";

export const hubspotConnector: ConnectorDefinition = {
  name: "hubspot",
  version: "1.0.0",
  auth: ["oauth2"],
  actions: [
    { id: "createContact", name: "Create Contact", description: "Create a new contact in HubSpot", inputSchema: { email: "string", firstName: "string", lastName: "string", phone: "string?" }, outputSchema: { id: "string", email: "string" }, idempotent: true },
    { id: "createCompany", name: "Create Company", description: "Create a new company in HubSpot", inputSchema: { name: "string", domain: "string?" }, outputSchema: { id: "string", name: "string" }, idempotent: true },
    { id: "createDeal", name: "Create Deal", description: "Create a new deal in HubSpot", inputSchema: { dealName: "string", amount: "number?", dealStage: "string?" }, outputSchema: { id: "string", dealName: "string" }, idempotent: true },
  ],
  triggers: [
    { id: "contactUpdated", name: "Contact Updated", description: "Trigger when a contact is created or updated", type: "webhook", outputSchema: { contactId: "string", email: "string", changes: "object" } },
    { id: "dealUpdated", name: "Deal Updated", description: "Trigger when a deal stage changes", type: "webhook", outputSchema: { dealId: "string", dealName: "string", stage: "string" } },
  ],
  permissions: ["contacts.read", "contacts.write", "companies.read", "companies.write", "deals.read", "deals.write"],
};

connectorRegistry.register(hubspotConnector);
connectorRegistry.registerAction("hubspot", { definition: hubspotConnector.actions[0], handler: createContact });
connectorRegistry.registerAction("hubspot", { definition: hubspotConnector.actions[1], handler: createCompany });
connectorRegistry.registerAction("hubspot", { definition: hubspotConnector.actions[2], handler: createDeal });
connectorRegistry.registerTrigger("hubspot", { definition: hubspotConnector.triggers[0], handler: contactUpdated });
connectorRegistry.registerTrigger("hubspot", { definition: hubspotConnector.triggers[1], handler: dealUpdated });

export default hubspotConnector;
