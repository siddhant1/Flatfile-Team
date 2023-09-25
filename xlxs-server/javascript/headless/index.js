import api from "@flatfile/api";
import { automap } from "@flatfile/plugin-automap";
import { recordHook } from "@flatfile/plugin-record-hook";
import { ExcelExtractor } from "@flatfile/plugin-xlsx-extractor";
import nodemailer from "nodemailer";
import { promisify } from "util";

export default function flatfileEventListener(listener) {


  listener.on("**", (event) => {
    console.log(`Received event: ${event.topic}`);
  });



  // 2. Automate Extraction and Mapping
  listener.use(ExcelExtractor({ rawNumbers: true }));
  // listener.use(
  //   automap({
  //     accuracy: "confident",
  //     onFailure: console.error,
  //   })
  // );

  // 3. Transform and Validate
  listener.use(
    recordHook("equipmentList", async (record, event) => {
      const vin = record.get('VIN')


      const validVIN = `^(?!(T|t)otal|TOTAL|(V|v)in|VIN|(V|v)alue|VALUE)([a-zA-Z0-9])[a-zA-Z0-9]*([a-zA-Z0-9])$`
      const regex = new RegExp(validVIN)

      if (!regex.test(vin)) {
        record.addError("VIN", "VIN is invalid");
        return record
      }
    })
  );

  listener.on(
    "job:ready",
    { job: "equipmentList:submit" },
    async ({ context: { jobId, workbookId }, payload }) => {
      const { data: workbook } = await api.workbooks.get(workbookId);
      const { data: workbookSheets } = await api.sheets.list({ workbookId });

      const sheets = [];
      for (const [_, element] of workbookSheets.entries()) {
        const { data: records } = await api.records.get(element.id);
        sheets.push({
          ...element,
          ...records,
        });
      }

      try {
        await api.jobs.ack(jobId, {
          info: "Starting job to submit action to webhook.site",
          progress: 10,
        });

        console.log(JSON.stringify(sheets, null, 2));

        const webhookReceiver =
          process.env.WEBHOOK_SITE_URL ||
          "https://webhook.site/a67b0cb4-cdc0-4505-9b6f-3a825d9e0802"; //update this

        const response = await axios.post(
          webhookReceiver,
          {
            ...payload,
            method: "axios",
            workbook: {
              ...workbook,
              sheets,
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 200) {
          const rejections = response.data.rejections;
          if (rejections) {
            const totalRejectedRecords = await responseRejectionHandler(
              rejections
            );
            return await api.jobs.complete(jobId, {
              outcome: {
                next: {
                  type: "id",
                  id: rejections.id,
                  label: "See rejections...",
                },
                message: `Data was submission was partially successful. ${totalRejectedRecords} record(s) were rejected.`,
              },
            });
          }
          return await api.jobs.complete(jobId, {
            outcome: {
              message:
                "Data was successfully submitted to webhook.site. Go check it out at " +
                webhookReceiver +
                ".",
            },
          });
        } else {
          throw new Error("Failed to submit data to webhook.site");
        }
      } catch (error) {
        console.log(`webhook.site[error]: ${JSON.stringify(error, null, 2)}`);

        await api.jobs.fail(jobId, {
          outcome: {
            message:
              "This job failed probably because it couldn't find the webhook.site URL.",
          },
        });
      }
    }
  );
}
