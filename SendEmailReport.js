#!/usr/bin/env node
"use strict";
const nodemailer = require("nodemailer");
const commandLineArgs = require('command-line-args');
var request = require('request');
let PassThrough = require('stream').PassThrough;

const optionDefinitions = [
  { name: 'from', type: String },
  { name: 'to', type: String, multiple: true },
  { name: 'subject', type: String },
  { name: 'report', type: String, multiple: true },
  { name: 'smtpServer', type: String },
  { name: 'smtpPort', type: String },
  { name: 'smtpUser', type: String },
  { name: 'smtpPass', type: String }
]
const options = commandLineArgs(optionDefinitions);

async function main() {
  var attachments = [];
  options.report.forEach(reportElement => {
    let reportParts = reportElement.split('|');
    let nameOfAttachment = reportParts[0];
    let pdfUrlStream = new PassThrough();
    request
      .get({
        url: reportParts[1]
      })
      .on('error', function (err) {
        console.log(err);
      })
      .pipe(pdfUrlStream);
    attachments.push({
      filename: nameOfAttachment,
      content: pdfUrlStream
    });
  });

  let transporter = nodemailer.createTransport({
    host: options.smtpServer,
    port: options.smtpPort,
    secure: false,
    auth: {
      user: options.smtpUser,
      pass: options.smtpPass,
    }
  });

  let info = await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: "See attached.",
    html: "<p>See attached.</p>",
    attachments: attachments
  });

  console.log("Message sent: %s", info.messageId);
}

main().catch(console.error);
