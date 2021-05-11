![Beekeeper Header](https://i.imgur.com/WWwmLWT.png)

## Overview
Beekeeper is open-sourced Backend as a Service (BaaS) built to handle bursty traffic from one-off events like sale or promotion.  Set up a virtual virtual waitroom in a few minutes, and tear it down in seconds.

![Beekeeper deploy](https://i.imgur.com/lja8wBi.png)

There is a difference between the infrastructure needed for normal business activities and infrastructure needed for bursty traffic related to one-off events. An abrupt increase in website traffic can be the effect of many different causes. One such cause is an event like a Black Friday sale or similar promotion. If the existing infrastructure is unprepared the spike in traffic it may result in a Denial of Service. The desired service may be unavailable until traffic declines to a manageable level. Beekeeper is a fast and flexible solution to this bursty traffic.

### Beekeeper Architecture

![Beekeeper architecture](https://i.imgur.com/mssNhan.png)

## The Team
**[Ryan Schaul](https://example.com)** *Software Engineer* Chicago, IL

**[Ian Eustis](https://example.com)** *Software Engineer* Portland, OR

**[Justin Zeng](https://example.com)** *Software Engineer* Los Angeles, CA

**[Aaron Crane](https://example.com)** *Software Engineer* San Francisco, CA

## Getting Started
### Prerequisites
* [AWS account](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/)
* [Set your access keys](https://docs.aws.amazon.com/powershell/latest/userguide/pstools-appendix-sign-up.html)
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
* Node.js >= 12.x
* NPM
### Install Beekeeper
``` bash
npm install -g beekeeper-cli
```
---

## Commands
#### `beekeeper init`
*creates a waitroom account, enabling the deploy, destroy, on, off, and set-rate commands.  `init` can be run multiple times to create mutiple accounts*

![Beekeeper init](https://i.imgur.com/2Eyx4VW.png)

The `init` command will prompt for the following information:
- Profile name - *differentiates your various waitrooms from each other, and lets you choose which one to create, modify, or destroy.*
- Waiting room name - *publicly displayed in the online waitroom, so it's best to choose something that describes what the waitroom is for, such as the name of your company so that your customers know that they're in the right place*
- AWS region - *the aws region that you would like to place your waitroom in*
- URL endpoint/protected URL - *the URL that you want to direct people to after they go through the waitroom.*
- Allowed users per minute - *the max amount of users that you want to allow onto your website per minute. The ideal amount differs greatly between websites, and its best to find your ideal traffic through load testing and tracking analytics. Beekeeper comfortably handles 10-3000 entries per minute*
---
#### `beekeeper deploy <name>`
*Builds custom files, uploads them to s3 buckets, and sets up the waitroom architecture on your aws account. Once its done, you are given two URLS; the waiting room URL is what you provide to your customers/viewers publicly, and the client check endpoint can optionally be added to your own back end to prevent people from skipping the queue.*

The following components will be created on your aws account:

- A master IAM role
- S3 Bucket with all needed html/css/js
- SQS with dead letter queue (DLQ) attached
- DynamoDB table
- 2 lambdas
- API Gateway
- All required permissions
- ![Beekeeper deploy](https://i.imgur.com/lja8wBi.png)
---
#### `beekeeper destroy <name>`
*Removes all of the aws components associated with the given name.  The URLs will no longer be valid*

---
#### `beekeeper config`
*Lists all of the accounts that were created with `init`*

---
#### `beekeeper off <name>`
*Turns off the waitroom. The provided URLS will continue to be valid, but people will be sent directly to the destination URL*

---
#### `beekeeper on <name>`
*Turns a waitroom on that had been previously turned off*

---
#### `beekeeper set-rate <name> <value>`
*Changes the rate at which people are sent from the waitroom to the final destination. Must be an integer between 10-3000*

---