export const hubspotSchemas = {
  createContact: {
    input: {
      type: "object",
      properties: {
        email: { type: "string", description: "Contact email address" },
        firstName: { type: "string", description: "First name" },
        lastName: { type: "string", description: "Last name" },
        phone: { type: "string", description: "Phone number" },
      },
      required: ["email", "firstName", "lastName"],
    },
    output: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
      },
    },
  },
};
