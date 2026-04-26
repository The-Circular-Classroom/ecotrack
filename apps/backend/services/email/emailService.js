const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

// Initialize SES Client
const sesClient = new SESv2Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
});

// Initialize SNS Client
const snsClient = new SNSClient({
    region: process.env.AWS_REGION || 'ap-southeast-1',
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// ============================================================
// Email & Notification Helpers
// ============================================================

const send_email = async (toAddresses, subject, body) => {
    if (!process.env.SES_FROM_EMAIL) {
        console.warn('SES_FROM_EMAIL not set, skipping email notification');
        return;
    }

    const recipients = Array.isArray(toAddresses) ? toAddresses : [toAddresses];
    const uniqueRecipients = [...new Set(recipients.filter(e => e))];

    if (uniqueRecipients.length === 0) {
        console.warn('No valid recipients, skipping email notification');
        return;
    }

    try {
        await sesClient.send(new SendEmailCommand({
            FromEmailAddress: FROM_EMAIL,
            Destination: {
                ToAddresses: uniqueRecipients,
            },
            Content: {
                Simple: {
                    Subject: { Data: subject },
                    Body: {
                        Text: { Data: body },
                    },
                },
            },
        }));
        console.log(`Email sent to: ${uniqueRecipients.join(', ')}`);
    } catch (error) {
        console.error('Failed to send email:', JSON.stringify(error, null, 2));
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.$metadata?.httpStatusCode);
    }
}

const publish_to_sns = async (subject, message) => {
    if (!SNS_TOPIC_ARN) {
        console.warn('SNS_TOPIC_ARN not set, skipping SNS notification');
        return;
    }

    try {
        await snsClient.send(new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Subject: subject,
            Message: message,
        }));
        console.log('SNS notification published:', subject);
    } catch (error) {
        console.error('Failed to publish SNS notification:', error.message);
    }
}

module.exports = {
    send_email,
    publish_to_sns
};