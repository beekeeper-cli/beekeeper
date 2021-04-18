FROM public.ecr.aws/lambda/nodejs:12
COPY cli.js package*.json ./
RUN npm install
CMD [ "app.handler" ]