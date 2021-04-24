const prompts = require("prompts");
const logger = require("./logger");
const chalk = require("chalk");

const promptQuestions = async () => {
  const questions = [
    {
      type: "text",
      name: "WAITING_ROOM_NAME",
      message: "Enter waiting room name:",
      validate: (value) => {
        if (!/^[a-z0-9]+$/i.test(value)) {
          return "Name can only contain alphanumerics.";
        }
        if (value.length > 20) {
          return `Name can't exceed 20 characters.`;
        }
        return true;
      },
    },
    {
      type: "select",
      name: "REGION",
      message: "Select a region:",
      choices: [
        {
          title: "US East (Ohio)",
          description: "us-east-2",
          value: "us-east-2",
        },
        {
          title: "US East (N. Virginia)",
          description: "us-east-1",
          value: "us-east-1",
        },
        {
          title: "US West (N. California)",
          description: "us-west-1",
          value: "us-west-1",
        },
        {
          title: "US West (Oregon)",
          description: "us-west-2",
          value: "us-west-2",
        },
        {
          title: "Africa (Cape Town)",
          description: "af-south-1",
          value: "af-south-1",
        },
        {
          title: "Asia Pacific (Hong Kong)",
          description: "ap-east-1",
          value: "ap-east-1",
        },
        {
          title: "Asia Pacific (Mumbai)",
          description: "ap-south-1",
          value: "ap-south-1",
        },
        {
          title: "Asia Pacific (Osaka)",
          description: "ap-northeast-3",
          value: "ap-northeast-3",
        },
        {
          title: "Asia Pacific (Seoul)",
          description: "ap-northeast-2",
          value: "ap-northeast-2",
        },
        {
          title: "Asia Pacific (Singapore)",
          description: "ap-southeast-1",
          value: "ap-southeast-1",
        },
        {
          title: "Asia Pacific (Sydney)",
          description: "ap-southeast-2",
          value: "ap-southeast-2",
        },
        {
          title: "Asia Pacific (Tokyo)",
          description: "ap-northeast-1",
          value: "ap-northeast-1",
        },
        {
          title: "Canada (Central)",
          description: "ca-central-1",
          value: "ca-central-1",
        },
        {
          title: "China (Beijing)",
          description: "cn-north-1",
          value: "cn-north-1",
        },
        {
          title: "China (Ningxia)",
          description: "cn-northwest-1",
          value: "cn-northwest-1",
        },
        {
          title: "Europe (Frankfurt)",
          description: "eu-central-1",
          value: "eu-central-1",
        },
        {
          title: "Europe (Ireland)",
          description: "eu-west-1",
          value: "eu-west-1",
        },
        {
          title: "Europe (London)",
          description: "eu-west-2",
          value: "eu-west-2",
        },
        {
          title: "Europe (Milan)",
          description: "eu-south-1",
          value: "eu-south-1",
        },
        {
          title: "Europe (Paris)",
          description: "eu-west-3",
          value: "eu-west-3",
        },
        {
          title: "Europe (Stockholm)",
          description: "eu-north-1",
          value: "eu-north-1",
        },
        {
          title: "Middle East (Bahrain)",
          description: "me-south-1",
          value: "me-south-1",
        },
        {
          title: "South America (São Paulo)",
          description: "sa-east-1",
          value: "sa-east-1",
        },
        {
          title: "AWS GovCloud (US-East)",
          description: "gov-east-1",
          value: "us-gov-east-1",
        },
        {
          title: "AWS GovCloud (US-West)",
          description: "gov-west-1",
          value: "us-gov-west-1",
        },
      ],
      initial: 0,
    },
    {
      type: "text",
      name: "PROTECT_URL",
      message: "Enter the URL to protect:",
      validate: (value) => {
        if (
          !/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i.test(
            value
          )
        ) {
          return "Please enter a valid URL.";
        }
        if (value.length > 2000) {
          return `URL can't exceed 2000 characters.`;
        }
        return true;
      },
    },
    // {
    //   type: 'number',
    //   name: 'RATE',
    //   message: 'Enter the URL to protect:',
    //   validate: value => {
    //     if (!(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i.test(value))) {
    //       return "Please enter a valid URL."
    //     }
    //     if (value.length > 2000) {
    //       return `URL can't exceed 2000 characters.`
    //     }
    //     return true;
    //   }
    // },
  ];

  const onSubmit = (prompt) => {
    if (prompt.name === "PROTECT_URL") {
      console.log("");
      console.log(
        `Now enter ${chalk.yellow.bold("sealbuzz deploy")} to deploy your waiting room infrastructure`
      );
      return true;
    }
    return false;
  }

  const onCancel = (prompt) => {
    console.log("");
    console.log('Exiting prompt.');
  }

  try {
    console.log("Lets configure your waiting room.");
    console.log("Press Ctrl+C to cancel at anytime.");
    console.log("");

    const response = await prompts(questions, {onSubmit, onCancel});
    return response;
  } catch (err) {
    logger.log("Error", err);
  }
};

module.exports = {
  promptQuestions,
};
