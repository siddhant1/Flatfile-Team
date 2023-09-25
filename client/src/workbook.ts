import { Flatfile } from "@flatfile/api";

export const workbook: Pick<
  Flatfile.CreateWorkbookConfig,
  "name" | "labels" | "sheets" | "actions"
> = {
  name: "Upload Equipment List",
  labels: ["pinned"],
  sheets: [
    {
      name: "Equipment List",
      slug: "equipmentList",
      fields: [
        {
          key: "VIN",
          type: "string",
          label: "VIN",
          constraints: [
            {
              type: "unique",
            },
            {
              type: "required",
            },
          ],
        },
        {
          key: "statedValue",
          type: "string",
          label: "Stated Value",
        },
      ],
    },
  ],
  actions: [
    {
      label: "Submit",
      operation: "equipmentList:submit",
      description: "Submit the equipment list",
      mode: "foreground",
      primary: true,
      confirm: true,
      requireAllValid: true,
    },
  ],
};
